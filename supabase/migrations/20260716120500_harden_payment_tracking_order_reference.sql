-- Harden payment_tracking against blank order references.
--
-- Live audit on 2026-07-16 found that upsert_payment_tracking accepted an
-- empty p_order_reference. Add a NOT VALID check so existing bad legacy/test
-- rows do not block deployment, while all future INSERT/UPDATE writes must use
-- a non-empty reference.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_tracking_order_reference_not_blank'
      AND conrelid = 'public.payment_tracking'::regclass
  ) THEN
    ALTER TABLE public.payment_tracking
      ADD CONSTRAINT payment_tracking_order_reference_not_blank
      CHECK (length(btrim(order_reference)) > 0)
      NOT VALID;
  END IF;
END $$;

COMMIT;
