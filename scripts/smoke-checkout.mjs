/**
 * Headless end-to-end smoke for the bank-transfer checkout flow.
 *
 * - Seeds the age-gate-verified flag.
 * - Adds one product to the cart from the library.
 * - Goes to /checkout, fills the shipping form, submits.
 * - Captures the resulting order reference + screenshots.
 *
 * Used to verify the post-migration order creation path end-to-end against
 * the live Supabase. Will write a real row to payment_tracking — clean it up
 * afterwards with the SMOKE order_reference prefix.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:5173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

await ctx.addInitScript(() => {
  try {
    localStorage.setItem('laminin-entry-verified', '1');
  } catch {}
});

const page = await ctx.newPage();

const consoleErrors = [];
const failedRequests = [];
const rpcResponses = [];

page.on('pageerror', (err) => consoleErrors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('requestfailed', (req) =>
  failedRequests.push({ url: req.url(), reason: req.failure()?.errorText })
);
page.on('response', async (res) => {
  if (res.status() >= 400) {
    failedRequests.push({ url: res.url(), reason: `HTTP ${res.status()}` });
  }
  // Capture the upsert_payment_tracking RPC response to verify server math.
  if (res.url().includes('/rest/v1/rpc/upsert_payment_tracking')) {
    try {
      const body = await res.json();
      rpcResponses.push({ status: res.status(), body });
    } catch {
      rpcResponses.push({ status: res.status(), body: '<non-json>' });
    }
  }
});

await mkdir(path.resolve('tmp'), { recursive: true });

console.log('1. Open /library');
await page.goto(`${BASE}/library`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: 'tmp/smoke-01-library.png', fullPage: false });

console.log('2. Click first "Add to cart" button');
// Buttons have aria-label "Add <name> to cart" — match that pattern.
const addBtn = page.locator('button[aria-label^="Add "][aria-label$=" to cart"]').first();
await addBtn.scrollIntoViewIfNeeded();
await addBtn.click({ timeout: 10_000 });
await page.waitForTimeout(500);

console.log('3. Go to /cart');
await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.screenshot({ path: 'tmp/smoke-02-cart.png', fullPage: false });

const cartHasItems = await page
  .getByRole('button', { name: /Increase quantity/i })
  .count();
console.log(`   Cart has ${cartHasItems} qty controls`);

if (cartHasItems === 0) {
  console.error('!! Cart appears empty — add to cart may have failed');
  await browser.close();
  process.exit(1);
}

console.log('4. Go to /checkout');
await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

console.log('5. Fill shipping form');
const fill = async (id, value) => {
  const el = page.locator(`#${id}`);
  await el.fill(value);
};
await fill('firstName', 'Smoke');
await fill('lastName', 'Test');
await fill('email', `smoke+${Date.now()}@example.com`);
await fill('phone', '+61400000000');
await fill('address', '1 Smoke St');
await fill('city', 'Sydney');
await fill('state', 'NSW');
await fill('postcode', '2000');
// Country is a <select> that defaults to Australia — leave as-is.

await page.screenshot({ path: 'tmp/smoke-03-checkout-filled.png', fullPage: false });

console.log('6. Submit');
// Find the primary submit button by role + name.
await page
  .getByRole('button', { name: /place order|continue|submit|confirm/i })
  .first()
  .click()
  .catch(async () => {
    // Fallback: click any submit-typed button inside the form
    await page.locator('form button[type="submit"]').first().click();
  });

console.log('7. Wait for response (max 15s)');
await page.waitForTimeout(8000);

// Did we land on /order-confirmation OR see the bank transfer modal?
const onConfirmation = page.url().includes('/order-confirmation');
const modalVisible = (await page.getByText(/Order Confirmed|Order received/i).count()) > 0;

await page.screenshot({ path: 'tmp/smoke-04-after-submit.png', fullPage: true });

console.log('\n=== RESULT ===');
console.log(`URL after submit:    ${page.url()}`);
console.log(`On order-conf page?  ${onConfirmation}`);
console.log(`Bank transfer modal? ${modalVisible}`);
console.log(`RPC calls captured:  ${rpcResponses.length}`);
for (const r of rpcResponses) {
  console.log(`  status=${r.status}  body=${JSON.stringify(r.body).slice(0, 400)}`);
}
console.log(`Page errors:         ${consoleErrors.length}`);
for (const e of consoleErrors.slice(0, 10)) console.log(`  - ${e.slice(0, 200)}`);
console.log(`Failed requests:     ${failedRequests.length}`);
for (const r of failedRequests.slice(0, 10)) console.log(`  - ${r.reason} ${r.url}`);

await browser.close();
process.exit(rpcResponses.length > 0 && rpcResponses[0].status < 400 ? 0 : 2);
