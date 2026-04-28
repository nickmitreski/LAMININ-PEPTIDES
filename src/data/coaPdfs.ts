/**
 * Certificates of analysis: root PDFs in `public/images/coa-pdfs/`, optional PNG-only
 * fallbacks in `public/images/coa-pdfs/coa pngs/` when no PDF is registered.
 *
 * Resolution: **PDF first** (same filename as today), then PNG map for gaps.
 * Run `npm run verify:coa` to confirm files on disk match the maps.
 */

export type CoaAssetKind = 'pdf' | 'png';

/** Download target for UI (href + suggested filename + format for labels). */
export type CoaDownload = {
  kind: CoaAssetKind;
  /** URL path from site root (encoded segments). */
  url: string;
  /** Suggested client download name. */
  filename: string;
};

const COA_PNG_SUBDIR = 'coa pngs';

/** Retatrutide — COA PDF per strength (storefront variant id). */
const RETATRUTIDE_COA_PDF_BY_VARIANT: Record<string, string> = {
  '10mg': 'Test Report #Retatrutide 10.pdf',
  '20mg': 'Test Report #Retatrutide 20.pdf',
  '30mg': 'Test Report #Retatrutide 30.pdf',
};

/** Root PDFs: `public/images/coa-pdfs/<filename>`. */
export const COA_PDF_BY_PEPTIDE_ID: Record<string, string> = {
  'cjc-1295-no-dac': 'Test Report #CJC1295 No Dac.pdf',
  kpv: 'Test Report #KPV.pdf',
  'cjc-1295-ipamorelin': 'Test Report #CJCIPA 20.pdf',
  epithalon: 'Test Report #Epitalon.pdf',
  '5-amino-1mq': 'Test Report #5-Amino-1MQ.pdf',
  'bpc157-tb500-blend': 'Test Report #BPCTB 20.pdf',
  selank: 'Test Report #Selank.pdf',
  glow: 'Test Report #Glow.pdf',
  'ghk-cu': 'Test Report #GHK-Cu 100.pdf',
  'tb-500': 'Test Report #TB-500.pdf',
  'mots-c': 'Test Report #MOTS-c.pdf',
  'ara-290': 'Test Report #ARA-290.pdf',
  ipamorelin: 'Test Report #Ipamorelin.pdf',
  'bpc-157': 'Test Report #BPC-157.pdf',
  'nad-plus': 'Test Report #NAD+.pdf',
  semax: 'Test Report #Semax.pdf',
  klow: 'Test Report #KLOW.pdf',
};

/**
 * PNG-only COAs under `public/images/coa-pdfs/coa pngs/` when no root PDF exists.
 * Melanotan: `MTI` / `MTI[1]` align to MT-I vs MT-II lab filenames — swap if your batches differ.
 */
const COA_PNG_BY_PEPTIDE_ID: Record<string, string> = {
  'melanotan-1': 'Test Report #MTI.png',
  'melanotan-2': 'Test Report #MTI[1].png',
  'ss-31': 'Test Report #SS-31.png',
  'igf-1-lr3': 'Test Report #IGF-1 LR3.png',
  'foxo4-dri': 'Test Report #FOX04 DRI.png',
  glutathione: 'Test Report #Glutathione.png',
};

function coaRootPdfUrl(filename: string): string {
  return `/images/coa-pdfs/${encodeURIComponent(filename)}`;
}

function coaPngSubfolderUrl(filename: string): string {
  return `/images/coa-pdfs/${encodeURIComponent(COA_PNG_SUBDIR)}/${encodeURIComponent(filename)}`;
}

export function coaDownloadButtonLabel(kind: CoaAssetKind): string {
  return kind === 'pdf' ? 'Download COA (PDF)' : 'Download COA (PNG)';
}

/**
 * Resolved COA for product / COA directory cards. Prefers PDF at repo root, then PNG in `coa pngs/`.
 */
export function getCoaDownload(
  peptideId: string,
  variantId?: string
): CoaDownload | undefined {
  if (peptideId === 'retatrutide') {
    const v = variantId ?? '10mg';
    const pdf = RETATRUTIDE_COA_PDF_BY_VARIANT[v];
    if (pdf) {
      return { kind: 'pdf', filename: pdf, url: coaRootPdfUrl(pdf) };
    }
    return undefined;
  }

  const pdf = COA_PDF_BY_PEPTIDE_ID[peptideId];
  if (pdf) {
    return { kind: 'pdf', filename: pdf, url: coaRootPdfUrl(pdf) };
  }

  const png = COA_PNG_BY_PEPTIDE_ID[peptideId];
  if (png) {
    return { kind: 'png', filename: png, url: coaPngSubfolderUrl(png) };
  }

  return undefined;
}

/** Lists used by `npm run verify:coa` — keep in sync with maps above. */
export function getCoaVerificationLists(): {
  rootPdfFilenames: string[];
  pngSubdirFilenames: string[];
} {
  return {
    rootPdfFilenames: [
      ...Object.values(COA_PDF_BY_PEPTIDE_ID),
      ...Object.values(RETATRUTIDE_COA_PDF_BY_VARIANT),
    ],
    pngSubdirFilenames: [...Object.values(COA_PNG_BY_PEPTIDE_ID)],
  };
}

/**
 * @deprecated Use getCoaDownload().url — kept for callers that only need root PDF paths.
 */
export function coaPdfPublicUrl(filename: string): string {
  return coaRootPdfUrl(filename);
}

/**
 * @deprecated Use getCoaDownload() — returns only PDF filename when the asset is a root PDF.
 */
export function coaPdfFilenameForPeptide(
  peptideId: string,
  variantId?: string
): string | undefined {
  const d = getCoaDownload(peptideId, variantId);
  return d?.kind === 'pdf' ? d.filename : undefined;
}
