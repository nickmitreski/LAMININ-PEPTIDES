import { describe, it, expect } from 'vitest';
import { validateCheckoutContact } from './checkoutContactValidation';

describe('validateCheckoutContact', () => {
  it('requires at least one valid channel', () => {
    expect(validateCheckoutContact('', '').ok).toBe(false);
    expect(validateCheckoutContact('bad', '123').ok).toBe(false);
  });

  it('accepts valid email only', () => {
    const r = validateCheckoutContact('user@example.com', '');
    expect(r.ok).toBe(true);
    expect(r.emailValid).toBe(true);
    expect(r.phoneValid).toBe(false);
  });

  it('accepts valid phone only (10+ digits)', () => {
    const r = validateCheckoutContact('', '+61 412 345 678');
    expect(r.ok).toBe(true);
    expect(r.emailValid).toBe(false);
    expect(r.phoneValid).toBe(true);
  });

  it('rejects invalid email when field non-empty', () => {
    const r = validateCheckoutContact('not-an-email', '');
    expect(r.ok).toBe(false);
  });

  it('rejects short phone when field non-empty', () => {
    const r = validateCheckoutContact('a@b.com', '12345');
    expect(r.ok).toBe(false);
  });
});
