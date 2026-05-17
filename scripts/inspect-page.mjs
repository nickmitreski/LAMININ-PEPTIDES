/**
 * Inspect what the storefront renders at a given URL. Used to remote-diagnose
 * "the page is blank" reports without needing screenshots emailed back.
 *
 * Usage:
 *   node scripts/inspect-page.mjs                       # http://localhost:5173/
 *   node scripts/inspect-page.mjs /library              # http://localhost:5173/library
 *   node scripts/inspect-page.mjs /library https://...  # different base URL
 *
 * Output: text report + a screenshot at ./tmp/inspect-<slug>.png
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const PATHNAME = process.argv[2] || '/';
const BASE = process.argv[3] || 'http://localhost:5173';
const TARGET_URL = new URL(PATHNAME, BASE).href;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const consoleMessages = [];
const failedRequests = [];
const allRequests = [];

page.on('console', (msg) => {
  consoleMessages.push({ type: msg.type(), text: msg.text() });
});
page.on('pageerror', (err) => {
  consoleMessages.push({ type: 'pageerror', text: err.message });
});
page.on('requestfailed', (req) => {
  failedRequests.push({ url: req.url(), reason: req.failure()?.errorText });
});
page.on('response', (res) => {
  if (res.status() >= 400) {
    failedRequests.push({ url: res.url(), reason: `HTTP ${res.status()}` });
  }
  if (res.url().includes('/images/')) {
    allRequests.push({ url: res.url(), status: res.status() });
  }
});

console.log(`→ Opening ${TARGET_URL}`);
await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30_000 }).catch((err) => {
  console.log(`! goto error: ${err.message}`);
});

// Wait a bit more for any lazy renders
await page.waitForTimeout(1500);

const title = await page.title();
const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 2000);
const hasMain = await page.locator('main, [id="main-content"]').count();
const mainText = hasMain
  ? (await page.locator('main, [id="main-content"]').first().innerText().catch(() => '')).slice(0, 1200)
  : '(no <main> element found)';

const counts = await page.evaluate(() => {
  const q = (sel) => document.querySelectorAll(sel).length;
  return {
    productLinks: q('a[href*="/products/"]'),
    images: q('img'),
    imagesWithSrc: Array.from(document.querySelectorAll('img'))
      .filter((i) => i.src && !i.src.startsWith('data:')).length,
    pictures: q('picture'),
    buttons: q('button'),
    h1: q('h1'),
    h2: q('h2'),
    h3: q('h3'),
  };
});

const slug = PATHNAME.replace(/[\W]+/g, '-').replace(/^-|-$/g, '') || 'root';
const screenshotDir = path.resolve('tmp');
await mkdir(screenshotDir, { recursive: true });
const screenshotPath = path.join(screenshotDir, `inspect-${slug}.png`);
await page.screenshot({ path: screenshotPath, fullPage: true });

console.log('\n=== PAGE REPORT ===');
console.log(`URL:                ${TARGET_URL}`);
console.log(`Title:              ${title}`);
console.log(`<main> elements:    ${hasMain}`);
console.log(`Counts:             ${JSON.stringify(counts)}`);
console.log(`Screenshot:         ${screenshotPath}`);
console.log('\n--- Body text (first 2000 chars) ---');
console.log(bodyText || '(empty)');
console.log('\n--- <main> text (first 1200 chars) ---');
console.log(mainText);
console.log('\n--- Console messages ---');
for (const m of consoleMessages.slice(0, 30)) {
  console.log(`[${m.type}] ${m.text.slice(0, 240)}`);
}
if (consoleMessages.length > 30) {
  console.log(`(… ${consoleMessages.length - 30} more)`);
}
console.log('\n--- Failed requests / HTTP errors ---');
if (failedRequests.length === 0) {
  console.log('(none)');
} else {
  for (const r of failedRequests.slice(0, 20)) {
    console.log(`  ${r.reason}  ${r.url}`);
  }
}
console.log('\n--- Image requests (first 15) ---');
for (const r of allRequests.slice(0, 15)) {
  console.log(`  ${r.status}  ${r.url}`);
}

await browser.close();
process.exit(0);
