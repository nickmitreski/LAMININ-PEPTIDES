/** Same as inspect-page but sets the entry-verified flag first so we see past the age gate. */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const PATHNAME = process.argv[2] || '/library';
const BASE = process.argv[3] || 'http://localhost:5173';
const TARGET_URL = new URL(PATHNAME, BASE).href;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

// Seed the entry-verified flag BEFORE the app loads.
await ctx.addInitScript(() => {
  try { localStorage.setItem('laminin-entry-verified', '1'); } catch {}
});

const page = await ctx.newPage();

const consoleMessages = [];
const failedRequests = [];

page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => consoleMessages.push({ type: 'pageerror', text: err.message }));
page.on('requestfailed', (req) => failedRequests.push({ url: req.url(), reason: req.failure()?.errorText }));
page.on('response', (res) => {
  if (res.status() >= 400) failedRequests.push({ url: res.url(), reason: `HTTP ${res.status()}` });
});

console.log(`→ Opening ${TARGET_URL} (entry-verified seeded)`);
await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30_000 }).catch((err) => {
  console.log(`! goto error: ${err.message}`);
});
await page.waitForTimeout(2000);

const title = await page.title();
const mainText = await page.locator('main, [id="main-content"]').first().innerText().catch(() => '');
const counts = await page.evaluate(() => ({
  productLinks: document.querySelectorAll('a[href*="/products/"]').length,
  images: document.querySelectorAll('img').length,
  pictures: document.querySelectorAll('picture').length,
  buttons: document.querySelectorAll('button').length,
}));

const slug = PATHNAME.replace(/[\W]+/g, '-').replace(/^-|-$/g, '') || 'root';
await mkdir(path.resolve('tmp'), { recursive: true });
const screenshotPath = path.resolve('tmp', `verified-${slug}.png`);
await page.screenshot({ path: screenshotPath, fullPage: true });

console.log('\n=== PAGE REPORT ===');
console.log(`URL:           ${TARGET_URL}`);
console.log(`Title:         ${title}`);
console.log(`Counts:        ${JSON.stringify(counts)}`);
console.log(`Screenshot:    ${screenshotPath}`);
console.log('\n--- <main> text (first 1600 chars) ---');
console.log(mainText.slice(0, 1600) || '(empty)');
console.log('\n--- Console messages ---');
for (const m of consoleMessages.slice(0, 25)) {
  console.log(`[${m.type}] ${m.text.slice(0, 240)}`);
}
console.log('\n--- Failed requests / HTTP errors ---');
console.log(failedRequests.length === 0 ? '(none)' : failedRequests.slice(0, 15).map((r) => `  ${r.reason}  ${r.url}`).join('\n'));

await browser.close();
process.exit(0);
