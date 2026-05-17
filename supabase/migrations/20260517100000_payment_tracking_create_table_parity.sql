-- Parity migration: define payment_tracking in the repo so a fresh Supabase
-- project can be brought up from migrations alone.
--
-- Why this is needed
--   The live Supabase project has the payment_tracking table, but the only
--   migrations in this repo are ALTER statements + RLS + RPC definitions. A
--   fresh project running `supabase db push` from these migrations fails at
--   the first ALTER because the table doesn't exist.
--
-- Why this is safe to apply against the LIVE project
--   - CREATE TABLE IF NOT EXISTS: no-op when the table already exists.
--   - All columns use IF NOT EXISTS / safe defaults.
--   - No constraint is added that could conflict with existing data because
--     this file only declares what the live table already has.
--
-- IMPORTANT
--   Compare this definition against the live schema BEFORE running on prod.
--   The shape below is INFERRED from code references (see
--   docs/SUPABASE_SCHEMA_AUDIT.md). If your live table has additional columns
--   not represented here, add them in a follow-up migration — never replace
--   this file with a `DROP TABLE` rebuild.

BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_tracking (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference       text NOT NULL UNIQUE,
  payment_status        text NOT NULL DEFAULT 'pending'
                          CHECK (payment_status IN (
                            'pending',
                            'viewed_instructions',
                            'payment_received',
                            'processing',
                            'shipped',
                            'delivered',
                            'cancelled'
                          )),
  customer_email        text NOT NULL,
  customer_name         text NOT NULL,
  customer_phone        text,
  customer_address      jsonb,                -- { address, city, state, postcode, country }
  cart_items            jsonb NOT NULL DEFAULT '[]'::jsonb,
                                              -- [{ id, name, price, quantity, image? }]
  subtotal              numeric(10,2) NOT NULL DEFAULT 0,
  shipping              numeric(10,2) NOT NULL DEFAULT 0,
  tax                   numeric(10,2) NOT NULL DEFAULT 0,
  total_amount          numeric(10,2) NOT NULL DEFAULT 0,
  currency              text NOT NULL DEFAULT 'AUD',
  admin_notes           text,
  payment_viewed_at     timestamptz,
  payment_completed_at  timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Useful indexes (CREATE INDEX IF NOT EXISTS is idempotent)
CREATE INDEX IF NOT EXISTS idx_payment_tracking_created_at
  ON public.payment_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_payment_status
  ON public.payment_tracking(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_customer_email
  ON public.payment_tracking(LOWER(customer_email));

-- Keep updated_at fresh on every write.
CREATE OR REPLACE FUNCTION public.touch_payment_tracking_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_tracking_touch_updated_at ON public.payment_tracking;
CREATE TRIGGER payment_tracking_touch_updated_at
  BEFORE UPDATE ON public.payment_tracking
  FOR EACH ROW EXECUTE FUNCTION public.touch_payment_tracking_updated_at();

-- discount_code / discount_amount were added in 20260410000000; replicate here
-- so a fresh DB has them at the right time (migration 20260410 still runs as a
-- no-op because of IF NOT EXISTS).
ALTER TABLE public.payment_tracking
  ADD COLUMN IF NOT EXISTS discount_code   text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0;

COMMIT;
