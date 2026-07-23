/**
 * Find storefront elements stuck invisible (opacity 0 / reveal not fired).
 * Usage: node scripts/find-hidden.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const PAGES = [
  '/',
  '/library',
  '/products/glow',
  '/coa',
  '/research',
  '/faq',
  '/guarantee',
  '/shipping',
  '/contact',
  '/cart',
  '/checkout',
];

function collectHiddenInPage() {
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 60 || r.height < 40) continue;
    if (Number(cs.opacity) !== 0) continue;
    if (el.parentElement && Number(getComputedStyle(el.parentElement).opacity) === 0) continue;
    out.push({
      tag: el.tagName,
      class: (el.className?.toString?.() || '').slice(0, 100),
      revealed: el.getAttribute('data-revealed'),
      top: Math.round(r.top),
      h: Math.round(r.height),
      preview: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
    });
  }
  return out.slice(0, 30);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await context.addInitScript(() => {
  localStorage.setItem('laminin-entry-verified', '1');
});
const page = await context.newPage();

const results = [];

for (const path of PAGES) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1000);

  const aboveFoldHidden = await page.evaluate(collectHiddenInPage);

  await page.evaluate(async () => {
    const step = Math.max(280, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });

  const afterScrollHidden = await page.evaluate(collectHiddenInPage);
  const reveals = await page.evaluate(() =>
    [...document.querySelectorAll('.reveal')].map((el) => ({
      revealed: el.getAttribute('data-revealed'),
      opacity: getComputedStyle(el).opacity,
      top: Math.round(el.getBoundingClientRect().top),
      h: Math.round(el.getBoundingClientRect().height),
      preview: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
    }))
  );
  const badImgs = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => {
        const r = img.getBoundingClientRect();
        if (r.width < 20 || r.height < 20) return false;
        const op = Number(getComputedStyle(img).opacity);
        return (img.complete && img.naturalWidth > 0 && op === 0) || img.naturalWidth === 0;
      })
      .slice(0, 15)
      .map((img) => ({
        alt: (img.alt || '').slice(0, 50),
        opacity: getComputedStyle(img).opacity,
        w: img.naturalWidth,
        src: (img.currentSrc || img.src || '').slice(0, 90),
      }))
  );

  const row = {
    path,
    title: await page.title(),
    aboveFoldHidden,
    afterScrollHidden,
    reveals,
    badImgs,
  };
  results.push(row);

  const hiddenN = afterScrollHidden.length;
  const badReveal = reveals.filter((r) => r.opacity === '0').length;
  console.log(
    `${hiddenN || badReveal ? '✗' : '✓'} ${path.padEnd(22)} hidden=${hiddenN} opacity0reveals=${badReveal} badImgs=${badImgs.length}`
  );
  for (const h of afterScrollHidden.slice(0, 6)) {
    console.log(`   · [${h.revealed}] ${h.class.slice(0, 55)} | ${h.preview}`);
  }
  for (const r of reveals.filter((x) => x.opacity === '0').slice(0, 4)) {
    console.log(`   reveal-stuck: ${r.preview}`);
  }
}

await browser.close();
