-- Idempotency for partner-payment-ready: avoid duplicate SMS for the same session.
ALTER TABLE public.checkout_secure_sessions
ADD COLUMN IF NOT EXISTS partner_pay_link_sms_sent_at timestamptz;

COMMENT ON COLUMN public.checkout_secure_sessions.partner_pay_link_sms_sent_at IS
  'When the partner-payment-ready Edge Function sent SMS with the pay link (COREFORGE async flow).';
