/**
 * Retail pricing (inc. GST) aligned with internal price lists.
 * Multi-SKU peptides use PRODUCT_VARIANTS; everything else uses PEPTIDE_BASE_PRICES.
 */

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
}

export const PRODUCT_VARIANTS: Partial<Record<string, ProductVariant[]>> = {
  retatrutide: [
    { id: '10mg', label: '10 mg', price: 149 },
    { id: '20mg', label: '20 mg', price: 249 },
    { id: '30mg', label: '30 mg', price: 339 },
  ],
  'bpc-157': [
    { id: '5mg', label: '5 mg', price: 69 },
    { id: '10mg', label: '10 mg', price: 99 },
  ],
  'ghk-cu': [
    { id: '50mg', label: '50 mg', price: 69 },
    { id: '100mg', label: '100 mg', price: 109 },
  ],
};

const PEPTIDE_BASE_PRICES: Record<string, number> = {
  'cjc-1295-no-dac': 119,
  'melanotan-1': 69,
  'melanotan-2': 69,
  kpv: 79,
  'cjc-1295-ipamorelin': 179,
  epithalon: 179,
  '5-amino-1mq': 99,
  'bpc157-tb500-blend': 149,
  selank: 79,
  'ss-31': 249,
  glow: 179,
  'igf-1-lr3': 139,
  cerebrolysin: 89,
  'tb-500': 109,
  'mots-c': 149,
  'foxo4-dri': 399,
  glutathione: 89,
  'acetic-acid-water': 19,
  'bacteriostatic-water': 5,
  'ara-290': 99,
  ipamorelin: 89,
  'nad-plus': 169,
  semax: 79,
  klow: 189,
};

export function formatPriceUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getVariants(peptideId: string): ProductVariant[] | undefined {
  const list = PRODUCT_VARIANTS[peptideId];
  return list?.length ? list : undefined;
}

/** Library / cards: "FROM $X" for multi-SKU, else "$X.XX". */
export function getDisplayPriceForPeptide(peptideId: string): string | null {
  const variants = getVariants(peptideId);
  if (variants?.length) {
    const min = Math.min(...variants.map((v) => v.price));
    return `FROM ${formatPriceUsd(min)}`;
  }
  const p = PEPTIDE_BASE_PRICES[peptideId];
  return p !== undefined ? formatPriceUsd(p) : null;
}

export function getDisplayPriceForVariant(
  peptideId: string,
  variantId: string
): string | null {
  const v = getVariants(peptideId)?.find((x) => x.id === variantId);
  return v ? formatPriceUsd(v.price) : null;
}

export function getNumericPriceForVariantOrPeptide(
  peptideId: string,
  variantId?: string
): number | null {
  if (variantId) {
    const v = getVariants(peptideId)?.find((x) => x.id === variantId);
    if (v) return v.price;
  }
  const base = PEPTIDE_BASE_PRICES[peptideId];
  return base !== undefined ? base : null;
}
