-- Additive migration: order_status_history + admin_audit_log
--
-- Purpose
--   1. order_status_history: every change to payment_tracking.payment_status writes
--      a row so we can answer "when did this order go pending → paid?" and "who
--      marked it shipped?". Today the status is overwritten in place with no trail.
--   2. admin_audit_log: a generic row-level log for sensitive admin actions
--      (status changes, manual overrides, customer edits). Useful for incident
--      response and undoing accidental edits.
--
-- Safety
--   - Both tables are CREATE TABLE IF NOT EXISTS — safe to re-run.
--   - RLS enabled, admin-only access (mirrors payment_tracking policies).
--   - The trigger on payment_tracking only INSERTS into the new history table;
--     it never mutates existing rows or blocks updates.
--   - No existing column / function / policy is altered.
--
-- Rollback
--   DROP TRIGGER IF EXISTS payment_tracking_status_history ON public.payment_tracking;
--   DROP FUNCTION IF EXISTS public.log_payment_status_change();
--   DROP TABLE IF EXISTS public.order_status_history;
--   DROP TABLE IF EXISTS public.admin_audit_log;

BEGIN;

-- =============================================================================
-- 1. order_status_history
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.payment_tracking(id) ON DELETE CASCADE,
  from_status  text,                    -- nullable: first row of an order has no previous status
  to_status    text NOT NULL,
  actor        text,                    -- auth.uid()::text, or 'system' for trigger-driven rows
  note         text,                    -- free-form, written by admin actions
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
  ON public.order_status_history(order_id, created_at DESC);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin select order_status_history" ON public.order_status_history;
CREATE POLICY "Admin select order_status_history"
  ON public.order_status_history FOR SELECT
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin insert order_status_history" ON public.order_status_history;
CREATE POLICY "Admin insert order_status_history"
  ON public.order_status_history FOR INSERT
  WITH CHECK (public.jwt_is_admin());

-- No update/delete policies: the history is append-only by design.
-- (RLS denies by default when there is no matching policy.)

-- Function + trigger: log every status change automatically. SECURITY DEFINER
-- so the trigger can write the history row even when the originating UPDATE
-- comes from an anonymous customer (e.g. payment-tracking RPC), bypassing the
-- INSERT policy above. The function's body itself only reads NEW / OLD and
-- writes one row — no privileged escalation surface.
CREATE OR REPLACE FUNCTION public.log_payment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor text;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    BEGIN
      v_actor := COALESCE(auth.uid()::text, 'system');
    EXCEPTION WHEN OTHERS THEN
      v_actor := 'system';
    END;

    INSERT INTO public.order_status_history (order_id, from_status, to_status, actor)
    VALUES (NEW.id, OLD.payment_status, NEW.payment_status, v_actor);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_payment_status_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS payment_tracking_status_history ON public.payment_tracking;
CREATE TRIGGER payment_tracking_status_history
  AFTER UPDATE OF payment_status ON public.payment_tracking
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_status_change();

-- Backfill the FIRST row for any existing orders so timelines aren't blank.
-- Uses ON CONFLICT-equivalent gate to be re-runnable.
INSERT INTO public.order_status_history (order_id, from_status, to_status, actor, note, created_at)
SELECT pt.id, NULL, pt.payment_status, 'system', 'backfilled-from-payment_tracking', pt.created_at
FROM public.payment_tracking pt
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_status_history h WHERE h.order_id = pt.id
);

-- =============================================================================
-- 2. admin_audit_log
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Default to the calling JWT subject so client-side INSERTs from the admin
  -- UI stamp the actor automatically without needing to pass it explicitly.
  actor         text DEFAULT (auth.uid())::text,
  action        text NOT NULL,          -- e.g. 'order.mark_paid', 'customer.edit', 'product.delete'
  target_table  text NOT NULL,
  target_id     text,                   -- string so it accommodates uuids OR LM-XXX refs
  before        jsonb,                  -- nullable pre-change snapshot
  after         jsonb,                  -- nullable post-change snapshot
  ip            text,                   -- optional, supplied by client
  user_agent    text,                   -- optional, supplied by client
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON public.admin_audit_log(target_table, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_created_at
  ON public.admin_audit_log(actor, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin select admin_audit_log" ON public.admin_audit_log;
CREATE POLICY "Admin select admin_audit_log"
  ON public.admin_audit_log FOR SELECT
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin insert admin_audit_log" ON public.admin_audit_log;
CREATE POLICY "Admin insert admin_audit_log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.jwt_is_admin());

-- Append-only: no UPDATE / DELETE policy.

COMMIT;
