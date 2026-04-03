-- Secure checkout: one-time payment codes linked to order_references (store ↔ partner bridge).
-- Rows are inserted by the Edge Function `secure-checkout-init` using the service role (bypasses RLS).

CREATE TABLE IF NOT EXISTS public.checkout_secure_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_order_id text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  grand_total numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  customer_email text,
  customer_phone text,
  enriched_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  peptide_items jsonb,
  protein_items jsonb,
  totals jsonb,
  sent_via text[] NOT NULL DEFAULT '{}'::text[],
  external_payment_url text,
  partner_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkout_secure_sessions_peptide_order_fkey
    FOREIGN KEY (peptide_order_id)
    REFERENCES public.order_references (peptide_order_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_checkout_secure_sessions_peptide_order_id
  ON public.checkout_secure_sessions (peptide_order_id);

CREATE INDEX IF NOT EXISTS idx_checkout_secure_sessions_expires_at
  ON public.checkout_secure_sessions (expires_at);

COMMENT ON TABLE public.checkout_secure_sessions IS
  'Payment verification sessions: hashed OTP, line-item bridge (catalog + CFG + partner lines), optional partner payment URL.';

ALTER TABLE public.checkout_secure_sessions ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: only service_role (Edge Functions) should read/write.
-- Dashboard admins can use service role or add explicit policies later.
