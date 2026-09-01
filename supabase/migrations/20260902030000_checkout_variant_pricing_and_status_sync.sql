-- Checkout repair: exact variant pricing, safe mismatch notes, and normalized status sync.
--
-- The storefront has three products whose sizes share a single CFG code. The
-- prior checkout helper priced only by CFG code, so legitimate variants were
-- treated as tampering. Its mismatch note also used printf-style `%.2f`, which
-- PostgreSQL format() does not support, aborting the order entirely.

BEGIN;

-- ---------------------------------------------------------------------------
-- Protected, server-owned prices for multi-strength products.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_variant_prices (
  cfg_code    text NOT NULL REFERENCES public.product_mappings(cfg_code)
                         ON UPDATE CASCADE ON DELETE CASCADE,
  variant_id  text NOT NULL CHECK (length(trim(variant_id)) > 0),
  label       text NOT NULL,
  price       numeric(10,2) NOT NULL CHECK (price >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cfg_code, variant_id)
);

ALTER TABLE public.product_variant_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.product_variant_prices FROM anon, authenticated;

INSERT INTO public.product_variant_prices (cfg_code, variant_id, label, price, is_active)
VALUES
  ('CFG-023', '10mg',  '10 mg',  149.00, true),
  ('CFG-023', '20mg',  '20 mg',  249.00, true),
  ('CFG-023', '30mg',  '30 mg',  339.00, true),
  ('CFG-031', '5mg',   '5 mg',    69.00, true),
  ('CFG-031', '10mg',  '10 mg',   99.00, true),
  ('CFG-016', '50mg',  '50 mg',   69.00, true),
  ('CFG-016', '100mg', '100 mg', 109.00, true)
ON CONFLICT (cfg_code, variant_id) DO UPDATE SET
  label = EXCLUDED.label,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Recompute checkout totals using cfg_code + variant_id.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._recompute_order_totals(
  p_cart_items JSONB,
  p_discount_code TEXT,
  p_client_discount_amount NUMERIC
)
RETURNS TABLE (
  rebuilt_cart_items JSONB,
  subtotal NUMERIC,
  shipping NUMERIC,
  tax NUMERIC,
  discount_applied NUMERIC,
  total_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_subtotal NUMERIC := 0;
  v_shipping NUMERIC := 0;
  v_tax NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_rebuilt JSONB := '[]'::jsonb;
  v_item JSONB;
  v_id TEXT;
  v_canonical_cfg TEXT;
  v_variant_id TEXT;
  v_qty_text TEXT;
  v_qty INTEGER;
  v_canonical_price NUMERIC;
  v_line_total NUMERIC;
  v_normalized_name TEXT;
  v_dc_row RECORD;
BEGIN
  IF p_cart_items IS NULL
     OR jsonb_typeof(p_cart_items) <> 'array'
     OR jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_id := trim(COALESCE(v_item->>'id', ''));
    v_qty_text := trim(COALESCE(v_item->>'quantity', ''));

    IF v_id = '' THEN
      RAISE EXCEPTION 'A cart item is missing its product code' USING ERRCODE = '22023';
    END IF;
    IF v_qty_text !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_id USING ERRCODE = '22023';
    END IF;

    v_qty := v_qty_text::integer;
    IF v_qty < 1 OR v_qty > 1000 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_id USING ERRCODE = '22023';
    END IF;

    SELECT pm.cfg_code, pm.price
      INTO v_canonical_cfg, v_canonical_price
      FROM public.product_mappings pm
     WHERE lower(pm.cfg_code) = lower(v_id)
       AND COALESCE(pm.is_active, true) = true
     LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is unavailable', v_id USING ERRCODE = '22023';
    END IF;

    -- New clients send variant_id. For carts cached before this deployment,
    -- infer the option from names such as "Retatrutide (30 mg)".
    v_variant_id := lower(regexp_replace(trim(COALESCE(v_item->>'variant_id', '')), '\s+', '', 'g'));
    v_normalized_name := lower(regexp_replace(COALESCE(v_item->>'name', ''), '\s+', '', 'g'));

    IF v_variant_id = '' AND EXISTS (
      SELECT 1
        FROM public.product_variant_prices pvp
       WHERE pvp.cfg_code = v_canonical_cfg
         AND pvp.is_active = true
    ) THEN
      SELECT pvp.variant_id
        INTO v_variant_id
        FROM public.product_variant_prices pvp
       WHERE pvp.cfg_code = v_canonical_cfg
         AND pvp.is_active = true
         AND v_normalized_name LIKE '%(' || lower(pvp.variant_id) || ')%'
       ORDER BY length(pvp.variant_id) DESC
       LIMIT 1;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Select a valid product option for %', v_canonical_cfg
          USING ERRCODE = '22023';
      END IF;
    END IF;

    IF v_variant_id <> '' THEN
      SELECT pvp.price
        INTO v_canonical_price
        FROM public.product_variant_prices pvp
       WHERE pvp.cfg_code = v_canonical_cfg
         AND lower(pvp.variant_id) = v_variant_id
         AND pvp.is_active = true
       LIMIT 1;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product option % is unavailable for %', v_variant_id, v_canonical_cfg
          USING ERRCODE = '22023';
      END IF;
    END IF;

    v_line_total := round(v_canonical_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;

    v_rebuilt := v_rebuilt || jsonb_build_object(
      'id', v_canonical_cfg,
      'variant_id', NULLIF(v_variant_id, ''),
      'name', v_item->>'name',
      'price', v_canonical_price,
      'quantity', v_qty,
      'image', v_item->>'image',
      'client_price', v_item->>'price'
    );
  END LOOP;

  v_shipping := public.express_shipping_aud(v_subtotal);
  v_tax := public.checkout_gst_amount(v_subtotal);

  IF p_discount_code IS NOT NULL AND trim(p_discount_code) <> '' THEN
    SELECT * INTO v_dc_row
      FROM public.discount_codes
     WHERE upper(code) = upper(trim(p_discount_code))
       AND COALESCE(is_active, true) = true
       AND (valid_until IS NULL OR valid_until > now())
       AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
       AND (min_order_amount IS NULL OR v_subtotal >= min_order_amount)
     LIMIT 1;

    IF v_dc_row IS NOT NULL THEN
      IF v_dc_row.discount_type = 'percentage' THEN
        v_discount := round(v_subtotal * (v_dc_row.discount_value / 100.0), 2);
        IF v_dc_row.max_discount_amount IS NOT NULL
           AND v_discount > v_dc_row.max_discount_amount THEN
          v_discount := v_dc_row.max_discount_amount;
        END IF;
      ELSIF v_dc_row.discount_type = 'fixed' THEN
        v_discount := LEAST(v_subtotal, COALESCE(v_dc_row.discount_value, 0));
      END IF;

      IF COALESCE(p_client_discount_amount, 0) > 0 THEN
        v_discount := LEAST(v_discount, p_client_discount_amount);
      END IF;
    END IF;
  END IF;

  v_total := GREATEST(0, v_subtotal + v_shipping + v_tax - v_discount);
  RETURN QUERY SELECT v_rebuilt, v_subtotal, v_shipping, v_tax, v_discount, v_total;
END;
$$;

REVOKE ALL ON FUNCTION public._recompute_order_totals(JSONB, TEXT, NUMERIC) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Replace the public checkout RPC, preserving its existing 14-argument API.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_payment_tracking(
  p_order_reference TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_address JSONB DEFAULT NULL,
  p_cart_items JSONB DEFAULT '[]',
  p_subtotal NUMERIC DEFAULT 0,
  p_shipping NUMERIC DEFAULT 0,
  p_tax NUMERIC DEFAULT 0,
  p_total_amount NUMERIC DEFAULT 0,
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

  IF abs(v_recomputed.total_amount - v_client_total) > 0.01 THEN
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
    CASE WHEN v_tamper_detected THEN
      format(
        '[server] client total %s differed from server total %s at %s',
        to_char(v_client_total, 'FM999999990.00'),
        to_char(v_recomputed.total_amount, 'FM999999990.00'),
        to_char(now(), 'YYYY-MM-DD HH24:MI')
      )
    ELSE NULL END,
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
    idempotency_key = COALESCE(payment_tracking.idempotency_key, EXCLUDED.idempotency_key),
    updated_at = now()
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
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric,
  text, text, numeric, text
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Keep normalized order/payment state aligned with payment_tracking.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_normalized_order_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_attempt_status TEXT;
BEGIN
  UPDATE public.orders
     SET status = NEW.payment_status,
         updated_at = now()
   WHERE payment_tracking_id = NEW.id
      OR order_reference = NEW.order_reference;

  v_attempt_status := CASE
    WHEN NEW.payment_status = 'pending' THEN 'pending'
    WHEN NEW.payment_status = 'viewed_instructions' THEN 'viewed'
    WHEN NEW.payment_status IN ('payment_received', 'processing', 'shipped', 'delivered')
      THEN 'completed'
    WHEN NEW.payment_status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END;

  UPDATE public.payment_attempts pa
     SET status = v_attempt_status,
         updated_at = now()
    FROM public.orders o
   WHERE pa.order_id = o.id
     AND (o.payment_tracking_id = NEW.id OR o.order_reference = NEW.order_reference)
     AND pa.status IS DISTINCT FROM v_attempt_status;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_normalized_order_payment_status() FROM PUBLIC;

DROP TRIGGER IF EXISTS sync_normalized_order_payment_status_trigger
  ON public.payment_tracking;
CREATE TRIGGER sync_normalized_order_payment_status_trigger
  AFTER UPDATE OF payment_status ON public.payment_tracking
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION public.sync_normalized_order_payment_status();

-- Repair rows created before the trigger existed.
UPDATE public.orders o
   SET status = pt.payment_status,
       updated_at = now()
  FROM public.payment_tracking pt
 WHERE (o.payment_tracking_id = pt.id OR o.order_reference = pt.order_reference)
   AND o.status IS DISTINCT FROM pt.payment_status;

UPDATE public.payment_attempts pa
   SET status = CASE
         WHEN o.status = 'pending' THEN 'pending'
         WHEN o.status = 'viewed_instructions' THEN 'viewed'
         WHEN o.status IN ('payment_received', 'processing', 'shipped', 'delivered') THEN 'completed'
         WHEN o.status = 'cancelled' THEN 'cancelled'
         ELSE pa.status
       END,
       updated_at = now()
  FROM public.orders o
 WHERE pa.order_id = o.id
   AND pa.status IS DISTINCT FROM CASE
         WHEN o.status = 'pending' THEN 'pending'
         WHEN o.status = 'viewed_instructions' THEN 'viewed'
         WHEN o.status IN ('payment_received', 'processing', 'shipped', 'delivered') THEN 'completed'
         WHEN o.status = 'cancelled' THEN 'cancelled'
         ELSE pa.status
       END;

COMMIT;
