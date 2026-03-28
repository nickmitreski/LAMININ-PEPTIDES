export interface FeaturedProduct {
  name: string;
  price: string;
  pricePrefix?: string;
  image: string;
}

export const featuredProducts: FeaturedProduct[] = [
  {
    name: 'SEMAX 10MG',
    price: '$79.00',
    image: '/images/products/semax-10mg.png',
  },
  {
    name: 'SELANK 10MG',
    price: '$79.00',
    image: '/images/products/selank-10mg.png',
  },
  {
    name: 'RETATRUTIDE',
    pricePrefix: 'FROM',
    price: '$149.00',
    image: '/images/products/retatrutide-10mg.png',
  },
  {
    name: 'NAD+ 1000MG',
    price: '$169.00',
    image: '/images/products/nad-1000mg.png',
  },
  {
    name: 'MOTS-C 40MG',
    price: '$149.00',
    image: '/images/products/mots-c-40mg.png',
  },
  {
    name: 'KLOW 80MG',
    price: '$189.00',
    image: '/images/products/klow-80mg.png',
  },
  {
    name: 'IPAMORELIN 10MG',
    price: '$89.00',
    image: '/images/products/ipamorelin-10mg.png',
  },
  {
    name: 'GLOW 70MG',
    price: '$179.00',
    image: '/images/products/glow-70mg.png',
  },
];
