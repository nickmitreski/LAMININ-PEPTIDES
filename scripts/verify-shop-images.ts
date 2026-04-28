/**
 * Storefront parity check: anon read of product_mappings + nested product_images,
 * same shape as fetchShopPrimaryImageOverrides(). Uses .env / .env.local (VITE_*).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { CFG_CODE_TO_PEPTIDE_ID } from '../src/data/productMappings';

function loadEnvFiles() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (k.startsWith('VITE_')) process.env[k] = v;
    }
  }
}

loadEnvFiles();

const url = process.env.VITE_SUPABASE_URL?.trim();
const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!url || !anon) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env / .env.local'
  );
  process.exit(1);
}

const host = (() => {
  try {
    return new URL(url).host;
  } catch {
    return '(invalid URL)';
  }
})();

const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

const { data, error } = await supabase
  .from('product_mappings')
  .select(
    'cfg_code, product_images ( id, image_url, is_primary, display_order, updated_at )'
  )
  .eq('is_active', true);

if (error) {
  console.error('✗ Query failed (same as storefront would see):');
  console.error(error.message);
  console.error('Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
  process.exit(1);
}

type Row = {
  cfg_code: string;
  product_images: unknown;
};

const rows = (data ?? []) as Row[];
let withUrl = 0;
let mappedPeptide = 0;
const samples: string[] = [];

for (const row of rows) {
  const imgs = row.product_images;
  const arr = Array.isArray(imgs) ? imgs : imgs ? [imgs] : [];
  if (!arr.length) continue;
  const sorted = [...arr].sort((a: { is_primary?: boolean; display_order?: number }, b) => {
    const ap = a.is_primary === true ? 1 : 0;
    const bp = b.is_primary === true ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });
  const top = sorted[0] as { image_url?: string };
  const imageUrl = typeof top?.image_url === 'string' ? top.image_url.trim() : '';
  if (!imageUrl) continue;
  withUrl++;
  const peptideId = CFG_CODE_TO_PEPTIDE_ID[row.cfg_code];
  if (peptideId) {
    mappedPeptide++;
    if (samples.length < 6) {
      samples.push(
        `${row.cfg_code} → ${peptideId}: ${imageUrl.slice(0, 72)}${imageUrl.length > 72 ? '…' : ''}`
      );
    }
  }
}

console.log(`OK: anon client @ ${host}`);
console.log(`    Active product_mappings rows returned: ${rows.length}`);
console.log(`    Rows with at least one image URL: ${withUrl}`);
console.log(`    Those with known cfg → peptide id map: ${mappedPeptide}`);
if (samples.length) {
  console.log('\nSample overrides (truncated URLs):');
  for (const s of samples) console.log(`  • ${s}`);
}

if (withUrl > 0 && mappedPeptide === 0) {
  console.warn(
    '\n⚠ You have images but no cfg_code maps to peptide id — check productMappings PEPTIDE_ID_TO_CFG.'
  );
}

/** Extra audit: anon can read product_images rows; helps spot RLS blocking children. */
const imgCountRes = await supabase
  .from('product_images')
  .select('*', { count: 'exact', head: true });

console.log('');
console.log(
  `Audit: anon product_images table readable — row count exposed: ${imgCountRes.count ?? 'unknown'} (${imgCountRes.error ? `error: ${imgCountRes.error.message}` : 'ok'})`
);

/** Which active mappings tie to images but storefront cannot map cfg → peptide slug. */
const unmappedWithUrl: string[] = [];
const mappedEmptyEmbed: string[] = [];
for (const row of rows) {
  const imgs = row.product_images;
  const arr = Array.isArray(imgs) ? imgs : imgs ? [imgs] : [];
  if (!arr.length) {
    mappedEmptyEmbed.push(row.cfg_code);
    continue;
  }
  const sorted = [...arr].sort(
    (
      a: { is_primary?: boolean; display_order?: number },
      b: { is_primary?: boolean; display_order?: number }
    ) => {
      const ap = a.is_primary === true ? 1 : 0;
      const bp = b.is_primary === true ? 1 : 0;
      if (bp !== ap) return bp - ap;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    }
  );
  const top = sorted[0] as { image_url?: string };
  const imageUrl =
    typeof top?.image_url === 'string' ? top.image_url.trim() : '';
  if (!imageUrl) continue;
  if (!CFG_CODE_TO_PEPTIDE_ID[row.cfg_code]) {
    unmappedWithUrl.push(row.cfg_code);
  }
}

if (unmappedWithUrl.length) {
  console.warn(
    `\n⚠ Image URL present but cfg not in storefront map (wrong/missing peptide id): ${unmappedWithUrl.join(', ')}`
  );
}

console.log(
  `\nDetail: ${mappedEmptyEmbed.length} active mappings have no nested product_images (nothing uploaded, or RLS/embed returned empty).`
);

process.exit(0);
