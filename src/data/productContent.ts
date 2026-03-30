/**
 * PDP copy and URL slugs. Hero imagery is each compound’s catalogue render
 * (`peptide.image` → /images/products/ CFG line).
 */

export type ProductCopyEntry = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  paragraphs: string[];
};

export const PRODUCT_COPY: Record<string, ProductCopyEntry> = {
  'igf-1-lr3': {
    slug: 'igf-1-lr3-1mg',
    metaTitle: 'IGF-1 LR3 1mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'IGF-1 LR3 1mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'IGF-1 LR3 peptide is a synthetic analogue of insulin-like growth factor-1 (IGF-1) modified to enhance stability and receptor interaction characteristics. It has been investigated in research examining IGF receptor signalling pathways and cellular growth-related mechanisms.',
      'Published studies have explored IGF-1 LR3 in laboratory models investigating metabolic signalling systems, receptor-mediated pathways, and regulatory processes associated with cellular growth.',
      'Laminin Peptide Lab supplies IGF-1 LR3 peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  glutathione: {
    slug: 'glutathione-1500mg',
    metaTitle: 'Glutathione 1500mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Glutathione 1500mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Glutathione is a tripeptide composed of glutamate, cysteine, and glycine, widely studied for its role in cellular redox balance and antioxidant systems.',
      'Published studies have explored glutathione in laboratory models investigating oxidative stress pathways, detoxification mechanisms, and metabolic regulatory systems.',
      'Laminin Peptide Lab supplies glutathione in lyophilised form for laboratory research purposes only.',
    ],
  },
  'melanotan-2': {
    slug: 'melanotan-2-10mg',
    metaTitle: 'Melanotan 2 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Melanotan 2 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Melanotan 2 peptide is a synthetic analogue of α-MSH studied in research examining melanocortin receptor signalling pathways.',
      'Published studies have explored MT2 in laboratory models investigating melanocortin receptor activity and peptide-mediated signalling systems.',
      'Laminin Peptide Lab supplies Melanotan 2 peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'melanotan-1': {
    slug: 'melanotan-1-10mg',
    metaTitle: 'Melanotan 1 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Melanotan 1 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Melanotan 1 peptide is a synthetic analogue of α-MSH investigated in research examining melanocortin receptor pathways and signalling systems.',
      'Published studies have explored Melanotan 1 in laboratory models investigating melanogenesis and receptor-mediated processes.',
      'Laminin Peptide Lab supplies Melanotan 1 peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'foxo4-dri': {
    slug: 'foxo4-dri-10mg',
    metaTitle: 'FOXO4-DRI 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'FOXO4-DRI 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'FOXO4-DRI peptide is a synthetic compound designed to disrupt FOXO4-p53 interactions and studied in research examining cellular signalling pathways.',
      'Published studies have explored FOXO4-DRI in laboratory models investigating protein interaction mechanisms and regulatory pathways.',
      'Laminin Peptide Lab supplies FOXO4-DRI peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'ss-31': {
    slug: 'ss31-50mg',
    metaTitle: 'SS-31 50mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'SS-31 50mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'SS-31 peptide is a mitochondria-targeting tetrapeptide investigated in research examining mitochondrial signalling and bioenergetic processes.',
      'Published studies have explored SS-31 in laboratory models investigating mitochondrial pathways and cellular energy systems.',
      'Laminin Peptide Lab supplies SS-31 peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  kpv: {
    slug: 'kpv-10mg',
    metaTitle: 'KPV 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'KPV 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'KPV peptide is a synthetic tripeptide derived from α-MSH investigated in research examining peptide signalling pathways.',
      'Published studies have explored KPV in laboratory models investigating cellular communication and regulatory mechanisms.',
      'Laminin Peptide Lab supplies KPV peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'tb-500': {
    slug: 'tb-500-10mg',
    metaTitle: 'TB-500 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'TB-500 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'TB-500 peptide is a synthetic fragment of Thymosin Beta-4 studied in research examining cellular migration and peptide signalling systems.',
      'Published studies have explored TB-500 in laboratory models investigating extracellular matrix pathways and cellular regulatory mechanisms.',
      'Laminin Peptide Lab supplies TB-500 peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'cjc-1295-no-dac': {
    slug: 'cjc1295-no-dac',
    metaTitle: 'CJC-1295 (No DAC) | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'CJC-1295 (No DAC) research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'CJC-1295 peptide (No DAC) is a synthetic analogue related to GHRH investigated in research examining endocrine signalling pathways.',
      'Published studies have explored CJC-1295 in laboratory models investigating growth hormone pathways and receptor interactions.',
      'Laminin Peptide Lab supplies CJC-1295 in lyophilised form for laboratory research purposes only.',
    ],
  },
  'bacteriostatic-water': {
    slug: 'bac-water-3ml',
    metaTitle: 'BAC Water 3ml | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'BAC Water 3ml research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'BAC Water is a sterile preparation used in laboratory settings for peptide reconstitution and solution preparation.',
      'Laminin Peptide Lab supplies BAC Water in sterile vial format for laboratory research purposes only.',
    ],
  },
  'acetic-acid-water': {
    slug: 'aa-water-10ml',
    metaTitle: 'AA Water 10ml | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'AA Water 10ml research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'AA Water is a sterile acetic acid solution used in laboratory settings for peptide preparation and handling.',
      'Laminin Peptide Lab supplies AA Water in sterile vial format for laboratory research purposes only.',
    ],
  },
  semax: {
    slug: 'semax-10mg',
    metaTitle: 'Semax 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Semax 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Semax peptide is a synthetic ACTH-derived heptapeptide studied in research examining neuropeptide signalling pathways.',
      'Published studies have explored Semax in laboratory models investigating BDNF and neurotrophin-related systems.',
      'Laminin Peptide Lab supplies Semax peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  selank: {
    slug: 'selank-10mg',
    metaTitle: 'Selank 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Selank 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Selank peptide is a synthetic tuftsin-derived analogue studied in research examining neuropeptide signalling pathways.',
      'Published studies have explored Selank in laboratory models investigating neurotransmitter systems and receptor interactions.',
      'Laminin Peptide Lab supplies Selank peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  retatrutide: {
    slug: 'retatrutide',
    metaTitle: 'Retatrutide | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Retatrutide research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Retatrutide peptide is a multi-receptor agonist studied in research examining GLP-1, GIP, and glucagon receptor signalling.',
      'Published studies have explored Retatrutide in laboratory models investigating metabolic pathways and endocrine signalling systems.',
      'Laminin Peptide Lab supplies Retatrutide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'nad-plus': {
    slug: 'nad-1000mg',
    metaTitle: 'NAD+ 1000mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'NAD+ 1000mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'NAD+ is a coenzyme involved in cellular energy metabolism studied in research examining redox reactions and metabolic pathways.',
      'Published studies have explored NAD+ in laboratory models investigating mitochondrial function and cellular energy systems.',
      'Laminin Peptide Lab supplies NAD+ in lyophilised form for laboratory research purposes only.',
    ],
  },
  'mots-c': {
    slug: 'mots-c-40mg',
    metaTitle: 'MOTS-c 40mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'MOTS-c 40mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'MOTS-c peptide is a mitochondrial-derived peptide studied in research examining metabolic signalling and energy regulation pathways.',
      'Published studies have explored MOTS-c in laboratory models investigating metabolic homeostasis and mitochondrial communication.',
      'Laminin Peptide Lab supplies MOTS-c peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  klow: {
    slug: 'klow-80mg',
    metaTitle: 'KLOW 80mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'KLOW 80mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'KLOW is a multi-peptide formulation containing BPC-157, TB-500, GHK-Cu, and KPV studied in research examining peptide signalling systems.',
      'Published studies have explored these peptides in laboratory models investigating cellular communication and regulatory pathways.',
      'Laminin Peptide Lab supplies KLOW in lyophilised form for laboratory research purposes only.',
    ],
  },
  ipamorelin: {
    slug: 'ipamorelin-10mg',
    metaTitle: 'Ipamorelin 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Ipamorelin 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Ipamorelin peptide is a selective GHSR agonist studied in research examining endocrine signalling pathways.',
      'Published studies have explored Ipamorelin in laboratory models investigating growth hormone pathways and receptor activity.',
      'Laminin Peptide Lab supplies Ipamorelin peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  glow: {
    slug: 'glow-70mg',
    metaTitle: 'GLOW 70mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'GLOW 70mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'GLOW is a multi-peptide formulation combining BPC-157, TB-500, and GHK-Cu studied in research examining extracellular matrix pathways.',
      'Published studies have explored these peptides in laboratory models investigating cellular communication systems.',
      'Laminin Peptide Lab supplies GLOW in lyophilised form for laboratory research purposes only.',
    ],
  },
  'ghk-cu': {
    slug: 'ghk-cu-100mg',
    metaTitle: 'GHK-Cu 100mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'GHK-Cu 100mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'GHK-Cu peptide is a copper-binding tripeptide studied in research examining cellular signalling pathways.',
      'Published studies have explored GHK-Cu in laboratory models investigating extracellular matrix processes.',
      'Laminin Peptide Lab supplies GHK-Cu peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  epithalon: {
    slug: 'epithalon-50mg',
    metaTitle: 'Epithalon 50mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Epithalon 50mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Epithalon peptide is a synthetic tetrapeptide studied in research examining cellular regulatory mechanisms.',
      'Published studies have explored Epithalon in laboratory models investigating signalling pathways and metabolic systems.',
      'Laminin Peptide Lab supplies Epithalon peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'cjc-1295-ipamorelin': {
    slug: 'cjc1295-ipamorelin-20mg',
    metaTitle:
      'CJC-1295 / Ipamorelin 20mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'CJC-1295 / Ipamorelin 20mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'CJC-1295 / Ipamorelin is a peptide combination studied in research examining growth hormone signalling pathways.',
      'Published studies have explored this combination in laboratory models investigating endocrine systems.',
      'Laminin Peptide Lab supplies this formulation in lyophilised form for laboratory research purposes only.',
    ],
  },
  cerebrolysin: {
    slug: 'cerebrolysin-60mg',
    metaTitle: 'Cerebrolysin 60mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'Cerebrolysin 60mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'Cerebrolysin is a peptide preparation studied in research examining neurotrophic signalling pathways.',
      'Published studies have explored Cerebrolysin in laboratory models investigating neuronal communication systems.',
      'Laminin Peptide Lab supplies Cerebrolysin in lyophilised form for laboratory research purposes only.',
    ],
  },
  'bpc157-tb500-blend': {
    slug: 'bpc157-tb500-20mg',
    metaTitle:
      'BPC-157 / TB-500 20mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'BPC-157 / TB-500 20mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'BPC-157 / TB-500 is a peptide combination studied in research examining extracellular matrix and signalling pathways.',
      'Published studies have explored this combination in laboratory models investigating cellular communication.',
      'Laminin Peptide Lab supplies this formulation in lyophilised form for laboratory research purposes only.',
    ],
  },
  'bpc-157': {
    slug: 'bpc157-10mg',
    metaTitle: 'BPC-157 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'BPC-157 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'BPC-157 peptide is a synthetic pentadecapeptide studied in research examining nitric oxide and peptide signalling pathways.',
      'Published studies have explored BPC-157 in laboratory models investigating extracellular matrix interactions.',
      'Laminin Peptide Lab supplies BPC-157 peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  'ara-290': {
    slug: 'ara-290-10mg',
    metaTitle: 'ARA-290 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      'ARA-290 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      'ARA-290 peptide is an EPO-derived analogue studied in research examining receptor-mediated signalling pathways.',
      'Published studies have explored ARA-290 in laboratory models investigating erythropoietin pathways.',
      'Laminin Peptide Lab supplies ARA-290 peptide in lyophilised form for laboratory research purposes only.',
    ],
  },
  '5-amino-1mq': {
    slug: '5-amino-1mq-10mg',
    metaTitle: '5-Amino-1MQ 10mg | Research Compound | Laminin Peptide Lab',
    metaDescription:
      '5-Amino-1MQ 10mg research compound supplied for laboratory use. High purity with analytical verification and COA available.',
    paragraphs: [
      '5-Amino-1MQ is a small molecule studied in research examining metabolic regulation pathways.',
      'Published studies have explored 5-Amino-1MQ in laboratory models investigating enzyme-related signalling systems.',
      'Laminin Peptide Lab supplies 5-Amino-1MQ in lyophilised form for laboratory research purposes only.',
    ],
  },
};

/** Storefront-style PDP title (all caps, strength) — aligned with shop mocks */
export const PRODUCT_HEADLINE: Record<string, string> = {
  'cjc-1295-no-dac': 'CJC-1295 (NO DAC)',
  'melanotan-1': 'MELANOTAN 1 10MG',
  'melanotan-2': 'MELANOTAN 2 10MG',
  kpv: 'KPV 10MG',
  'cjc-1295-ipamorelin': 'CJC-1295 / IPAMORELIN 20MG',
  epithalon: 'EPITHALON 50MG',
  '5-amino-1mq': '5-AMINO-1MQ 10MG',
  'bpc157-tb500-blend': 'BPC-157 / TB-500 20MG',
  selank: 'SELANK 10MG',
  'ss-31': 'SS-31 50MG',
  glow: 'GLOW 70MG',
  'ghk-cu': 'GHK-CU',
  'igf-1-lr3': 'IGF-1 LR3 1MG',
  cerebrolysin: 'CEREBROLYSIN 60MG',
  'tb-500': 'TB-500 10MG',
  'mots-c': 'MOTS-C 40MG',
  'foxo4-dri': 'FOXO4-DRI 10MG',
  retatrutide: 'RETATRUTIDE',
  glutathione: 'GLUTATHIONE 1500MG',
  'acetic-acid-water': 'AA WATER 10ML',
  'bacteriostatic-water': 'BAC WATER 3ML',
  'ara-290': 'ARA-290 10MG',
  ipamorelin: 'IPAMORELIN 10MG',
  'bpc-157': 'BPC-157',
  'nad-plus': 'NAD+ 1000MG',
  semax: 'SEMAX 10MG',
  klow: 'KLOW 80MG',
};

export function getProductHeadline(
  peptideId: string,
  fallbackName: string
): string {
  return PRODUCT_HEADLINE[peptideId] ?? fallbackName.toUpperCase();
}

export function getProductSlug(peptideId: string): string {
  return PRODUCT_COPY[peptideId]?.slug ?? peptideId;
}

export function getPeptideIdFromSlug(slug: string): string | undefined {
  for (const [id, entry] of Object.entries(PRODUCT_COPY)) {
    if (entry.slug === slug) return id;
  }
  return undefined;
}

export function getProductCopy(peptideId: string): ProductCopyEntry | undefined {
  return PRODUCT_COPY[peptideId];
}
