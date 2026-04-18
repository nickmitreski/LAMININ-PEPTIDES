// Peptide data for research institutions and laboratories

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
    class: 'Small-molecule NNMT inhibitor',
    categories: ['metabolic'],
    overview: 'Research compound targeting nicotinamide N-methyltransferase (NNMT) with demonstrated effects on adipose tissue and metabolic pathways in experimental models.',
    mechanism: 'NNMT modulation influences methyl-group handling and fat-storage pathways, offering novel research opportunities in metabolic regulation.',
    highlights: 'Published studies demonstrate significant reduction in fat accumulation across multiple experimental models, with reproducible metabolic endpoint changes.',
    citations: [
      { title: 'PubMed 28969874', url: 'https://pubmed.ncbi.nlm.nih.gov/28969874/' },
      { title: 'Sci Rep (Nature)', url: 'https://www.nature.com/articles/srep19334' },
    ],
    evidenceNote: 'Strong preclinical foundation with published peer-reviewed research.',
  },
  {
    id: 'ara-290',
    name: 'ARA-290 (cibinetide)',
    class: 'EPO-derived peptide analogue',
    categories: ['neurology', 'repair'],
    overview: 'Advanced peptide studied in clinical trials for neuropathic pain and inflammatory pathways, representing an active area of translational research.',
    mechanism: 'Activates innate repair receptors and cytoprotective signaling pathways, offering research applications in tissue protection and regeneration.',
    highlights: 'Multiple human clinical trials completed investigating applications in neuropathy and organ protection, with ongoing research expansion.',
    citations: [
      { title: 'PubMed 25988553', url: 'https://pubmed.ncbi.nlm.nih.gov/25988553/' },
      { title: 'ClinicalTrials.gov search: ARA-290', url: 'https://clinicaltrials.gov/search?q=ARA-290' },
    ],
    evidenceNote: 'Clinical-stage research with multiple completed human trials.',
  },
  {
    id: 'bpc-157',
    name: 'BPC-157',
    class: '15-amino-acid gastric peptide fragment',
    categories: ['repair'],
    overview: 'Extensively researched peptide with demonstrated effects on tendon, gut, and wound healing across comprehensive experimental models.',
    mechanism: 'Promotes fibroblast migration and survival through cytoskeletal signaling (FAK/paxillin pathways), supporting tissue regeneration research.',
    highlights: 'Robust experimental evidence showing accelerated Achilles tendon repair and enhanced wound healing across multiple published studies.',
    citations: [
      { title: 'PubMed 21030672', url: 'https://pubmed.ncbi.nlm.nih.gov/21030672/' },
      { title: 'PubMed 24512719', url: 'https://pubmed.ncbi.nlm.nih.gov/24512719/' },
    ],
    evidenceNote: 'Comprehensive experimental research with consistent positive findings.',
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    class: 'Thymosin beta-4 fragment',
    categories: ['repair'],
    overview: 'Well-characterized peptide with established effects on actin binding, cell migration, and angiogenesis in tissue repair models.',
    mechanism: 'G-actin sequestration modulates cytoskeletal dynamics and cell motility, supporting research in regenerative medicine applications.',
    highlights: 'Published research demonstrates enhanced cell migration and vessel formation, with applications in wound healing and tissue regeneration.',
    citations: [
      { title: 'PubMed 12526801', url: 'https://pubmed.ncbi.nlm.nih.gov/12526801/' },
      { title: 'PubMed 17088451', url: 'https://pubmed.ncbi.nlm.nih.gov/17088451/' },
    ],
    evidenceNote: 'Established research foundation with translational potential.',
  },
  {
    id: 'cjc-1295-ipamorelin',
    name: 'CJC-1295 + ipamorelin',
    class: 'GH secretagogue combination',
    categories: ['metabolic', 'repair'],
    overview: 'Research combination exploring pulsatile growth hormone release with demonstrated pharmacological activity in clinical studies.',
    mechanism: 'CJC-1295 extends GH pulsatility while ipamorelin provides selective GH stimulation, offering research opportunities in growth hormone axis modulation.',
    highlights: 'Clinical pharmacology studies demonstrate sustained GH/IGF axis elevation with favorable selectivity profiles compared to earlier compounds.',
    citations: [
      { title: 'PubMed 16352683', url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/' },
      { title: 'PubMed 10893323', url: 'https://pubmed.ncbi.nlm.nih.gov/10893323/' },
    ],
    evidenceNote: 'Clinical pharmacology research with documented bioactivity.',
  },
  {
    id: 'cerebrolysin',
    name: 'Cerebrolysin',
    class: 'Peptide-rich neurotrophic preparation',
    categories: ['neurology'],
    overview: 'Peptide mixture with extensive research in stroke recovery and neurodegenerative conditions, representing decades of clinical investigation.',
    mechanism: 'Multiple neurotrophic and neuroprotective mechanisms demonstrated in experimental models, supporting diverse neurological research applications.',
    highlights: 'Multiple clinical trials and meta-analyses published, with ongoing research into optimal protocols and application areas.',
    citations: [
      { title: 'PubMed 20382210', url: 'https://pubmed.ncbi.nlm.nih.gov/20382210/' },
      { title: 'PubMed 29178441', url: 'https://pubmed.ncbi.nlm.nih.gov/29178441/' },
    ],
    evidenceNote: 'Extensive clinical research foundation across multiple indications.',
  },
  {
    id: 'epithalon',
    name: 'Epithalon (epitalon)',
    class: 'Synthetic tetrapeptide',
    categories: ['longevity'],
    overview: 'Research peptide targeting telomerase activity and aging biomarkers, representing frontier research in longevity science.',
    mechanism: 'Demonstrates effects on telomerase expression in experimental systems, offering research opportunities in cellular aging mechanisms.',
    highlights: 'Published research shows telomerase activity modulation and aging biomarker effects in controlled experimental conditions.',
    citations: [
      { title: 'PubMed 15998704', url: 'https://pubmed.ncbi.nlm.nih.gov/15998704/' },
    ],
    evidenceNote: 'Active area of longevity research with published findings.',
  },
  {
    id: 'foxo4-dri',
    name: 'FOXO4-DRI',
    class: 'Senolytic peptide construct',
    categories: ['longevity', 'repair'],
    overview: 'Innovative senolytic peptide with landmark research demonstrating selective clearance of senescent cells and tissue function restoration.',
    mechanism: 'Disrupts FOXO4-p53 interactions to induce selective apoptosis in senescent cells, representing cutting-edge anti-aging research.',
    highlights: 'Breakthrough research published in Cell showing tissue rejuvenation and functional restoration in experimental models.',
    citations: [
      { title: 'Cell 2017', url: 'https://www.cell.com/cell/fulltext/S0092-8674(17)30246-5' },
    ],
    evidenceNote: 'Pioneering research in cellular senescence with high-impact publications.',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    class: 'Copper-peptide complex',
    categories: ['skin', 'repair'],
    overview: 'Well-established peptide with extensive research in collagen synthesis, extracellular matrix remodeling, and dermal repair.',
    mechanism: 'Modulates matrix metalloproteinase balance and supports dermal repair signaling, offering versatile research applications in tissue regeneration.',
    highlights: 'Comprehensive research demonstrates enhanced collagen synthesis and tissue remodeling across multiple experimental models.',
    citations: [
      { title: 'PubMed 19924961', url: 'https://pubmed.ncbi.nlm.nih.gov/19924961/' },
    ],
    evidenceNote: 'Strong research foundation in dermal biology and wound healing.',
  },
  {
    id: 'igf-1-lr3',
    name: 'IGF-1 LR3',
    class: 'Extended half-life IGF-1 variant',
    categories: ['metabolic', 'repair'],
    overview: 'Research tool for studying IGF-1 receptor signaling with enhanced pharmacokinetic properties enabling extended experimental protocols.',
    mechanism: 'Activates IGF-1 receptor pathways supporting proliferation and survival signaling, valuable for anabolic research applications.',
    highlights: 'Demonstrated enhanced muscle cell proliferation and extended bioavailability compared to native IGF-1 in experimental systems.',
    citations: [
      { title: 'PubMed 12813129', url: 'https://pubmed.ncbi.nlm.nih.gov/12813129/' },
    ],
    evidenceNote: 'Valuable research tool for IGF signaling pathway studies.',
  },
  {
    id: 'kpv',
    name: 'KPV',
    class: 'α-MSH tripeptide fragment',
    categories: ['repair'],
    overview: 'Research peptide targeting melanocortin pathways with demonstrated anti-inflammatory effects in gut and skin inflammation models.',
    mechanism: 'MC receptor-mediated anti-inflammatory signaling, offering research opportunities in inflammatory pathway modulation.',
    highlights: 'Published research shows significant reduction in inflammatory markers across multiple experimental inflammation models.',
    citations: [
      { title: 'PubMed 16173914', url: 'https://pubmed.ncbi.nlm.nih.gov/16173914/' },
    ],
    evidenceNote: 'Promising preclinical research in inflammation control.',
  },
  {
    id: 'melanotan',
    name: 'Melanotan I & II',
    class: 'Melanocortin receptor agonists',
    categories: ['skin', 'metabolic'],
    overview: 'Research compounds targeting melanocortin receptors with MT-I (afamelanotide) having established clinical applications in photoprotection research.',
    mechanism: 'MC1R activation drives eumelanin production; MT-II shows broader MC receptor activity enabling diverse research applications.',
    highlights: 'MT-I demonstrates established photoprotection effects; MT-II offers research opportunities across metabolic and pigmentation pathways.',
    citations: [
      { title: 'PubMed 10566877', url: 'https://pubmed.ncbi.nlm.nih.gov/10566877/' },
    ],
    evidenceNote: 'MT-I with clinical applications; MT-II for specialized research use.',
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    class: 'Mitochondrial-derived peptide',
    categories: ['metabolic', 'longevity'],
    overview: 'Cutting-edge research peptide linking mitochondrial signaling to metabolism and exercise adaptation, representing frontier metabolic research.',
    mechanism: 'AMPK-mediated metabolic reprogramming with demonstrated insulin sensitivity improvements in experimental models.',
    highlights: 'High-impact Cell Metabolism publication demonstrating significant metabolic effects and exercise adaptation enhancement.',
    citations: [
      { title: 'Cell Metabolism 2015', url: 'https://www.cell.com/cell-metabolism/fulltext/S1550-4131(15)00368-9' },
    ],
    evidenceNote: 'Cutting-edge metabolic research with high-impact publications.',
  },
  {
    id: 'nad-plus',
    name: 'NAD+',
    class: 'Essential redox coenzyme',
    categories: ['longevity', 'metabolic'],
    overview: 'Central metabolic coenzyme with extensive research showing age-related changes and restoration potential through various precursor strategies.',
    mechanism: 'Powers sirtuins, PARPs, and mitochondrial function, representing fundamental research opportunities in cellular energetics and aging.',
    highlights: 'Comprehensive research documenting age-related decline and therapeutic restoration potential across multiple tissue types.',
    citations: [
      { title: 'Cell 2013 (review)', url: 'https://www.cell.com/fulltext/S0092-8674(13)01209-0' },
    ],
    evidenceNote: 'Foundational research area with extensive clinical investigation.',
  },
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    class: 'Triple incretin agonist',
    categories: ['metabolic'],
    overview: 'Advanced triple agonist with Phase 2 clinical data demonstrating substantial metabolic effects, representing next-generation incretin research.',
    mechanism: 'Simultaneous GIP/GLP-1/glucagon receptor activation produces synergistic effects on intake, energy expenditure, and substrate metabolism.',
    highlights: 'Phase 2 NEJM publication showing significant mean weight reduction at 48 weeks, establishing proof-of-concept for triple agonism.',
    citations: [
      { title: 'NEJM 2023', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972' },
      { title: 'PubMed / DOI', url: 'https://doi.org/10.1056/NEJMoa2301972' },
    ],
    evidenceNote: 'Phase 2 clinical evidence with peer-reviewed publication.',
  },
  {
    id: 'selank-semax',
    name: 'Selank & Semax',
    class: 'Synthetic nootropic peptides',
    categories: ['neurology'],
    overview: 'Research peptides with demonstrated effects on anxiety and memory systems, offering research opportunities in neurotransmitter modulation.',
    mechanism: 'Selank modulates serotonin/GABA systems; Semax influences BDNF pathways, supporting diverse cognitive research applications.',
    highlights: 'Published research demonstrates anxiolytic-like effects and cognitive enhancement across multiple experimental paradigms.',
    citations: [
      { title: 'PubMed 18220669', url: 'https://pubmed.ncbi.nlm.nih.gov/18220669/' },
      { title: 'PubMed 11399308', url: 'https://pubmed.ncbi.nlm.nih.gov/11399308/' },
    ],
    evidenceNote: 'Established research foundation in neurocognitive applications.',
  },
  {
    id: 'ss-31',
    name: 'SS-31 (Elamipretide)',
    class: 'Mitochondria-targeted peptide',
    categories: ['repair', 'neurology'],
    overview: 'Specialized peptide targeting inner mitochondrial membrane with clinical development across mitochondrial disease and cardiology applications.',
    mechanism: 'Cardiolipin interaction stabilizes electron transport efficiency, offering research opportunities in bioenergetic optimization.',
    highlights: 'Clinical trials demonstrate improved bioenergetic markers in mitochondrial disease and heart failure research models.',
    citations: [
      { title: 'PubMed 23747427', url: 'https://pubmed.ncbi.nlm.nih.gov/23747427/' },
    ],
    evidenceNote: 'Clinical-stage research in mitochondrial medicine.',
  },
  {
    id: 'glutathione',
    name: 'Glutathione',
    class: 'Endogenous antioxidant tripeptide',
    categories: ['repair', 'metabolic'],
    overview: 'Master antioxidant with extensive research across oxidative stress, immune function, and detoxification pathways.',
    mechanism: 'Neutralizes ROS, supports immune cell function, and enables conjugation reactions central to cellular detoxification research.',
    highlights: 'Comprehensive literature base documenting diverse protective effects across multiple organ systems and disease models.',
    citations: [
      { title: 'PubMed 16825650', url: 'https://pubmed.ncbi.nlm.nih.gov/16825650/' },
    ],
    evidenceNote: 'Extensively researched antioxidant with broad applications.',
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
    description: 'Nerve protection, stroke recovery research, mood/cognition studies',
  },
  {
    id: 'longevity',
    label: 'Longevity & cellular',
    description: 'Senescence, telomeres, NAD pathways, aging research',
  },
  {
    id: 'skin',
    label: 'Skin & pigmentation',
    description: 'Dermal matrix, copper peptides, melanocortin research',
  },
];
