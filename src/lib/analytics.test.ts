import { describe, expect, it } from 'vitest';
import { isAnalyticsExcludedPath } from './analytics';

describe('isAnalyticsExcludedPath', () => {
  it('excludes admin dashboard routes', () => {
    expect(isAnalyticsExcludedPath('/admin')).toBe(true);
    expect(isAnalyticsExcludedPath('/admin/dashboard')).toBe(true);
    expect(isAnalyticsExcludedPath('/admin/analytics')).toBe(true);
  });

  it('keeps storefront routes', () => {
    expect(isAnalyticsExcludedPath('/')).toBe(false);
    expect(isAnalyticsExcludedPath('/library')).toBe(false);
    expect(isAnalyticsExcludedPath('/checkout')).toBe(false);
  });
});
