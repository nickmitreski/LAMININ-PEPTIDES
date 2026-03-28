export interface Peptide {
  id: string;
  name: string;
  category: string;
  purity: string;
  coaVerified: boolean;
}

export const peptideCategories = [
  'Healing',
  'Cognitive',
  'Metabolic',
  'Performance'
];

export const peptides: Peptide[] = [
  {
    id: 'bpc-157',
    name: 'BPC-157',
    category: 'Healing',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    category: 'Healing',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    category: 'Healing',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'bpc-tb-blend',
    name: 'BPC-157 + TB-500 Blend',
    category: 'Healing',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    category: 'Healing',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'semax',
    name: 'Semax',
    category: 'Cognitive',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'selank',
    name: 'Selank',
    category: 'Cognitive',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'cerebrolysin',
    name: 'Cerebrolysin',
    category: 'Cognitive',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'noopept',
    name: 'Noopept',
    category: 'Cognitive',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'dihexa',
    name: 'Dihexa',
    category: 'Cognitive',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    category: 'Metabolic',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    category: 'Metabolic',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'aod-9604',
    name: 'AOD-9604',
    category: 'Metabolic',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    category: 'Metabolic',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    category: 'Metabolic',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'cjc-1295',
    name: 'CJC-1295',
    category: 'Performance',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'mk-677',
    name: 'MK-677',
    category: 'Performance',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'follistatin-344',
    name: 'Follistatin-344',
    category: 'Performance',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'epithalon',
    name: 'Epithalon',
    category: 'Performance',
    purity: '99%+',
    coaVerified: true
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    category: 'Performance',
    purity: '99%+',
    coaVerified: true
  }
];

export const allPeptides = peptides;

export const getPeptidesByCategory = (category: string): Peptide[] => {
  return peptides.filter(peptide => peptide.category === category);
};
