/**
 * Maps peptide `id` (from peptides.ts) to the exact filename in
 * `public/images/cod-pdfs/`. Only compounds with a matching lab PDF are listed.
 */
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
  retatrutide: 'Test Report #Retatrutide 10.pdf',
  'ara-290': 'Test Report #ARA-290.pdf',
  ipamorelin: 'Test Report #Ipamorelin.pdf',
  'bpc-157': 'Test Report #BPC-157.pdf',
  'nad-plus': 'Test Report #NAD+.pdf',
  semax: 'Test Report #Semax.pdf',
  klow: 'Test Report #KLOW.pdf',
};

export function coaPdfPublicUrl(filename: string): string {
  return `/images/cod-pdfs/${encodeURIComponent(filename)}`;
}

export function coaPdfFilenameForPeptide(peptideId: string): string | undefined {
  return COA_PDF_BY_PEPTIDE_ID[peptideId];
}
