-- Audit fields: who we would notify, mock vs real delivery, name on checkout.

ALTER TABLE public.checkout_secure_sessions
  ADD COLUMN IF NOT EXISTS customer_first_name text,
  ADD COLUMN IF NOT EXISTS customer_last_name text,
  ADD COLUMN IF NOT EXISTS delivery_mock boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.checkout_secure_sessions.customer_email IS
  'Email captured at checkout (used for Resend when enabled).';
COMMENT ON COLUMN public.checkout_secure_sessions.customer_phone IS
  'Phone captured at checkout (used for Twilio when enabled).';
COMMENT ON COLUMN public.checkout_secure_sessions.sent_via IS
  'Channels customer requested: email, sms, or both.';
COMMENT ON COLUMN public.checkout_secure_sessions.delivery_mock IS
  'true until a real send succeeds for a requested channel (Resend/Twilio off = mock).';
