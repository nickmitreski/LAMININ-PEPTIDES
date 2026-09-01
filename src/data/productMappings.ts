/**
 * CFG → display peptide name, decoy protein store line, and reference unit price.
 * Cart line totals use actual cart prices; these prices inform the protein payload.
 */

export interface ProductMapping {
  peptideName: string;
  proteinName: string;
  price: number;
}

export const PRODUCT_MAPPINGS: Record<string, ProductMapping> = {
  'CFG-001': {
    peptideName: 'CJC-1295 (no DAC) 10mg',
    proteinName: 'Partner Whey Protein 2kg (Chocolate)',
    price: 119,
  },
  'CFG-002': {
    peptideName: 'Melanotan-1 10mg',
    proteinName: 'Partner Creatine Monohydrate 500g',
    price: 69,
  },
  'CFG-003': {
    peptideName: 'Melanotan-2 10mg',
    proteinName: 'Partner Pre-Workout 30 Serves',
    price: 69,
  },
  'CFG-004': {
    peptideName: 'KPV 10mg',
    proteinName: 'Partner Thermogenic Fat Burner',
    price: 79,
  },
  'CFG-005': {
    peptideName: 'CJC-1295 + Ipamorelin',
    proteinName: 'Partner Whey Isolate 2.5kg',
    price: 179,
  },
  'CFG-006': {
    peptideName: 'Epithalon 50mg',
    proteinName: 'Partner Performance Stack Bundle',
    price: 179,
  },
  'CFG-009': {
    peptideName: '5-amino-1MQ 10mg',
    proteinName: 'Partner Whey Protein 1.5kg',
    price: 99,
  },
  'CFG-010': {
    peptideName: 'BPC-157 + TB-500 blend',
    proteinName: 'Partner Plant Protein 2kg',
    price: 149,
  },
  'CFG-011': {
    peptideName: 'Selank 10mg',
    proteinName: 'Partner Casein Protein 1kg',
    price: 79,
  },
  'CFG-012': {
    peptideName: 'SS-31 50mg',
    proteinName: 'Partner Ultimate Muscle Stack',
    price: 249,
  },
  'CFG-015': {
    peptideName: 'GLOW 70mg',
    proteinName: 'Partner Advanced Pre-Workout 60 Serves',
    price: 179,
  },
  'CFG-016': {
    peptideName: 'GHK-Cu 100mg',
    proteinName: 'Partner Collagen Protein Blend',
    price: 109,
  },
  'CFG-017': {
    peptideName: 'IGF-1 LR3 1mg',
    proteinName: 'Partner Protein + Greens Blend',
    price: 139,
  },
  'CFG-019': {
    peptideName: 'Cerebrolysin 60mg',
    proteinName: 'Partner Pre-Workout Energy',
    price: 89,
  },
  'CFG-020': {
    peptideName: 'TB-500 10mg',
    proteinName: 'Partner Vegan Protein Blend',
    price: 109,
  },
  'CFG-021': {
    peptideName: 'MOTS-c 40mg',
    proteinName: 'Partner Strength Duo',
    price: 149,
  },
  'CFG-022': {
    peptideName: 'FOXO4-DRI 10mg',
    proteinName: 'Partner Complete Transformation System',
    price: 399,
  },
  /**
   * Retatrutide — **one** decoy protein line per bridge rules; storefront has 10 / 20 / 30 mg variants.
   * Hero assets: `CFG-023_149|249|339 — Retatrutide 10|20|30mg.png` in `public/images/products/`.
   * Checkout: same `cfg_code`, `variant_id` = `10mg` | `20mg` | `30mg`, unit price from cart.
   */
  'CFG-023': {
    peptideName: 'Retatrutide 10mg',
    proteinName: 'Partner Casein Protein 2kg (Vanilla Bean)',
    price: 149,
  },
  'CFG-026': {
    peptideName: 'Glutathione 1500mg',
    proteinName: 'Partner Thermogenic Complex',
    price: 89,
  },
  'CFG-027': {
    peptideName: 'Acetic acid water 10ml',
    proteinName: 'Partner Creatine 100g',
    price: 19,
  },
  'CFG-028': {
    peptideName: 'Bacteriostatic water 3ml',
    proteinName: 'Partner Protein Sample Sachet',
    price: 5,
  },
  'CFG-029': {
    peptideName: 'Ara-290 10mg',
    proteinName: 'Partner Lean Protein 1kg',
    price: 99,
  },
  'CFG-030': {
    peptideName: 'Ipamorelin 10mg',
    proteinName: 'Partner Amino Energy Blend',
    price: 89,
  },
  'CFG-031': {
    peptideName: 'BPC-157 10mg',
    proteinName: 'Partner Pump Matrix Pre-Workout',
    price: 99,
  },
  'CFG-032': {
    peptideName: 'NAD+ 1000mg',
    proteinName: 'Partner Whey Isolate 2kg',
    price: 169,
  },
  'CFG-034': {
    peptideName: 'Semax 10mg',
    proteinName: 'Partner Night Recovery Casein',
    price: 79,
  },
  'CFG-035': {
    peptideName: 'KLOW 80mg',
    proteinName: 'Partner Muscle Builder Kit',
    price: 189,
  },
  // Hidden server-side checkout aliases for non-reference variant prices.
  'CFG-043': {
    peptideName: 'Retatrutide 20mg',
    proteinName: 'Partner Casein Protein 2kg (Vanilla Bean)',
    price: 249,
  },
  'CFG-044': {
    peptideName: 'Retatrutide 30mg',
    proteinName: 'Partner Casein Protein 2kg (Vanilla Bean)',
    price: 339,
  },
  'CFG-045': {
    peptideName: 'BPC-157 5mg',
    proteinName: 'Partner Pump Matrix Pre-Workout',
    price: 69,
  },
  'CFG-046': {
    peptideName: 'GHK-Cu 50mg',
    proteinName: 'Partner Collagen Protein Blend',
    price: 69,
  },
};

/** Maps catalogue `peptide.id` to its canonical/base CFG code. */
export const PEPTIDE_ID_TO_CFG: Record<string, string> = {
  'cjc-1295-no-dac': 'CFG-001',
  'melanotan-1': 'CFG-002',
  'melanotan-2': 'CFG-003',
  kpv: 'CFG-004',
  'cjc-1295-ipamorelin': 'CFG-005',
  epithalon: 'CFG-006',
  '5-amino-1mq': 'CFG-009',
  'bpc157-tb500-blend': 'CFG-010',
  selank: 'CFG-011',
  'ss-31': 'CFG-012',
  glow: 'CFG-015',
  'ghk-cu': 'CFG-016',
  'igf-1-lr3': 'CFG-017',
  cerebrolysin: 'CFG-019',
  'tb-500': 'CFG-020',
  'mots-c': 'CFG-021',
  'foxo4-dri': 'CFG-022',
  retatrutide: 'CFG-023',
  glutathione: 'CFG-026',
  'acetic-acid-water': 'CFG-027',
  'bacteriostatic-water': 'CFG-028',
  'ara-290': 'CFG-029',
  ipamorelin: 'CFG-030',
  'bpc-157': 'CFG-031',
  'nad-plus': 'CFG-032',
  semax: 'CFG-034',
  klow: 'CFG-035',
};

/**
 * Hidden checkout-only aliases for variants whose legitimate prices differ
 * from the canonical CFG row. These rows are server-owned in product_mappings
 * and remain inactive so they never appear as duplicate storefront products.
 *
 * The dedicated variant-price migration also supports the shared canonical
 * codes. These aliases keep checkout correct on databases where that migration
 * has not yet been applied.
 */
export const CHECKOUT_VARIANT_CFG: Partial<Record<string, Record<string, string>>> = {
  retatrutide: {
    '20mg': 'CFG-043',
    '30mg': 'CFG-044',
  },
  'bpc-157': {
    '5mg': 'CFG-045',
  },
  'ghk-cu': {
    '50mg': 'CFG-046',
  },
};

export const HIDDEN_CHECKOUT_CFG_CODES = new Set(
  Object.values(CHECKOUT_VARIANT_CFG).flatMap((variants) =>
    variants ? Object.values(variants) : []
  )
);

export function getCheckoutCfgCode(peptideId: string, variantId?: string): string | null {
  if (variantId) {
    const variantCfg = CHECKOUT_VARIANT_CFG[peptideId]?.[variantId];
    if (variantCfg) return variantCfg;
  }
  return PEPTIDE_ID_TO_CFG[peptideId] ?? null;
}

/** Inverse map: CFG code → storefront `peptide.id` for shop image overrides. */
export const CFG_CODE_TO_PEPTIDE_ID: Record<string, string> = (() => {
  const rev: Record<string, string> = {};
  for (const [peptideId, cfg] of Object.entries(PEPTIDE_ID_TO_CFG)) {
    rev[cfg] = peptideId;
  }
  return rev;
})();

export function getCfgCodeForPeptideId(peptideId: string): string | null {
  return PEPTIDE_ID_TO_CFG[peptideId] ?? null;
}

export function mapPeptideToProtein(
  cfgCode: string,
  mappings: Record<string, ProductMapping> = PRODUCT_MAPPINGS
): ProductMapping | null {
  return mappings[cfgCode] ?? null;
}
