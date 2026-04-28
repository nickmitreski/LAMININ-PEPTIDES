import { allPeptides } from '../data/peptides';
import { getProductSlug } from '../data/productContent';

export type ChatProductLink = { label: string; href: string };

/** Normalise for comparison: lower case, collapse spaces, strip common dose suffixes. */
function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s*[\d.]+\s*mg\s*$/i, '')
    .trim();
}

/**
 * When the model says "CJC-1295" it usually means the no-DAC SKU; "CJC-1295 + Ipamorelin" is the blend.
 * Other short names that would otherwise be ambiguous.
 */
const ALIAS_TO_PEPTIDE_ID: Record<string, string> = {
  'cjc-1295': 'cjc-1295-no-dac',
  cjc1295: 'cjc-1295-no-dac',
  '5-amino-1mq': '5-amino-1mq',
  '5 amino 1mq': '5-amino-1mq',
  '5-amino-1 mq': '5-amino-1mq',
  'mots-c': 'mots-c',
  'mots c': 'mots-c',
  motsc: 'mots-c',
  'nad+': 'nad-plus',
  nad: 'nad-plus',
  'igf-1 lr3': 'igf-1-lr3',
  'igf-1lr3': 'igf-1-lr3',
  'bpc-157': 'bpc-157',
  'tb-500': 'tb-500',
  'ss-31': 'ss-31',
  ss31: 'ss-31',
  'foxo4-dri': 'foxo4-dri',
  foxo4: 'foxo4-dri',
  'ara-290': 'ara-290',
  'igf-1': 'igf-1-lr3',
};

function findPeptideIdForChip(chip: string): string | undefined {
  const trimmed = chip.trim();
  if (!trimmed) return undefined;

  const key = normalizeKey(trimmed);
  if (ALIAS_TO_PEPTIDE_ID[key]) return ALIAS_TO_PEPTIDE_ID[key];

  for (const p of allPeptides) {
    if (normalizeKey(p.name) === key) return p.id;
  }

  /** Substring match: shortest display name wins (e.g. "BPC-157" → standalone, not blend). */
  const substringHits: typeof allPeptides = [];
  for (const p of allPeptides) {
    const pn = normalizeKey(p.name);
    if (key.length >= 3 && pn.includes(key)) substringHits.push(p);
  }
  if (substringHits.length > 0) {
    substringHits.sort((a, b) => a.name.length - b.name.length);
    return substringHits[0].id;
  }

  for (const p of allPeptides) {
    const pn = normalizeKey(p.name);
    if (key.length >= 4 && key.includes(pn) && pn.length >= 4) return p.id;
  }

  return undefined;
}

export function suggestedPeptidesToLinks(chips: string[]): ChatProductLink[] {
  const out: ChatProductLink[] = [];
  const seen = new Set<string>();

  for (const chip of chips) {
    const id = findPeptideIdForChip(chip);
    if (!id) continue;
    const slug = getProductSlug(id);
    const href = `/products/${slug}`;
    if (seen.has(href)) continue;
    seen.add(href);
    const p = allPeptides.find((x) => x.id === id);
    out.push({ label: p?.name ?? chip.trim(), href });
  }

  return out;
}
