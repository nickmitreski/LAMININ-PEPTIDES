/**
 * Writes `public/sitemap.xml` using `VITE_APP_URL` from `.env.local` / `.env` (production canonical URL).
 * Run: npm run sitemap
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { generateSitemap } from '../src/utils/generateSitemap';
import { normalizeSiteOrigin, SITE_FALLBACK_ORIGIN } from '../src/lib/siteUrl';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const fromEnv = normalizeSiteOrigin(process.env.VITE_APP_URL) ?? SITE_FALLBACK_ORIGIN;
let loopback = false;
try {
  const { hostname } = new URL(fromEnv);
  loopback = hostname === 'localhost' || hostname === '127.0.0.1';
} catch {
  loopback = false;
}
const allowLocal = process.env.SITEMAP_ALLOW_LOCAL === '1';
const base = loopback && !allowLocal ? SITE_FALLBACK_ORIGIN : fromEnv;
if (loopback && !allowLocal) {
  console.warn(
    `VITE_APP_URL is loopback (${fromEnv}); wrote canonical URLs with ${SITE_FALLBACK_ORIGIN}. Set SITEMAP_ALLOW_LOCAL=1 to emit localhost.`
  );
}
const out = resolve(root, 'public/sitemap.xml');
writeFileSync(out, generateSitemap(base), 'utf8');
console.log(`Wrote ${out} with base ${base}`);
