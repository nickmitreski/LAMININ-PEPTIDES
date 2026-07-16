import { describe, expect, it } from 'vitest';
import { funnelSteps } from '../components/analytics/CheckoutFunnelChart';

describe('analyticsService helpers', () => {
  it('builds funnel steps in order', () => {
    const steps = funnelSteps({
      cartViews: 100,
      checkoutStarts: 40,
      checkoutSubmits: 20,
      checkoutSuccess: 15,
      checkoutAbandoned: 10,
    });
    expect(steps).toHaveLength(5);
    expect(steps[0].label).toBe('Cart views');
    expect(steps[3].count).toBe(15);
  });
});
