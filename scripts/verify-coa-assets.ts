/**
 * Verifies COA files referenced in src/data/coaPdfs.ts exist on disk:
 * - PDFs in public/images/coa-pdfs/
 * - PNGs in public/images/coa-pdfs/coa pngs/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCoaVerificationLists } from '../src/data/coaPdfs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pdfDir = path.join(root, 'public', 'images', 'coa-pdfs');
const pngDir = path.join(pdfDir, 'coa pngs');

const { rootPdfFilenames, pngSubdirFilenames } = getCoaVerificationLists();

const onDiskPdf = new Set(
  fs.existsSync(pdfDir)
    ? fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf'))
    : []
);

const onDiskPng = new Set(
  fs.existsSync(pngDir)
    ? fs.readdirSync(pngDir).filter((f) => f.toLowerCase().endsWith('.png'))
    : []
);

let exitCode = 0;

for (const f of [...rootPdfFilenames].sort()) {
  if (!onDiskPdf.has(f)) {
    console.error(`✗ MISSING PDF (referenced in coaPdfs.ts): ${f}`);
    exitCode = 1;
  } else {
    console.log(`✓ PDF ${f}`);
  }
}

for (const f of [...pngSubdirFilenames].sort()) {
  if (!onDiskPng.has(f)) {
    console.error(`✗ MISSING PNG under coa pngs/: ${f}`);
    exitCode = 1;
  } else {
    console.log(`✓ PNG ${f}`);
  }
}

for (const f of [...onDiskPdf].sort()) {
  if (!rootPdfFilenames.includes(f)) {
    console.warn(`⚠ ORPHAN PDF (on disk, not referenced): ${f}`);
  }
}

if (exitCode === 0) {
  console.log(
    `\nOK: ${rootPdfFilenames.length} referenced PDF(s) present; ${pngSubdirFilenames.length} referenced PNG(s) in coa pngs/. (Extra PNG mirrors in that folder are ignored.)`
  );
}

process.exit(exitCode);
