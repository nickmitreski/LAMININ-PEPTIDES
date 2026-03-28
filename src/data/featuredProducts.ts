import { productImageFile, cfgProductFiles } from './peptides';

export interface FeaturedProduct {
  /** Matches `Peptide.id` for PDP routing and pricing */
  peptideId: string;
  name: string;
  price: string;
  pricePrefix?: string;
  image: string;
}

export const featuredProducts: FeaturedProduct[] = [
  {
    peptideId: 'semax',
    name: 'SEMAX 10MG',
    price: '$79.00',
    image: productImageFile(cfgProductFiles.semax),
  },
  {
    peptideId: 'selank',
    name: 'SELANK 10MG',
    price: '$79.00',
    image: productImageFile(cfgProductFiles.selank),
  },
  {
    peptideId: 'retatrutide',
    name: 'RETATRUTIDE',
    pricePrefix: 'FROM',
    price: '$149.00',
    image: productImageFile(cfgProductFiles.retatrutide),
  },
  {
    peptideId: 'nad-plus',
    name: 'NAD+ 1000MG',
    price: '$169.00',
    image: productImageFile(cfgProductFiles.nad),
  },
  {
    peptideId: 'mots-c',
    name: 'MOTS-C 40MG',
    price: '$149.00',
    image: productImageFile(cfgProductFiles.motsC),
  },
  {
    peptideId: 'klow',
    name: 'KLOW 80MG',
    price: '$189.00',
    image: productImageFile(cfgProductFiles.klow),
  },
  {
    peptideId: 'ipamorelin',
    name: 'IPAMORELIN 10MG',
    price: '$89.00',
    image: productImageFile(cfgProductFiles.ipamorelin),
  },
  {
    peptideId: 'glow',
    name: 'GLOW 70MG',
    price: '$179.00',
    image: productImageFile(cfgProductFiles.glow),
  },
];

export function getDisplayPriceForPeptide(peptideId: string): string | null {
  const fp = featuredProducts.find((p) => p.peptideId === peptideId);
  if (!fp) return null;
  return fp.pricePrefix ? `${fp.pricePrefix} ${fp.price}` : fp.price;
}
