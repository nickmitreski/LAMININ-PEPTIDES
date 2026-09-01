import { describe, expect, it } from 'vitest';
import {
  initialShippingFormData,
  validateCheckoutForm,
  type ShippingFormData,
} from './checkoutForm';

const validForm: ShippingFormData = {
  ...initialShippingFormData,
  firstName: 'Test',
  lastName: 'Customer',
  email: 'customer@example.com',
  phone: '0412 345 678',
  address: '1 Test Street',
  city: 'Melbourne',
  state: 'VIC',
  postcode: '3000',
};

describe('validateCheckoutForm phone validation', () => {
  it('accepts a formatted phone number with at least ten digits', () => {
    expect(validateCheckoutForm(validForm).phone).toBeUndefined();
    expect(
      validateCheckoutForm({ ...validForm, phone: '+61 (0) 412 345 678' }).phone
    ).toBeUndefined();
  });

  it('rejects a phone number the Edge Function would reject', () => {
    expect(validateCheckoutForm({ ...validForm, phone: '123 456 789' }).phone).toBe(
      'Enter a valid phone number'
    );
  });

  it('rejects invalid phone characters', () => {
    expect(validateCheckoutForm({ ...validForm, phone: '0412-ABC-678' }).phone).toBe(
      'Enter a valid phone number'
    );
  });
});
