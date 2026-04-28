#!/usr/bin/env node
/**
 * Verifies that every PDF filename referenced in src/data/coaPdfs.ts exists
 * under public/images/coa-pdfs/ and reports any extra files on disk not in the map.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mapFile = path.join(root, 'src', 'data', 'coaPdfs.ts');
const pdfDir = path.join(root, 'public', 'images', 'coa-pdfs');

const ts = fs.readFileSync(mapFile, 'utf8');

/** Collect quoted strings that look like PDF filenames */
const expected = new Set();
const re = /'([^']+\.pdf)'/g;
let m;
while ((m = re.exec(ts)) !== null) {
  const name = m[1];
  if (!name.includes('pdf')) continue;
  expected.add(name);
}

const onDisk = new Set(
  fs.existsSync(pdfDir)
    ? fs
        .readdirSync(pdfDir)
        .filter((f) => f.endsWith('.pdf'))
    : [],
);

let exitCode = 0;

for (const f of [...expected].sort()) {
  if (!onDisk.has(f)) {
    console.error(`✗ MISSING on disk (referenced in coaPdfs.ts): ${f}`);
    exitCode = 1;
  }
}

for (const f of [...onDisk].sort()) {
  if (!expected.has(f)) {
    console.warn(`⚠ ORPHAN file (not referenced in coaPdfs.ts): ${f}`);
  }
}

for (const f of [...expected].sort()) {
  if (onDisk.has(f)) {
    console.log(`✓ ${f}`);
  }
}

if (exitCode === 0 && expected.size === onDisk.size) {
  console.log(`\nOK: ${expected.size} PDF(s); mapping matches disk.`);
}

process.exit(exitCode);
