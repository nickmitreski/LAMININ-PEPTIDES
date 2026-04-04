import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  expressShippingAud,
  FREE_SHIPPING_THRESHOLD_AUD,
  FLAT_EXPRESS_SHIPPING_AUD,
  checkoutGstRate,
  checkoutGstAmount,
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

describe('checkoutGstRate / checkoutGstAmount', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to 10%', () => {
    expect(checkoutGstRate()).toBe(0.1);
    expect(checkoutGstAmount(100)).toBe(10);
  });

  it('respects VITE_CHECKOUT_GST_RATE when valid', () => {
    vi.stubEnv('VITE_CHECKOUT_GST_RATE', '0');
    expect(checkoutGstRate()).toBe(0);
    expect(checkoutGstAmount(100)).toBe(0);

    vi.stubEnv('VITE_CHECKOUT_GST_RATE', '0.15');
    expect(checkoutGstRate()).toBe(0.15);
    expect(checkoutGstAmount(100)).toBe(15);
  });

  it('ignores invalid env and falls back to 10%', () => {
    vi.stubEnv('VITE_CHECKOUT_GST_RATE', 'not-a-number');
    expect(checkoutGstRate()).toBe(0.1);
    vi.stubEnv('VITE_CHECKOUT_GST_RATE', '2');
    expect(checkoutGstRate()).toBe(0.1);
    vi.stubEnv('VITE_CHECKOUT_GST_RATE', '-0.1');
    expect(checkoutGstRate()).toBe(0.1);
  });
});
