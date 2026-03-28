/** Research-area toggles on the library (maps from catalogue collections). */
export type LibraryTheme =
  | 'Healing'
  | 'Cognitive'
  | 'Metabolic'
  | 'Performance'
  | 'Longevity';

export interface Peptide {
  id: string;
  name: string;
  /** Primary collection — shown on cards and PDP label. */
  category: LibraryTheme;
  /** Every toggle this compound appears under (primary + 2nd / 3rd collections). */
  libraryFilters: LibraryTheme[];
  purity: string;
  coaVerified: boolean;
  /** Product photo (CFG renders) */
  image: string;
}

/** Public URL for a file in /public/images/products/ */
export function productImageFile(filename: string): string {
  return `/images/products/${encodeURIComponent(filename)}`;
}

export const peptideCategories = [
  'All',
  'Healing',
  'Cognitive',
  'Metabolic',
  'Performance',
  'Longevity',
] as const;

/** Shown under library toggles for the active filter (collection naming). */
export const libraryCategorySubtitles: Record<
  (typeof peptideCategories)[number],
  string
> = {
  All: 'in alphabetical order',
  Healing: 'tissue regeneration',
  Cognitive: 'cognitive and neurological research',
  Metabolic: 'metabolic research',
  Performance: 'performance biology',
  Longevity: 'longevity and cellular research',
};

// Filenames match assets in public/images/products/ (CFG product line).
export const cfgProductFiles = {
  cjcNoDac: 'CFG-001_119 — CJC-1295 (no DAC) 10mg.png',
  mt1: 'CFG-002_69 — Melanotan-1 10mg.png',
  mt2: 'CFG-003_69 — Melanotan-2 10mg.png',
  kpv: 'CFG-004_79 — KPV 10mg.png',
  cjcIpa: 'CFG-005_179 — CJC-1295 + Ipamorelin.png',
  epithalon: 'CFG-006_179 — Epithalon 50mg.png',
  amino1mq: 'CFG-009_99 — 5-amino-1MQ 10mg.png',
  bpcTb: 'CFG-010_149 — BPC-157 + TB-500 blend.png',
  selank: 'CFG-011_79 — Selank 10mg.png',
  ss31: 'CFG-012_249 — SS-31 50mg.png',
  glow: 'CFG-015_179 — GLOW 70mg.png',
  ghkCu: 'CFG-016_109 — GHK-Cu 100mg.png',
  igf: 'CFG-017_139 — IGF-1 LR3 1mg.png',
  cerebrolysin: 'CFG-019_89 — Cerebrolysin 60mg.png',
  tb500: 'CFG-020_109 — TB-500 10mg.png',
  motsC: 'CFG-021_149 — MOTS-c 40mg.png',
  foxo4: 'CFG-022_399 — FOXO4-DRI 10mg.png',
  retatrutide: 'CFG-023_149 — Retatrutide 10mg.png',
  glutathione: 'CFG-026_89 — Glutathione 1500mg.png',
  acetic: 'CFG-027_19 — Acetic acid water 10ml.png',
  bacWater: 'CFG-028_5 — Bacteriostatic water 3ml.png',
  ara290: 'CFG-029_99 — Ara-290 10mg.png',
  ipamorelin: 'CFG-030_89 — Ipamorelin 10mg.png',
  bpc157: 'CFG-031_99 — BPC-157 10mg.png',
  /** ASCII filename copy avoids + / special chars in URLs on some hosts */
  nad: 'CFG-032-NAD-1000mg.png',
  semax: 'CFG-034_79 — Semax 10mg.png',
  klow: 'CFG-035_189 — KLOW 80mg.png',
} as const;

export const peptides: Peptide[] = [
  {
    id: 'cjc-1295-no-dac',
    name: 'CJC-1295 (no DAC)',
    category: 'Performance',
    libraryFilters: ['Performance', 'Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.cjcNoDac),
  },
  {
    id: 'melanotan-1',
    name: 'Melanotan-1',
    category: 'Longevity',
    libraryFilters: ['Longevity'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.mt1),
  },
  {
    id: 'melanotan-2',
    name: 'Melanotan-2',
    category: 'Longevity',
    libraryFilters: ['Longevity'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.mt2),
  },
  {
    id: 'kpv',
    name: 'KPV',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.kpv),
  },
  {
    id: 'cjc-1295-ipamorelin',
    name: 'CJC-1295 + Ipamorelin',
    category: 'Performance',
    libraryFilters: ['Performance', 'Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.cjcIpa),
  },
  {
    id: 'epithalon',
    name: 'Epithalon',
    category: 'Longevity',
    libraryFilters: ['Longevity', 'Cognitive'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.epithalon),
  },
  {
    id: '5-amino-1mq',
    name: '5-Amino-1MQ',
    category: 'Metabolic',
    libraryFilters: ['Metabolic', 'Longevity'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.amino1mq),
  },
  {
    id: 'bpc157-tb500-blend',
    name: 'BPC-157 + TB-500 Blend',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.bpcTb),
  },
  {
    id: 'selank',
    name: 'Selank',
    category: 'Cognitive',
    libraryFilters: ['Cognitive', 'Longevity'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.selank),
  },
  {
    id: 'ss-31',
    name: 'SS-31',
    category: 'Longevity',
    libraryFilters: ['Longevity', 'Metabolic', 'Performance'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.ss31),
  },
  {
    id: 'glow',
    name: 'GLOW',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.glow),
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.ghkCu),
  },
  {
    id: 'igf-1-lr3',
    name: 'IGF-1 LR3',
    category: 'Performance',
    libraryFilters: ['Performance', 'Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.igf),
  },
  {
    id: 'cerebrolysin',
    name: 'Cerebrolysin',
    category: 'Cognitive',
    libraryFilters: ['Cognitive'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.cerebrolysin),
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.tb500),
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    category: 'Performance',
    libraryFilters: ['Performance', 'Longevity'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.motsC),
  },
  {
    id: 'foxo4-dri',
    name: 'FOXO4-DRI',
    category: 'Longevity',
    libraryFilters: ['Longevity', 'Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.foxo4),
  },
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    category: 'Metabolic',
    libraryFilters: ['Metabolic'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.retatrutide),
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    category: 'Cognitive',
    libraryFilters: ['Cognitive', 'Longevity'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.glutathione),
  },
  {
    id: 'acetic-acid-water',
    name: 'Acetic Acid Water 10ml',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.acetic),
  },
  {
    id: 'bacteriostatic-water',
    name: 'Bacteriostatic Water 3ml',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.bacWater),
  },
  {
    id: 'ara-290',
    name: 'ARA-290',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.ara290),
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    category: 'Performance',
    libraryFilters: ['Performance', 'Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.ipamorelin),
  },
  {
    id: 'bpc-157',
    name: 'BPC-157',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.bpc157),
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    category: 'Longevity',
    libraryFilters: ['Longevity', 'Performance'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.nad),
  },
  {
    id: 'semax',
    name: 'Semax',
    category: 'Cognitive',
    libraryFilters: ['Cognitive', 'Longevity'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.semax),
  },
  {
    id: 'klow',
    name: 'KLOW',
    category: 'Healing',
    libraryFilters: ['Healing'],
    purity: '99%+',
    coaVerified: true,
    image: productImageFile(cfgProductFiles.klow),
  },
];

export const allPeptides = peptides;

const nameCollator = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

function sortPeptidesByName(list: Peptide[]): Peptide[] {
  return [...list].sort((a, b) => nameCollator.compare(a.name, b.name));
}

export function getPeptidesByCategory(category: string): Peptide[] {
  const list =
    category === 'All'
      ? [...peptides]
      : peptides.filter((p) =>
          p.libraryFilters.includes(category as LibraryTheme)
        );
  return category === 'All'
    ? sortPeptidesByName(list)
    : list.sort((a, b) => a.name.localeCompare(b.name));
}
