import { describe, expect, it } from 'vitest';
import { buildReconItems, defaultReconstitution, parseStrengthMg } from './orderReconstitution';

describe('orderReconstitution', () => {
  it('parses mg from product name', () => {
    expect(parseStrengthMg('BPC-157 10mg')).toBe(10);
    expect(parseStrengthMg('No strength')).toBe(10);
  });

  it('skips ancillaries', () => {
    expect(defaultReconstitution('BAC Water 10ml', 0)).toBeNull();
  });

  it('builds recon rows for peptides', () => {
    const items = buildReconItems([
      { peptide_display_name: 'BPC-157 10mg', quantity: 2 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
    expect(items[0].bacWaterMl).toBeGreaterThan(0);
  });
});
