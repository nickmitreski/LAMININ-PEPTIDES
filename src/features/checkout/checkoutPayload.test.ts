import { describe, expect, it } from 'vitest';
import type { CartItem } from '../../types/cart';
import { toCheckoutCartItems } from './checkoutPayload';

describe('toCheckoutCartItems', () => {
  it('sends the exact variant id for products that share a CFG code', () => {
    const items: CartItem[] = [
      {
        peptideId: 'retatrutide',
        variantId: '30mg',
        name: 'Retatrutide (30 mg)',
        quantity: 1,
        price: 339,
        image: '/retatrutide.png',
        purity: '>99%',
      },
    ];

    expect(toCheckoutCartItems(items)).toEqual([
      {
        id: 'CFG-044',
        variant_id: '30mg',
        name: 'Retatrutide (30 mg)',
        quantity: 1,
        price: 339,
        image: '/retatrutide.png',
      },
    ]);
  });

  it('keeps canonical CFG codes for reference-price variants', () => {
    const items: CartItem[] = [
      {
        peptideId: 'retatrutide',
        variantId: '10mg',
        name: 'Retatrutide (10 mg)',
        quantity: 1,
        price: 149,
        image: '/retatrutide.png',
        purity: '>99%',
      },
      {
        peptideId: 'ghk-cu',
        variantId: '100mg',
        name: 'GHK-Cu (100 mg)',
        quantity: 1,
        price: 109,
        image: '/ghk-cu.png',
        purity: '>99%',
      },
    ];

    expect(toCheckoutCartItems(items).map((item) => item.id)).toEqual([
      'CFG-023',
      'CFG-016',
    ]);
  });

  it('keeps non-variant products backward compatible', () => {
    const items: CartItem[] = [
      {
        peptideId: 'bacteriostatic-water',
        name: 'Bacteriostatic Water 3ml',
        quantity: 2,
        price: 5,
        image: '/water.png',
        purity: 'N/A',
      },
    ];

    expect(toCheckoutCartItems(items)[0]).toMatchObject({
      id: 'CFG-028',
      variant_id: undefined,
      quantity: 2,
      price: 5,
    });
  });
});
