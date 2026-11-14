// Proof for Cold Chain Monitor, one customer.
// Env: PAGE_URL, CUSTOMER, BOARD_PACKAGE_JSON, VERCEL_AUTOMATION_BYPASS_SECRET (optional on localhost).
// 1. Replays yesterday's sensor readings through the customer's alert rules on the preview.
// 2. Opens the page in a browser and checks the floor map renders and the live clock runs.
// Prints one line per check. Exit 0 when all pass, else prints ASSERT_FAIL <reason> and exits 1.
import { createRequire } from "node:module";
import { join } from "node:path";

const { PAGE_URL, CUSTOMER, BOARD_PACKAGE_JSON, VERCEL_AUTOMATION_BYPASS_SECRET } = process.env;
const MIN_UNITS = 8;

function fail(reason) {
  console.log(`ASSERT_FAIL ${reason}`);
  process.exit(1);
}
function pass(line) {
  console.log(`ok ${line}`);
}
setTimeout(() => fail("proof took longer than 55 seconds"), 55_000).unref();

if (!PAGE_URL) fail("PAGE_URL is not set");
if (!CUSTOMER) fail("CUSTOMER is not set");

const headers = VERCEL_AUTOMATION_BYPASS_SECRET
  ? { "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET, "x-vercel-set-bypass-cookie": "true" }
  : {};

async function checkReplay() {
  const url = `${new URL(PAGE_URL).origin}/coldchain/${CUSTOMER}/api/replay`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    fail(`replay API returned ${res.status} and not JSON: ${text.slice(0, 120)}`);
  }
  if (!res.ok || !data.ok) fail(`replay API returned ${res.status}: ${data.error ?? "no error text"}`);
  pass(`replay API answered for ${data.customer}`);

  if (data.customer !== CUSTOMER) fail(`replay ran for ${data.customer}, expected ${CUSTOMER}`);
  if (!(data.units >= MIN_UNITS)) fail(`replay has ${data.units} units, expected at least ${MIN_UNITS}`);
  if (!(data.readings >= data.units * 60)) fail(`replay has only ${data.readings} readings`);
  pass(`replay ran ${data.readings} readings across ${data.units} units`);

  if (!Array.isArray(data.rules) || data.rules.length === 0) fail("customer has no alert rules");
  const ruleIds = new Set(data.rules.map((r) => r.id));
  if (ruleIds.size !== data.rules.length) fail("two alert rules share one id");
  if (!Array.isArray(data.alerts) || !Array.isArray(data.pages)) fail("replay result has no alerts or pages list");
  if (data.alerts.length > 200) fail(`replay fired ${data.alerts.length} alerts, a rule fires too often`);
  for (const a of data.alerts) {
    if (!ruleIds.has(a.ruleId)) fail(`alert from unknown rule ${a.ruleId}`);
    if (typeof a.message !== "string" || a.message.length === 0) fail(`rule ${a.ruleId} returned an empty message`);
  }
  const paged = data.alerts.filter((a) => a.paged).length;
  if (paged !== data.pages.length) fail(`${paged} paged alerts but ${data.pages.length} pages`);
  pass(`${data.rules.length} rules fired ${data.alerts.length} alerts and ${data.pages.length} pages`);
  for (const a of data.alerts) console.log(`  ${a.clock} ${a.ruleId} ${a.unitId}${a.paged ? " (paged)" : ""}`);
}

async function checkPage() {
  const require = createRequire(BOARD_PACKAGE_JSON ?? join(process.cwd(), "package.json"));
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    fail("playwright did not load from BOARD_PACKAGE_JSON");
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ extraHTTPHeaders: headers, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 25_000 });
    if (!res || !res.ok()) fail(`page returned ${res?.status()}`);
    await page.getByTestId("coldchain-map").waitFor({ timeout: 15_000 });
    const units = await page.getByTestId("coldchain-unit").count();
    if (units < MIN_UNITS) fail(`map shows ${units} units, expected at least ${MIN_UNITS}`);
    pass(`floor map renders ${units} units`);

    const first = await page.getByTestId("coldchain-clock").textContent();
    await page.waitForFunction(
      (start) => document.querySelector('[data-testid="coldchain-clock"]')?.textContent !== start,
      first,
      { timeout: 8_000 },
    ).catch(() => fail(`live clock stayed at ${first}`));
    pass(`live simulator runs (clock moved from ${first})`);

    if (errors.length) fail(`page error: ${errors[0]}`);
    pass("no page errors");
  } finally {
    await browser.close();
  }
}

try {
  await checkReplay();
  await checkPage();
  console.log("all checks passed");
  process.exit(0);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
