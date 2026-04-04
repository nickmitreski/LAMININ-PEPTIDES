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
    proteinName: 'CoreForge Whey Protein 2kg (Chocolate)',
    price: 119,
  },
  'CFG-002': {
    peptideName: 'Melanotan-1 10mg',
    proteinName: 'CoreForge Creatine Monohydrate 500g',
    price: 69,
  },
  'CFG-003': {
    peptideName: 'Melanotan-2 10mg',
    proteinName: 'CoreForge Pre-Workout 30 Serves',
    price: 69,
  },
  'CFG-004': {
    peptideName: 'KPV 10mg',
    proteinName: 'CoreForge Thermogenic Fat Burner',
    price: 79,
  },
  'CFG-005': {
    peptideName: 'CJC-1295 + Ipamorelin',
    proteinName: 'CoreForge Whey Isolate 2.5kg',
    price: 179,
  },
  'CFG-006': {
    peptideName: 'Epithalon 50mg',
    proteinName: 'CoreForge Performance Stack Bundle',
    price: 179,
  },
  'CFG-009': {
    peptideName: '5-amino-1MQ 10mg',
    proteinName: 'CoreForge Whey Protein 1.5kg',
    price: 99,
  },
  'CFG-010': {
    peptideName: 'BPC-157 + TB-500 blend',
    proteinName: 'CoreForge Plant Protein 2kg',
    price: 149,
  },
  'CFG-011': {
    peptideName: 'Selank 10mg',
    proteinName: 'CoreForge Casein Protein 1kg',
    price: 79,
  },
  'CFG-012': {
    peptideName: 'SS-31 50mg',
    proteinName: 'CoreForge Ultimate Muscle Stack',
    price: 249,
  },
  'CFG-015': {
    peptideName: 'GLOW 70mg',
    proteinName: 'CoreForge Advanced Pre-Workout 60 Serves',
    price: 179,
  },
  'CFG-016': {
    peptideName: 'GHK-Cu 100mg',
    proteinName: 'CoreForge Collagen Protein Blend',
    price: 109,
  },
  'CFG-017': {
    peptideName: 'IGF-1 LR3 1mg',
    proteinName: 'CoreForge Protein + Greens Blend',
    price: 139,
  },
  'CFG-019': {
    peptideName: 'Cerebrolysin 60mg',
    proteinName: 'CoreForge Pre-Workout Energy',
    price: 89,
  },
  'CFG-020': {
    peptideName: 'TB-500 10mg',
    proteinName: 'CoreForge Vegan Protein Blend',
    price: 109,
  },
  'CFG-021': {
    peptideName: 'MOTS-c 40mg',
    proteinName: 'CoreForge Strength Duo',
    price: 149,
  },
  'CFG-022': {
    peptideName: 'FOXO4-DRI 10mg',
    proteinName: 'CoreForge Complete Transformation System',
    price: 399,
  },
  /**
   * Retatrutide — **one** decoy protein line per bridge rules; storefront has 10 / 20 / 30 mg variants.
   * Hero assets: `CFG-023_149|249|339 — Retatrutide 10|20|30mg.png` in `public/images/products/`.
   * Checkout: same `cfg_code`, `variant_id` = `10mg` | `20mg` | `30mg`, unit price from cart.
   */
  'CFG-023': {
    peptideName: 'Retatrutide 10mg',
    proteinName: 'CoreForge Casein Protein 2kg (Vanilla Bean)',
    price: 149,
  },
  'CFG-026': {
    peptideName: 'Glutathione 1500mg',
    proteinName: 'CoreForge Thermogenic Complex',
    price: 89,
  },
  'CFG-027': {
    peptideName: 'Acetic acid water 10ml',
    proteinName: 'CoreForge Creatine 100g',
    price: 19,
  },
  'CFG-028': {
    peptideName: 'Bacteriostatic water 3ml',
    proteinName: 'CoreForge Protein Sample Sachet',
    price: 5,
  },
  'CFG-029': {
    peptideName: 'Ara-290 10mg',
    proteinName: 'CoreForge Lean Protein 1kg',
    price: 99,
  },
  'CFG-030': {
    peptideName: 'Ipamorelin 10mg',
    proteinName: 'CoreForge Amino Energy Blend',
    price: 89,
  },
  'CFG-031': {
    peptideName: 'BPC-157 10mg',
    proteinName: 'CoreForge Pump Matrix Pre-Workout',
    price: 99,
  },
  'CFG-032': {
    peptideName: 'NAD+ 1000mg',
    proteinName: 'CoreForge Whey Isolate 2kg',
    price: 169,
  },
  'CFG-034': {
    peptideName: 'Semax 10mg',
    proteinName: 'CoreForge Night Recovery Casein',
    price: 79,
  },
  'CFG-035': {
    peptideName: 'KLOW 80mg',
    proteinName: 'CoreForge Muscle Builder Kit',
    price: 189,
  },
};

/** Maps catalogue `peptide.id` to CFG code (variants share code; line item carries variant). */
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

export function getCfgCodeForPeptideId(peptideId: string): string | null {
  return PEPTIDE_ID_TO_CFG[peptideId] ?? null;
}

export function mapPeptideToProtein(
  cfgCode: string,
  mappings: Record<string, ProductMapping> = PRODUCT_MAPPINGS
): ProductMapping | null {
  return mappings[cfgCode] ?? null;
}
