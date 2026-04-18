const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactValidationResult {
  ok: boolean;
  message?: string;
  emailValid: boolean;
  phoneValid: boolean;
}

/** Mobile (≥10 digits) is required. Email is optional; if filled it must be valid. */
export function validateCheckoutContact(email: string, phone: string): ContactValidationResult {
  const emailTrim = email.trim();
  const phoneDigits = phone.replace(/\D/g, '');

  const emailValid = emailTrim.length > 0 && EMAIL_RE.test(emailTrim);
  const phoneValid = phoneDigits.length >= 10;

  if (!phoneValid) {
    return {
      ok: false,
      message:
        'Enter a mobile number with country/area code (at least 10 digits) so we can send your verification code by SMS.',
      emailValid,
      phoneValid: false,
    };
  }

  if (emailTrim.length > 0 && !emailValid) {
    return {
      ok: false,
      message: 'Please enter a valid email address or clear the email field.',
      emailValid: false,
      phoneValid: true,
    };
  }

  return { ok: true, emailValid, phoneValid };
}
