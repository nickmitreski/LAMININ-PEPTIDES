import { describe, expect, it } from 'vitest';

import { resolveEmailRouting } from './recipientRouting';

describe('resolveEmailRouting', () => {
  it('routes to the customer email when no test override is set', () => {
    const result = resolveEmailRouting('customer@example.com', undefined);

    expect(result.deliveryEmail).toBe('customer@example.com');
    expect(result.routedToTestInbox).toBe(false);
  });

  it('routes to the test inbox when override is set', () => {
    const result = resolveEmailRouting('customer@example.com', 'ad.business.26@outlook.com');

    expect(result.deliveryEmail).toBe('ad.business.26@outlook.com');
    expect(result.routedToTestInbox).toBe(true);
  });

  it('trims whitespace in test override values', () => {
    const result = resolveEmailRouting('customer@example.com', '  ad.business.26@outlook.com  ');

    expect(result.deliveryEmail).toBe('ad.business.26@outlook.com');
    expect(result.routedToTestInbox).toBe(true);
  });
});
