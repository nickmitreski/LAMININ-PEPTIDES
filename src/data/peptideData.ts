// Peptide data derived from public/laminin-research/peptide-profiles.md

export interface PeptideProfile {
  id: string;
  name: string;
  class: string;
  categories: string[];
  overview: string;
  mechanism: string;
  highlights: string;
  citations: Array<{
    title: string;
    url: string;
  }>;
  evidenceNote: string;
}

export const PEPTIDE_PROFILES: PeptideProfile[] = [
  {
    id: '5-amino-1mq',
    name: '5-Amino-1MQ',
    class: 'Small-molecule NNMT inhibitor (not a peptide)',
    categories: ['metabolic'],
    overview: 'Preclinical research compound targeting nicotinamide N-methyltransferase (NNMT), often discussed in adipose / metabolism models.',
    mechanism: 'NNMT modulation is linked in rodent work to altered methyl-group handling and fat-storage pathways; human translation is not established.',
    highlights: 'Reduced fat accumulation in rodent models (published reports); metabolic endpoints vary by study design.',
    citations: [
      { title: 'PubMed 28969874', url: 'https://pubmed.ncbi.nlm.nih.gov/28969874/' },
      { title: 'Sci Rep (Nature)', url: 'https://www.nature.com/articles/srep19334' },
    ],
    evidenceNote: 'Mostly preclinical.',
  },
  {
    id: 'ara-290',
    name: 'ARA-290 (cibinetide)',
    class: 'EPO-derived peptide analogue (tissue-protective signalling)',
    categories: ['neurology', 'repair'],
    overview: 'Studied for neuropathic pain, inflammatory pathways, and organ-specific trials; trial landscape is mixed (some studies terminated).',
    mechanism: 'Innate repair receptor / cytoprotective signalling (simplified); see primary papers for receptor detail.',
    highlights: 'Human trials in neuropathy and other indications; diabetic macular oedema trial NCT06626971 terminated—do not overstate outcomes.',
    citations: [
      { title: 'PubMed 25988553', url: 'https://pubmed.ncbi.nlm.nih.gov/25988553/' },
      { title: 'ClinicalTrials.gov search: ARA-290', url: 'https://clinicaltrials.gov/search?q=ARA-290' },
    ],
    evidenceNote: 'Clinical-stage but indication-specific; read each trial.',
  },
  {
    id: 'bpc-157',
    name: 'BPC-157',
    class: '15-amino-acid fragment related to gastric juice–derived BPC',
    categories: ['repair'],
    overview: 'Heavily studied in animals for tendon, gut, and wound models; human RCTs for marketed claims are limited.',
    mechanism: 'Promotes fibroblast migration/survival and cytoskeletal signalling (e.g. FAK/paxillin) in in vitro / rodent tendon work.',
    highlights: 'Accelerated Achilles tendon outgrowth/migration in rodent explants; many reviews and secondary studies—quality varies.',
    citations: [
      { title: 'PubMed 21030672', url: 'https://pubmed.ncbi.nlm.nih.gov/21030672/' },
      { title: 'PubMed 24512719', url: 'https://pubmed.ncbi.nlm.nih.gov/24512719/' },
    ],
    evidenceNote: 'Predominantly animal / lab; do not imply proven human healing.',
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    class: 'Synthetic fragment related to thymosin beta-4',
    categories: ['repair'],
    overview: 'Research focus on actin binding, cell migration, and angiogenesis in wound models.',
    mechanism: 'G-actin sequestration → affects cytoskeletal dynamics and cell motility (classic TB4 biology).',
    highlights: 'Cell migration and vessel formation in experimental models; human therapeutic approvals differ by peptide/formulation.',
    citations: [
      { title: 'PubMed 12526801', url: 'https://pubmed.ncbi.nlm.nih.gov/12526801/' },
      { title: 'PubMed 17088451', url: 'https://pubmed.ncbi.nlm.nih.gov/17088451/' },
    ],
    evidenceNote: 'Mixed human vs preclinical; context per paper.',
  },
  {
    id: 'cjc-1295-ipamorelin',
    name: 'CJC-1295 + ipamorelin',
    class: 'GH secretagogues (GHRH analogue + GHRP-class agonist)',
    categories: ['metabolic', 'repair'],
    overview: 'Pharmacology research explores pulsatile GH release vs prolonged elevation; not a consumer approval bundle in most jurisdictions.',
    mechanism: 'CJC-1295 (DAC-modified GHRH analog) extends GH pulsatility profile; ipamorelin selectively stimulates GH release with less cortisol/prolactin vs some older secretagogues.',
    highlights: 'Sustained GH/IGF axis markers with CJC-class peptides in clinical pharmacology literature; ipamorelin human GH data in older trials.',
    citations: [
      { title: 'PubMed 16352683', url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/' },
      { title: 'PubMed 10893323', url: 'https://pubmed.ncbi.nlm.nih.gov/10893323/' },
    ],
    evidenceNote: 'Prescription/regulatory status varies; educational only.',
  },
  {
    id: 'cerebrolysin',
    name: 'Cerebrolysin',
    class: 'Peptide-rich porcine brain–derived preparation (mixture)',
    categories: ['neurology'],
    overview: 'Studied in stroke and neurodegenerative contexts; availability and approval differ by country.',
    mechanism: 'Neurotrophic / modulatory effects in experimental models; exact active moieties are mixed.',
    highlights: 'Trials and meta-analyses exist; effect sizes and guidelines are not universal.',
    citations: [
      { title: 'PubMed 20382210', url: 'https://pubmed.ncbi.nlm.nih.gov/20382210/' },
      { title: 'PubMed 29178441', url: 'https://pubmed.ncbi.nlm.nih.gov/29178441/' },
    ],
    evidenceNote: 'Interpret per indication and trial quality.',
  },
  {
    id: 'epithalon',
    name: 'Epithalon (epitalon)',
    class: 'Synthetic tetrapeptide (endogenous pineal-related sequence analog)',
    categories: ['longevity'],
    overview: 'Often discussed for telomerase and aging biomarkers; human data sparse vs animal work.',
    mechanism: 'Reported effects on telomerase expression in some in vitro / animal models; not established longevity therapy in humans.',
    highlights: 'Telomerase activity changes in limited experimental settings.',
    citations: [
      { title: 'PubMed 15998704', url: 'https://pubmed.ncbi.nlm.nih.gov/15998704/' },
    ],
    evidenceNote: 'High speculation vs evidence ratio in popular content—keep conservative.',
  },
  {
    id: 'foxo4-dri',
    name: 'FOXO4-DRI',
    class: 'Senolytic peptide construct (FOXO4–p53 interaction interference)',
    categories: ['longevity', 'repair'],
    overview: 'Landmark mouse work on clearing senescent cells and restoring tissue function; human translation early.',
    mechanism: 'Induces apoptosis in senescent-like cells in transgenic / model systems via p53-related pathway disruption.',
    highlights: '"Rejuvenation" phenotypes in aged mice; not a proven human anti-aging drug.',
    citations: [
      { title: 'Cell 2017', url: 'https://www.cell.com/cell/fulltext/S0092-8674(17)30246-5' },
    ],
    evidenceNote: 'Mostly mouse; potent biology, early translation.',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    class: 'Copper(II)-complexed tripeptide (Gly-His-Lys)',
    categories: ['skin', 'repair'],
    overview: 'Cosmetic and wound-healing literature on collagen, extracellular matrix, and inflammation.',
    mechanism: 'Modulates matrix metalloprotein balance and supports dermal repair signalling in experimental models.',
    highlights: 'Collagen synthesis / remodelling in skin and wound models; human cosmetic evidence varies by formulation.',
    citations: [
      { title: 'PubMed 19924961', url: 'https://pubmed.ncbi.nlm.nih.gov/19924961/' },
    ],
    evidenceNote: 'Strong lab story; cosmetic claims should stay modest.',
  },
  {
    id: 'igf-1-lr3',
    name: 'IGF-1 LR3',
    class: 'IGF-1 variant with LR3 extension (longer half-life)',
    categories: ['metabolic', 'repair'],
    overview: 'Research tool / experimental anabolic signalling probe; regulated differently than insulin.',
    mechanism: 'Activates IGF-1 receptor → proliferation/survival pathways in many cell types.',
    highlights: 'Increased muscle cell proliferation in culture; pharmacokinetics differ from native IGF-1.',
    citations: [
      { title: 'PubMed 12813129', url: 'https://pubmed.ncbi.nlm.nih.gov/12813129/' },
    ],
    evidenceNote: 'Not a wellness product claim; serious regulatory constraints in sport/medicine.',
  },
  {
    id: 'kpv',
    name: 'KPV',
    class: 'α-MSH–related tripeptide fragment',
    categories: ['repair'],
    overview: 'Studied in gut and skin inflammation models as a melanocortin pathway modulator.',
    mechanism: 'MC receptor–mediated anti-inflammatory effects in experimental systems.',
    highlights: 'Reduced inflammatory markers in animal/colitis-like models; human translation evolving.',
    citations: [
      { title: 'PubMed 16173914', url: 'https://pubmed.ncbi.nlm.nih.gov/16173914/' },
    ],
    evidenceNote: 'Mostly preclinical.',
  },
  {
    id: 'melanotan',
    name: 'Melanotan I & II',
    class: 'Melanocortin analogues',
    categories: ['skin', 'metabolic'],
    overview: 'MT-I (afamelanotide) has regulated uses in some regions for photoprotection disorders; MT-II is often discussed for tanning / libido in grey-market contexts—safety and legality issues.',
    mechanism: 'MC1R → eumelanin; MT-II also hits broader MC receptors → more side effects in reports.',
    highlights: 'Increased pigmentation; MT-II linked to nausea, flushing, spontaneous erections in literature/case reports.',
    citations: [
      { title: 'PubMed 10566877', url: 'https://pubmed.ncbi.nlm.nih.gov/10566877/' },
    ],
    evidenceNote: 'Strong caution: misuse, UV risk, and regulatory bans in several markets.',
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    class: 'Mitochondrial-derived peptide (16 aa, encoded in mtDNA)',
    categories: ['metabolic', 'longevity'],
    overview: 'Emerging biology tying mitochondrial signalling to metabolism and exercise adaptation.',
    mechanism: 'AMPK-related metabolic reprogramming in rodent models; improves insulin sensitivity in some reports.',
    highlights: 'Cell Metabolism paper describes metabolic effects in mice; human data limited.',
    citations: [
      { title: 'Cell Metabolism 2015', url: 'https://www.cell.com/cell-metabolism/fulltext/S1550-4131(15)00368-9' },
    ],
    evidenceNote: 'Hot research area; early for consumer claims.',
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    class: 'Coenzyme (not a peptide)',
    categories: ['longevity', 'metabolic'],
    overview: 'Central redox cofactor; levels change with age in some tissues; precursors (NR, NMN) widely studied.',
    mechanism: 'Fuels sirtuins, PARPs, mitochondrial redox couples; restoration strategies are trial-dependent.',
    highlights: 'Age-related decline documented in various models; human supplementation trials mixed by endpoint.',
    citations: [
      { title: 'Cell 2013 (review)', url: 'https://www.cell.com/fulltext/S0092-8674(13)01209-0' },
    ],
    evidenceNote: 'Distinguish NAD+ from specific precursor brands and their trial data.',
  },
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    class: 'GIP / GLP-1 / glucagon triple agonist',
    categories: ['metabolic'],
    overview: 'Phase 2 obesity trial showed large mean weight loss vs placebo at 48 weeks; GI and heart-rate effects matter.',
    mechanism: 'Incretin + glucagon receptor activation → intake, energy expenditure, and substrate handling changes per trial discussion.',
    highlights: 'Significant weight loss in phase 2 trial; investigational compound from Lilly.',
    citations: [
      { title: 'NEJM 2023', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972' },
      { title: 'PubMed / DOI', url: 'https://doi.org/10.1056/NEJMoa2301972' },
    ],
    evidenceNote: 'Human phase 2; not the same as compounded peptides; Lilly investigational program.',
  },
  {
    id: 'selank-semax',
    name: 'Selank & Semax',
    class: 'Synthetic nootropic peptides',
    categories: ['neurology'],
    overview: 'Animal and some human exploratory work on anxiety, memory, neurotrophins; Western regulatory status limited.',
    mechanism: 'Modulates neurotransmitter systems (e.g. serotonin/GABA balance for selank; BDNF angles for semax).',
    highlights: 'Anxiolytic-like and cognitive effects in animal models; human trials smaller / non-Western.',
    citations: [
      { title: 'PubMed 18220669', url: 'https://pubmed.ncbi.nlm.nih.gov/18220669/' },
      { title: 'PubMed 11399308', url: 'https://pubmed.ncbi.nlm.nih.gov/11399308/' },
    ],
    evidenceNote: 'Language and replication footprint differ from mainstream US drugs.',
  },
  {
    id: 'ss-31',
    name: 'SS-31 (Elamipretide)',
    class: 'Mitochondria-targeted aromatic-cation peptide',
    categories: ['repair', 'neurology'],
    overview: 'Clinical development focus on mitochondrial diseases, heart failure subsets, and related indications; outcomes vary by trial.',
    mechanism: 'Stabilizes inner mitochondrial membrane / electron transport efficiency in disease models.',
    highlights: 'Improved bioenergetic markers in some human studies; not universally positive across indications.',
    citations: [
      { title: 'PubMed 23747427', url: 'https://pubmed.ncbi.nlm.nih.gov/23747427/' },
    ],
    evidenceNote: 'Check latest trial readouts—field has had mixed phase results.',
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    class: 'Endogenous tripeptide antioxidant',
    categories: ['repair', 'metabolic'],
    overview: 'Master redox buffer; IV/oral/liposomal debates are about bioavailability and indication.',
    mechanism: 'Neutralises ROS, supports immune cell redox, conjugation reactions in detox pathways.',
    highlights: 'Broad literature on oxidative stress; supplementation trials depend heavily on route and population.',
    citations: [
      { title: 'PubMed 16825650', url: 'https://pubmed.ncbi.nlm.nih.gov/16825650/' },
    ],
    evidenceNote: '"Detox" marketing often oversells; stick to redox/immunology framing.',
  },
];

export interface CategoryFilter {
  id: string;
  label: string;
  description: string;
}

export const CATEGORY_FILTERS: CategoryFilter[] = [
  {
    id: 'metabolic',
    label: 'Metabolic & body composition',
    description: 'Weight regulation, insulin sensitivity, GH axis, energy metabolism',
  },
  {
    id: 'repair',
    label: 'Repair & recovery',
    description: 'Tissue healing, mitochondria, antioxidant support',
  },
  {
    id: 'neurology',
    label: 'Neurology & cognition',
    description: 'Nerve protection, stroke recovery research, mood/cognition (study context)',
  },
  {
    id: 'longevity',
    label: 'Longevity & cellular',
    description: 'Senescence, telomeres, NAD pathways — mostly preclinical',
  },
  {
    id: 'skin',
    label: 'Skin & pigmentation',
    description: 'Dermal matrix, copper peptides, melanocortin-related research',
  },
];
