// Proof for the Helpdesk Agent. Replays scripted visitor messages against one customer's chat API.
// Env: PAGE_URL (customer page, for example https://host/helpdesk/lumen), CUSTOMER (optional,
// defaults to the last path part), VERCEL_AUTOMATION_BYPASS_SECRET (optional).
// Scenarios: scenarios/<customer>.json plus tenants/<customer>/scenarios.json.
// Each scenario: { name, message, expect: { tools?: string[] (all must be called), anyKeyword?: string[] } }.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const started = Date.now();
const here = dirname(fileURLToPath(import.meta.url));
const pageUrl = (process.env.PAGE_URL ?? "").replace(/\/+$/, "");

function fail(reason) {
  console.log(`ASSERT_FAIL ${reason}`);
  process.exit(1);
}

if (!pageUrl) fail("PAGE_URL is not set");
const customer = process.env.CUSTOMER || new URL(pageUrl).pathname.split("/").filter(Boolean).pop();
const apiUrl = `${pageUrl}/api/chat`;

const headers = { "content-type": "application/json" };
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  headers["x-vercel-set-bypass-cookie"] = "true";
}

function readList(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : [];
}
const scenarios = [
  ...readList(join(here, "scenarios", `${customer}.json`)),
  ...readList(join(here, "tenants", customer, "scenarios.json")),
];
if (!scenarios.length) fail(`no scenarios for customer ${customer}`);

async function timed(url, init, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 1. The page renders for this customer.
try {
  const res = await timed(pageUrl, { headers }, 20000);
  const html = await res.text();
  if (!res.ok) fail(`page returned ${res.status}`);
  if (!html.includes('data-testid="helpdesk-console"')) fail("page is missing the helpdesk console");
  console.log(`ok page renders ${pageUrl}`);
} catch (err) {
  fail(`page did not load: ${err.message}`);
}

// 2. Replay each scenario.
async function runScenario(s) {
  try {
    const res = await timed(apiUrl, { method: "POST", headers, body: JSON.stringify({ messages: [{ role: "user", content: s.message }] }) }, 40000);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { s, ok: false, why: `chat returned ${res.status} ${data.error ?? ""}`.trim() };
    const reply = String(data.reply ?? "");
    const used = data.tools ?? [];
    const missingTools = (s.expect?.tools ?? []).filter((t) => !used.includes(t));
    if (missingTools.length) return { s, ok: false, why: `did not call ${missingTools.join(", ")} (called: ${used.join(", ") || "none"})` };
    const keys = s.expect?.anyKeyword ?? [];
    if (keys.length && !keys.some((k) => reply.toLowerCase().includes(k.toLowerCase()))) {
      return { s, ok: false, why: `reply has none of [${keys.join(", ")}]: ${reply.slice(0, 160)}` };
    }
    return { s, ok: true, why: used.length ? `tools: ${used.join(", ")}` : "no tools" };
  } catch (err) {
    return { s, ok: false, why: err.name === "AbortError" ? "timed out" : err.message };
  }
}

const results = [];
const queue = [...scenarios];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const r = await runScenario(queue.shift());
      console.log(`${r.ok ? "ok" : "FAIL"} ${r.s.name}: ${r.why}`);
      results.push(r);
    }
  }),
);

const failed = results.filter((r) => !r.ok);
const secs = ((Date.now() - started) / 1000).toFixed(1);
if (failed.length) fail(`${failed.length} of ${results.length} scenarios failed for ${customer} (${failed.map((r) => r.s.name).join(", ")}) in ${secs}s`);
console.log(`PASS ${results.length} scenarios for ${customer} in ${secs}s`);
