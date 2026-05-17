import { describe, it, expect } from 'vitest';
import {
  expressShippingAud,
  FREE_SHIPPING_THRESHOLD_AUD,
  FLAT_EXPRESS_SHIPPING_AUD,
} from './shippingPolicy';

describe('expressShippingAud', () => {
  it('charges flat rate below threshold', () => {
    expect(expressShippingAud(0)).toBe(FLAT_EXPRESS_SHIPPING_AUD);
    expect(expressShippingAud(FREE_SHIPPING_THRESHOLD_AUD - 0.01)).toBe(FLAT_EXPRESS_SHIPPING_AUD);
  });

  it('is free at or above threshold', () => {
    expect(expressShippingAud(FREE_SHIPPING_THRESHOLD_AUD)).toBe(0);
    expect(expressShippingAud(500)).toBe(0);
  });
});
