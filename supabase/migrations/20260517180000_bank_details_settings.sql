-- =====================================================================
-- Bank details settings — 2026-05-17
-- =====================================================================
-- Lifts the BSB / account-number / account-name out of the
-- send-order-email edge function (where they live as hardcoded constants)
-- into a small DB-backed singleton so the operator can update them from
-- /admin/settings without a redeploy.
--
-- Why a singleton table rather than a key/value config table:
--   - The three fields are read together every time an order is created.
--   - A single row is easier to grant safely (no per-key RLS) and easier
--     to display in the admin UI as one form.
--   - Future-proofs for a "name on invoice" or "bank name" field without
--     schema gymnastics.
--
-- Safety
--   - CREATE TABLE IF NOT EXISTS — no-op if applied twice.
--   - Default row seeded so the email function never sees an empty result.
--   - RLS allows anon SELECT (the function needs to read it without
--     elevated credentials when re-issued via the same RPC path). Anon
--     UPDATE is denied; only admins can change values via RLS.
--   - A history audit row is captured on every update via trigger so we
--     can answer "when did the BSB change?" without admin_audit_log work.
--
-- Rollback
--   DROP TRIGGER IF EXISTS bank_details_touch ON public.bank_details;
--   DROP TRIGGER IF EXISTS bank_details_history ON public.bank_details;
--   DROP FUNCTION IF EXISTS public.touch_bank_details();
--   DROP FUNCTION IF EXISTS public.log_bank_details_change();
--   DROP TABLE IF EXISTS public.bank_details_history;
--   DROP TABLE IF EXISTS public.bank_details;

BEGIN;

CREATE TABLE IF NOT EXISTS public.bank_details (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Conceptual singleton: a partial unique index on (singleton) constrains
  -- the table to one row without needing application-level checks.
  singleton       boolean NOT NULL DEFAULT true,
  bsb             text NOT NULL,
  account_number  text NOT NULL,
  account_name    text NOT NULL,
  bank_name       text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      text  -- auth.uid()::text via default below
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_details_singleton_idx
  ON public.bank_details ((true)) WHERE singleton;

-- Seed the initial row with the values the email function has been using.
-- Subsequent runs no-op because of the unique singleton index.
INSERT INTO public.bank_details (bsb, account_number, account_name, bank_name)
SELECT '013402', '807892935', 'MJCA Group', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.bank_details WHERE singleton);

-- Append-only history. Captures every change for forensic / "when did
-- the account change?" queries.
CREATE TABLE IF NOT EXISTS public.bank_details_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_details_id uuid REFERENCES public.bank_details(id) ON DELETE SET NULL,
  before          jsonb,
  after           jsonb,
  actor           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Touch updated_at + updated_by on every mutation.
CREATE OR REPLACE FUNCTION public.touch_bank_details()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  BEGIN
    NEW.updated_by := COALESCE(auth.uid()::text, NEW.updated_by);
  EXCEPTION WHEN OTHERS THEN
    -- auth.uid() can throw when called outside an HTTP context; tolerate.
    NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bank_details_touch ON public.bank_details;
CREATE TRIGGER bank_details_touch
  BEFORE UPDATE ON public.bank_details
  FOR EACH ROW EXECUTE FUNCTION public.touch_bank_details();

-- Log each change.
CREATE OR REPLACE FUNCTION public.log_bank_details_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor text;
BEGIN
  BEGIN
    v_actor := COALESCE(auth.uid()::text, 'system');
  EXCEPTION WHEN OTHERS THEN
    v_actor := 'system';
  END;

  INSERT INTO public.bank_details_history (bank_details_id, before, after, actor)
  VALUES (
    NEW.id,
    jsonb_build_object(
      'bsb', OLD.bsb,
      'account_number', OLD.account_number,
      'account_name', OLD.account_name,
      'bank_name', OLD.bank_name
    ),
    jsonb_build_object(
      'bsb', NEW.bsb,
      'account_number', NEW.account_number,
      'account_name', NEW.account_name,
      'bank_name', NEW.bank_name
    ),
    v_actor
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bank_details_history ON public.bank_details;
CREATE TRIGGER bank_details_history
  AFTER UPDATE ON public.bank_details
  FOR EACH ROW
  WHEN (
    OLD.bsb            IS DISTINCT FROM NEW.bsb
    OR OLD.account_number IS DISTINCT FROM NEW.account_number
    OR OLD.account_name   IS DISTINCT FROM NEW.account_name
    OR OLD.bank_name      IS DISTINCT FROM NEW.bank_name
  )
  EXECUTE FUNCTION public.log_bank_details_change();

-- RLS: public reads (needed by the order email + customer-facing copy),
-- admin-only writes.
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_details_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bank_details" ON public.bank_details;
CREATE POLICY "Public read bank_details"
  ON public.bank_details FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin write bank_details" ON public.bank_details;
CREATE POLICY "Admin write bank_details"
  ON public.bank_details FOR UPDATE
  USING (public.jwt_is_admin()) WITH CHECK (public.jwt_is_admin());

-- No INSERT/DELETE policy = denied by default. The seeded row is the only
-- one that ever exists; admins update it in place.

DROP POLICY IF EXISTS "Admin select bank_details_history" ON public.bank_details_history;
CREATE POLICY "Admin select bank_details_history"
  ON public.bank_details_history FOR SELECT
  USING (public.jwt_is_admin());

-- History is append-only via trigger; no INSERT/UPDATE/DELETE policies.

COMMIT;
