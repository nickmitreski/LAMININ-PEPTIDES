import type { Page } from '@playwright/test';

export const ENTRY_KEY = 'laminin-entry-verified';
export const CART_KEY = 'laminin-cart';

export type SeedCartItem = {
  peptideId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  purity: string;
  variantId?: string;
};

export async function bypassEntryGate(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '1');
  }, ENTRY_KEY);
}

export async function seedCart(page: Page, items: SeedCartItem[]) {
  await page.addInitScript(
    ({ cartKey, cartItems }) => {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    },
    { cartKey: CART_KEY, cartItems: items }
  );
}

export const sampleCartItem: SeedCartItem = {
  peptideId: 'bpc-157',
  name: 'BPC-157 10mg',
  quantity: 1,
  price: 89,
  image: '/images/products/bpc-157.webp',
  purity: '≥99%',
};
