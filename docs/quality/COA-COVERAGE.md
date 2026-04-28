# Certificates of Analysis (PDF) coverage

Physical PDFs live in `public/images/coa-pdfs/` and are registered in `src/data/coaPdfs.ts`.

## Verification

From the repo root:

```bash
npm run verify:coa
```

This checks that every filename referenced in `coaPdfs.ts` exists on disk and warns about orphan PDF files.

## Mapped compounds (downloads available)

These storefront peptide IDs resolve to a lab PDF:

| Peptide ID | Filename |
|------------|----------|
| `cjc-1295-no-dac` | Test Report #CJC1295 No Dac.pdf |
| `kpv` | Test Report #KPV.pdf |
| `cjc-1295-ipamorelin` | Test Report #CJCIPA 20.pdf |
| `epithalon` | Test Report #Epitalon.pdf |
| `5-amino-1mq` | Test Report #5-Amino-1MQ.pdf |
| `bpc157-tb500-blend` | Test Report #BPCTB 20.pdf |
| `selank` | Test Report #Selank.pdf |
| `glow` | Test Report #Glow.pdf |
| `ghk-cu` | Test Report #GHK-Cu 100.pdf |
| `tb-500` | Test Report #TB-500.pdf |
| `mots-c` | Test Report #MOTS-c.pdf |
| `ara-290` | Test Report #ARA-290.pdf |
| `ipamorelin` | Test Report #Ipamorelin.pdf |
| `bpc-157` | Test Report #BPC-157.pdf |
| `nad-plus` | Test Report #NAD+.pdf |
| `semax` | Test Report #Semax.pdf |
| `klow` | Test Report #KLOW.pdf |
| `retatrutide` (10 mg) | Test Report #Retatrutide 10.pdf |
| `retatrutide` (20 mg) | Test Report #Retatrutide 20.pdf |
| `retatrutide` (30 mg) | Test Report #Retatrutide 30.pdf |

## Listed but PDF not yet registered

The following peptides are marked `coaVerified: true` in the catalogue but **do not** yet have an entry in `COA_PDF_BY_PEPTIDE_ID`. The `/coa` page and product detail views show **“COA PDF coming soon”** until a PDF is uploaded and mapped:

- `melanotan-1`
- `melanotan-2`
- `ss-31`
- `igf-1-lr3`
- `cerebrolysin`
- `foxo4-dri`
- `glutathione`

To add a file: drop `Test Report #….pdf` into `public/images/coa-pdfs/`, then add `peptideId → filename` in `src/data/coaPdfs.ts`, and run `npm run verify:coa`.
