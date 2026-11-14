// Proof for the Shopping App: on a phone-sized screen, the app opens, shows products,
// and a product can be added to the cart. Prints one line per check.
// Env: PAGE_URL, CUSTOMER, BOARD_PACKAGE_JSON, VERCEL_AUTOMATION_BYPASS_SECRET (optional).
import { createRequire } from "node:module";
import { resolve } from "node:path";

const { PAGE_URL, CUSTOMER, BOARD_PACKAGE_JSON, VERCEL_AUTOMATION_BYPASS_SECRET } = process.env;

function fail(reason) {
  console.log(`ASSERT_FAIL ${reason}`);
  process.exit(1);
}

if (!PAGE_URL) fail("PAGE_URL is not set");
const require = createRequire(resolve(BOARD_PACKAGE_JSON || "package.json"));
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  fail("playwright could not be loaded from BOARD_PACKAGE_JSON");
}

const guard = setTimeout(() => fail("proof took longer than 55 seconds"), 55_000);
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    extraHTTPHeaders: VERCEL_AUTOMATION_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET, "x-vercel-set-bypass-cookie": "true" }
      : {},
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(15_000);

  const res = await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" });
  if (!res || !res.ok()) fail(`page returned ${res ? res.status() : "no response"}`);
  console.log(`ok page loaded (${res.status()})`);

  const app = page.getByTestId("shop-app");
  await app.waitFor();
  const customer = await app.getAttribute("data-customer");
  if (CUSTOMER && customer !== CUSTOMER) fail(`app shows ${customer}, expected ${CUSTOMER}`);
  await page.getByTestId("screen-home").waitFor();
  const cards = page.getByTestId("product-card");
  await cards.first().waitFor();
  const count = await cards.count();
  if (count < 1) fail("home shows no products");
  console.log(`ok home renders ${count} products for ${customer}`);

  const first = cards.first();
  const productId = await first.getAttribute("data-product-id");
  // The home screen can show before it answers taps. Tap the product until its screen opens.
  const productScreen = page.getByTestId("screen-product");
  for (let attempt = 0; attempt < 8 && !(await productScreen.isVisible()); attempt++) {
    await first.click({ timeout: 1500 }).catch(() => undefined);
    await productScreen.waitFor({ timeout: 1500 }).catch(() => undefined);
  }
  await productScreen.waitFor();
  const name = (await page.getByTestId("product-name").innerText()).trim();
  console.log(`ok product opens: ${name}`);

  await page.getByTestId("add-to-cart").click();
  await page.getByTestId("nav-cart").click();
  await page.getByTestId("screen-cart").waitFor();
  const item = page.locator(`[data-testid="cart-item"][data-product-id="${productId}"]`);
  await item.waitFor().catch(() => fail(`${name} is not in the cart`));
  const qty = (await item.getByTestId("cart-item-qty").innerText()).trim();
  if (qty !== "1") fail(`cart shows quantity ${qty}, expected 1`);
  console.log(`ok cart has ${name} x${qty}`);

  await page.getByTestId("nav-orders").click();
  await page.getByTestId("screen-orders").waitFor();
  const orders = await page.getByTestId("order-card").count();
  if (orders < 1) fail("orders screen shows no orders");
  console.log(`ok orders screen shows ${orders} orders`);

  if (errors.length) fail(`page error: ${errors[0]}`);
  console.log("ok no page errors");
} catch (e) {
  fail(e instanceof Error ? e.message.split("\n")[0] : String(e));
} finally {
  clearTimeout(guard);
  await browser.close();
}
