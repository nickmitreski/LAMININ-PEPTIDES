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
        id: 'CFG-023',
        variant_id: '30mg',
        name: 'Retatrutide (30 mg)',
        quantity: 1,
        price: 339,
        image: '/retatrutide.png',
      },
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
