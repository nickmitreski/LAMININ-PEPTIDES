const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactValidationResult {
  ok: boolean;
  message?: string;
  emailValid: boolean;
  phoneValid: boolean;
}

/** At least one channel required: valid email and/or phone (≥10 digits for area code + number). */
export function validateCheckoutContact(email: string, phone: string): ContactValidationResult {
  const emailTrim = email.trim();
  const phoneDigits = phone.replace(/\D/g, '');

  const emailValid = emailTrim.length > 0 && EMAIL_RE.test(emailTrim);
  const phoneValid = phoneDigits.length >= 10;

  if (!emailValid && !phoneValid) {
    return {
      ok: false,
      message:
        'Enter a valid email and/or a mobile number (with area code) so we can send your secure payment code.',
      emailValid: false,
      phoneValid: false,
    };
  }

  if (emailTrim.length > 0 && !emailValid) {
    return {
      ok: false,
      message: 'Please enter a valid email address, or clear the field and use phone only.',
      emailValid: false,
      phoneValid,
    };
  }

  if (phone.trim().length > 0 && !phoneValid) {
    return {
      ok: false,
      message:
        'Please enter a full phone number with area code (at least 10 digits), or clear the field and use email only.',
      emailValid,
      phoneValid: false,
    };
  }

  return { ok: true, emailValid, phoneValid };
}
