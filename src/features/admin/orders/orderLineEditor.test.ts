import { describe, expect, it } from 'vitest';
import { validateAdminOrderLines } from './orderLineEditor';

describe('validateAdminOrderLines', () => {
  it('normalizes catalog and custom lines and calculates subtotal', () => {
    const result = validateAdminOrderLines([
      {
        id: ' CFG-031 ',
        name: ' BPC-157 10mg ',
        quantity: 2,
        unitPrice: 99,
        note: '',
        image: '/images/products/bpc.webp',
      },
      {
        id: 'CUSTOM-HANDLING',
        name: 'Custom laboratory handling',
        quantity: 1,
        unitPrice: 12.5,
        note: 'Owner approved',
        lineType: 'custom',
      },
    ]);

    expect(result).toEqual({
      ok: true,
      lines: [
        {
          id: 'CFG-031',
          name: 'BPC-157 10mg',
          quantity: 2,
          price: 99,
          line_total: 198,
          line_type: 'catalog',
          note: null,
          image: '/images/products/bpc.webp',
        },
        {
          id: 'CUSTOM-HANDLING',
          name: 'Custom laboratory handling',
          quantity: 1,
          price: 12.5,
          line_total: 12.5,
          line_type: 'custom',
          note: 'Owner approved',
        },
      ],
      subtotal: 210.5,
    });
  });

  it('rejects empty, invalid, and excessive line values', () => {
    expect(validateAdminOrderLines([])).toEqual({
      ok: false,
      errors: ['Add at least one order line.'],
    });

    const result = validateAdminOrderLines([
      {
        id: '',
        name: ' ',
        quantity: 0,
        unitPrice: -1,
        note: '',
      },
    ]);

    expect(result).toEqual({
      ok: false,
      errors: [
        'Line 1: name is required.',
        'Line 1: quantity must be a whole number between 1 and 999.',
        'Line 1: unit price must be between $0 and $1,000,000.',
      ],
    });
  });

  it('rounds currency calculations to cents', () => {
    const result = validateAdminOrderLines([
      {
        id: '',
        name: 'Custom line',
        quantity: 3,
        unitPrice: 10.005,
        note: '',
      },
    ]);

    expect(result).toMatchObject({
      ok: true,
      subtotal: 30.03,
      lines: [{ price: 10.01, line_total: 30.03 }],
    });
  });
});
