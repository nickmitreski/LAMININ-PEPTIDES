import { productImageFile, cfgProductFiles } from './peptides';

export { getDisplayPriceForPeptide } from './productPricing';

export interface FeaturedProduct {
  peptideId: string;
  name: string;
  image: string;
}

export const featuredProducts: FeaturedProduct[] = [
  {
    peptideId: 'semax',
    name: 'SEMAX 10MG',
    image: productImageFile(cfgProductFiles.semax),
  },
  {
    peptideId: 'selank',
    name: 'SELANK 10MG',
    image: productImageFile(cfgProductFiles.selank),
  },
  {
    peptideId: 'retatrutide',
    name: 'RETATRUTIDE',
    image: productImageFile(cfgProductFiles.retatrutide),
  },
  {
    peptideId: 'nad-plus',
    name: 'NAD+ 1000MG',
    image: productImageFile(cfgProductFiles.nad),
  },
  {
    peptideId: 'mots-c',
    name: 'MOTS-C 40MG',
    image: productImageFile(cfgProductFiles.motsC),
  },
  {
    peptideId: 'klow',
    name: 'KLOW 80MG',
    image: productImageFile(cfgProductFiles.klow),
  },
  {
    peptideId: 'ipamorelin',
    name: 'IPAMORELIN 10MG',
    image: productImageFile(cfgProductFiles.ipamorelin),
  },
  {
    peptideId: 'glow',
    name: 'GLOW 70MG',
    image: productImageFile(cfgProductFiles.glow),
  },
];
