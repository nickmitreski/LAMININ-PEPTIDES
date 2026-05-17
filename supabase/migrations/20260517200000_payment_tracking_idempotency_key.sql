-- =====================================================================
-- Idempotency key on payment_tracking — 2026-05-17
-- =====================================================================
-- Closes the last "double submit" race window. Today the only protection
-- against duplicates is `order_reference UNIQUE`, which catches retries
-- that reuse the same reference. A customer who clicks Submit twice in
-- quick succession would generate two DIFFERENT references and create
-- two orders — both legitimate-looking from the DB's perspective.
--
-- Solution: the frontend generates a UUID per submit attempt (stored in
-- a `useRef` so retries within the same submit reuse it) and passes it
-- as `p_idempotency_key`. If a row already exists with that key, the
-- RPC returns its tracking_id without writing anything new.
--
-- This is purely additive — pre-deploy clients that don't pass the param
-- continue to work exactly as before because the param has a default of
-- NULL and we only apply the idempotency check when it's present.
--
-- Safety
--   - CREATE INDEX IF NOT EXISTS (idempotent).
--   - DROP FUNCTION on the prior signature so we can grow the parameter
--     list. CREATE OR REPLACE alone doesn't allow adding params.
--   - The function body is otherwise identical to the pass-5
--     server-authoritative-totals version.

BEGIN;

ALTER TABLE public.payment_tracking
  ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Partial unique index: NULL keys are unconstrained (legacy rows + clients
-- that haven't been updated). Two non-NULL keys can never collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tracking_idempotency_key
  ON public.payment_tracking(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Replace the upsert function with a 14-param signature.
DROP FUNCTION IF EXISTS public.upsert_payment_tracking(
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, text, text, numeric
);

CREATE OR REPLACE FUNCTION public.upsert_payment_tracking(
  p_order_reference TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_address JSONB DEFAULT NULL,
  p_cart_items JSONB DEFAULT '[]',
  p_subtotal NUMERIC DEFAULT 0,         -- ignored: recomputed server-side
  p_shipping NUMERIC DEFAULT 0,         -- ignored: recomputed server-side
  p_tax NUMERIC DEFAULT 0,              -- ignored: recomputed server-side
  p_total_amount NUMERIC DEFAULT 0,     -- compared to server total for tamper flag
  p_currency TEXT DEFAULT 'AUD',
  p_discount_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id UUID;
  v_existing_id UUID;
  v_recomputed RECORD;
  v_client_total NUMERIC := COALESCE(p_total_amount, 0);
  v_tamper_detected BOOLEAN := false;
BEGIN
  -- Fast path: if the client supplied an idempotency key and we've already
  -- seen it, return the existing row's id without touching anything else.
  -- This makes double-submits a no-op rather than a duplicate-order error.
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT id INTO v_existing_id
      FROM public.payment_tracking
     WHERE idempotency_key = p_idempotency_key
     LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'tracking_id', v_existing_id,
        'replay', true
      );
    END IF;
  END IF;

  SELECT * INTO v_recomputed FROM public._recompute_order_totals(
    p_cart_items, p_discount_code, p_discount_amount
  );

  IF ABS(v_recomputed.total_amount - v_client_total) > 0.01 THEN
    v_tamper_detected := true;
  END IF;

  INSERT INTO public.payment_tracking (
    order_reference, customer_email, customer_name, customer_phone,
    customer_address, cart_items, subtotal, shipping, tax,
    total_amount, currency, payment_status, discount_code, discount_amount,
    admin_notes, idempotency_key
  ) VALUES (
    p_order_reference, p_customer_email, p_customer_name, p_customer_phone,
    p_customer_address, v_recomputed.rebuilt_cart_items,
    v_recomputed.subtotal, v_recomputed.shipping, v_recomputed.tax,
    v_recomputed.total_amount, p_currency, 'pending',
    p_discount_code, v_recomputed.discount_applied,
    CASE WHEN v_tamper_detected
      THEN format('[server] client total %.2f differed from server total %.2f at %s',
                  v_client_total, v_recomputed.total_amount,
                  to_char(NOW(), 'YYYY-MM-DD HH24:MI'))
      ELSE NULL
    END,
    NULLIF(trim(COALESCE(p_idempotency_key, '')), '')
  )
  ON CONFLICT (order_reference) DO UPDATE SET
    customer_email = EXCLUDED.customer_email,
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    customer_address = EXCLUDED.customer_address,
    cart_items = EXCLUDED.cart_items,
    subtotal = EXCLUDED.subtotal,
    shipping = EXCLUDED.shipping,
    tax = EXCLUDED.tax,
    total_amount = EXCLUDED.total_amount,
    currency = EXCLUDED.currency,
    discount_code = EXCLUDED.discount_code,
    discount_amount = EXCLUDED.discount_amount,
    admin_notes = CASE
      WHEN payment_tracking.admin_notes IS NULL THEN EXCLUDED.admin_notes
      WHEN EXCLUDED.admin_notes IS NULL THEN payment_tracking.admin_notes
      ELSE payment_tracking.admin_notes || E'\n' || EXCLUDED.admin_notes
    END,
    -- Don't overwrite an existing key with NULL or a different value — the
    -- first non-NULL key wins.
    idempotency_key = COALESCE(payment_tracking.idempotency_key, EXCLUDED.idempotency_key),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'tracking_id', v_id,
    'replay', false,
    'server_subtotal', v_recomputed.subtotal,
    'server_shipping', v_recomputed.shipping,
    'server_tax', v_recomputed.tax,
    'server_discount', v_recomputed.discount_applied,
    'server_total', v_recomputed.total_amount,
    'client_total_was', v_client_total,
    'tamper_detected', v_tamper_detected
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_payment_tracking(
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, text, text, numeric, text
) TO anon, authenticated;

COMMIT;
