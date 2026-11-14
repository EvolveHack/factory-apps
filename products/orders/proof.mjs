// Proof for Order Flows. Runs the test order for one customer and checks the page renders.
// Env: PAGE_URL, CUSTOMER, BOARD_PACKAGE_JSON, VERCEL_AUTOMATION_BYPASS_SECRET.
import { createRequire } from "node:module";
import path from "node:path";

const PAGE_URL = process.env.PAGE_URL;
const CUSTOMER = process.env.CUSTOMER;
const SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const PKG = process.env.BOARD_PACKAGE_JSON || path.resolve("package.json");

const headers = SECRET ? { "x-vercel-protection-bypass": SECRET } : {};

function fail(reason) {
  console.log(`ASSERT_FAIL ${reason}`);
  process.exit(1);
}

const killer = setTimeout(() => fail("proof took longer than 55 seconds"), 55_000);
killer.unref();

if (!PAGE_URL) fail("PAGE_URL is not set");
if (!CUSTOMER) fail("CUSTOMER is not set");

const page = new URL(PAGE_URL);
const pagePath = page.pathname.replace(/\/+$/, "");
if (!pagePath.endsWith(`/${CUSTOMER}`)) fail(`PAGE_URL ${PAGE_URL} is not the page for ${CUSTOMER}`);
const apiUrl = `${page.origin}${pagePath}/api/test-order`;

// 1. Test order through the engine.
let data;
try {
  const res = await fetch(apiUrl, { method: "POST", headers, signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    fail(`test order returned status ${res.status} and no JSON`);
  }
  console.log(`ok test order API answered with status ${res.status}`);
} catch (err) {
  fail(`could not reach ${apiUrl}: ${err.message}`);
}

if (data.customer !== CUSTOMER) fail(`test order answered for ${data.customer}, expected ${CUSTOMER}`);
if (!Array.isArray(data.workflows) || data.workflows.length === 0) fail("no workflows found");
console.log(`ok ${data.workflows.length} workflows found`);

if (data.errors.length > 0) {
  const e = data.errors[0];
  fail(`workflow ${e.workflowId} threw on ${e.trigger}: ${e.message}`);
}
console.log("ok no workflow errors");

for (const wf of data.workflows) {
  const run = data.runs.find((r) => r.workflowId === wf.id && r.trigger === wf.trigger);
  if (!run) fail(`workflow ${wf.id} did not run`);
  if (!run.ok) fail(`workflow ${wf.id} threw`);
  console.log(`ok workflow ${wf.id} ran on ${wf.trigger}${run.matched ? " and matched" : ""}`);
}
console.log(`ok test order posted ${data.messages.length} messages`);

// 2. The page renders.
let chromium;
try {
  ({ chromium } = createRequire(PKG)("playwright"));
} catch (err) {
  fail(`could not load playwright from ${PKG}: ${err.message}`);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ extraHTTPHeaders: headers, viewport: { width: 1280, height: 800 } });
  const tab = await context.newPage();
  const res = await tab.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: 25_000 });
  if (!res || res.status() >= 400) fail(`page returned status ${res ? res.status() : "none"}`);
  await tab.waitForSelector(`[data-testid="orders-board"][data-customer="${CUSTOMER}"]`, { timeout: 15_000 });
  const rows = await tab.locator('[data-testid="workflow-row"]').count();
  if (rows !== data.workflows.length) fail(`page shows ${rows} workflows, expected ${data.workflows.length}`);
  const orders = await tab.locator('[data-testid="order-row"]').count();
  if (orders === 0) fail("page shows no orders");
  console.log(`ok page renders with ${orders} orders and ${rows} workflows`);
} catch (err) {
  fail(`page check failed: ${err.message.split("\n")[0]}`);
} finally {
  await browser.close();
}

console.log("PROOF_OK");
process.exit(0);
