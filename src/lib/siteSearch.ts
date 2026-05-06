import type { Peptide } from '../data/peptides';
import { getProductSlug } from '../data/productContent';
import { PEPTIDE_PROFILES } from '../data/peptideData';

export type SiteSearchHitKind = 'product' | 'page' | 'research';

export type SiteSearchHit = {
  id: string;
  kind: SiteSearchHitKind;
  title: string;
  description: string;
  to: string;
};

const STATIC_PAGES: Array<{
  sid: string;
  title: string;
  description: string;
  to: string;
  terms: string[];
}> = [
  {
    sid: 'coa',
    title: 'Certificate of analysis',
    description: 'Browse COAs and analytical documentation',
    to: '/coa',
    terms: ['coa', 'certificate', 'analysis', 'purity', 'hplc', 'verification'],
  },
  {
    sid: 'research',
    title: 'Peptide science',
    description: 'Research profiles and evidence summaries',
    to: '/research',
    terms: ['research', 'science', 'peptide', 'profile', 'literature', 'study'],
  },
  {
    sid: 'library',
    title: 'Compound library',
    description: 'Full product catalogue',
    to: '/library',
    terms: ['library', 'catalog', 'catalogue', 'shop', 'products', 'compounds'],
  },
  {
    sid: 'contact',
    title: 'Contact',
    description: 'Reach our team',
    to: '/contact',
    terms: ['contact', 'email', 'support', 'help', 'reach'],
  },
  {
    sid: 'faq',
    title: 'FAQ',
    description: 'Common questions',
    to: '/faq',
    terms: ['faq', 'question', 'help'],
  },
  {
    sid: 'shipping',
    title: 'Shipping',
    description: 'Delivery and dispatch information',
    to: '/shipping',
    terms: ['shipping', 'delivery', 'dispatch', 'post', 'track'],
  },
  {
    sid: 'guarantee',
    title: 'Purity guarantee',
    description: 'Quality commitment',
    to: '/guarantee',
    terms: ['guarantee', 'quality', 'purity'],
  },
  {
    sid: 'calculator',
    title: 'Reconstitution calculator',
    description: 'Calculate volumes for lyophilised peptides',
    to: '/reconstitution-calculator',
    terms: ['reconstitution', 'calculator', 'bac water', 'mixing'],
  },
];

function productMatches(peptide: Peptide, q: string): boolean {
  const l = q.toLowerCase();
  return (
    peptide.name.toLowerCase().includes(l) ||
    peptide.id.toLowerCase().includes(l) ||
    peptide.category.toLowerCase().includes(l) ||
    peptide.libraryFilters.some((f) => f.toLowerCase().includes(l))
  );
}

/** Build merged site-wide search hits (pages, catalogue, research names) */
export function buildSiteSearchHits(query: string, peptides: Peptide[]): SiteSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SiteSearchHit[] = [];

  for (const p of STATIC_PAGES) {
    const titleMatch = p.title.toLowerCase().includes(q);
    const descMatch = p.description.toLowerCase().includes(q);
    const termMatch = p.terms.some((t) => t.includes(q) || q.includes(t));
    if (titleMatch || descMatch || termMatch) {
      hits.push({
        id: `page-${p.sid}`,
        kind: 'page',
        title: p.title,
        description: p.description,
        to: p.to,
      });
    }
  }

  const seenProducts = new Set<string>();
  for (const peptide of peptides) {
    if (!productMatches(peptide, q)) continue;
    if (seenProducts.has(peptide.id)) continue;
    seenProducts.add(peptide.id);
    hits.push({
      id: `product-${peptide.id}`,
      kind: 'product',
      title: peptide.name,
      description: `${peptide.category} · Product page`,
      to: `/products/${getProductSlug(peptide.id)}`,
    });
  }

  for (const profile of PEPTIDE_PROFILES) {
    const inName = profile.name.toLowerCase().includes(q);
    const inOverview = profile.overview.toLowerCase().includes(q);
    const inClass = profile.class.toLowerCase().includes(q);
    if (inName || inOverview || inClass) {
      hits.push({
        id: `research-${profile.id}`,
        kind: 'research',
        title: profile.name,
        description: 'Peptide science · ' + profile.class,
        to: '/research',
      });
    }
  }

  return hits.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );
}
