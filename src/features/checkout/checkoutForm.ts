export interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export type FieldErrors = Partial<Record<keyof ShippingFormData, string>>;

export const initialShippingFormData: ShippingFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postcode: '',
  country: 'Australia',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AU_POSTCODE_RE = /^\d{4}$/;
const NZ_POSTCODE_RE = /^\d{4}$/;
const PHONE_RE = /^[\d\s+()-]{6,}$/;

export function validateCheckoutForm(data: ShippingFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'Required';
  if (!data.lastName.trim()) errors.lastName = 'Required';
  if (!data.email.trim()) {
    errors.email = 'Required';
  } else if (!EMAIL_RE.test(data.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.phone.trim()) {
    errors.phone = 'Required';
  } else if (!PHONE_RE.test(data.phone.trim())) {
    errors.phone = 'Enter a valid phone number';
  }
  if (!data.address.trim()) errors.address = 'Required';
  if (!data.city.trim()) errors.city = 'Required';
  if (!data.state.trim()) errors.state = 'Required';
  if (!data.postcode.trim()) {
    errors.postcode = 'Required';
  } else if (data.country === 'Australia' && !AU_POSTCODE_RE.test(data.postcode.trim())) {
    errors.postcode = 'Australian postcodes are 4 digits';
  } else if (data.country === 'New Zealand' && !NZ_POSTCODE_RE.test(data.postcode.trim())) {
    errors.postcode = 'NZ postcodes are 4 digits';
  }
  return errors;
}

export function generateOrderReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomBytes[i] % chars.length);
  }
  return `LM-${code}`;
}
