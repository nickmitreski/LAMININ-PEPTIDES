import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem('laminin-entry-verified', '1'); } catch {}
});
const page = await ctx.newPage();
await page.goto('http://localhost:5173/library', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const btns = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).slice(0, 20).map((b) => ({
    text: (b.textContent || '').trim().slice(0, 60),
    ariaLabel: b.getAttribute('aria-label'),
    classes: b.className.slice(0, 80),
  }));
});
console.log(JSON.stringify(btns, null, 2));
await browser.close();
