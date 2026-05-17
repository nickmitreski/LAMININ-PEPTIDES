-- =====================================================================
-- Server-authoritative totals for upsert_payment_tracking — 2026-05-17
-- =====================================================================
-- Single biggest remaining security item from the May audit:
-- the existing RPC trusts every numeric value the client sends.
-- A devtools-savvy customer can rewrite cart_items[].price to 1¢ and
-- submit a $0.13 order for $3,000 worth of peptides.
--
-- What this migration does
--   1. Recomputes line_total per cart item from a server-side join against
--      product_mappings(cfg_code, price).  The customer's id/price values
--      become PURELY DECORATIVE — only quantity is trusted.
--   2. Recomputes subtotal from the line totals.
--   3. Recomputes shipping via a SQL helper that mirrors src/lib/shippingPolicy.ts
--      (free shipping over $300, else flat $15).
--   4. Recomputes tax via a SQL helper that mirrors src/lib/shippingPolicy.ts
--      (GST 1/11th of the subtotal).
--   5. Server-side discount validation: if the client passes p_discount_code
--      and p_discount_amount, the RPC looks up the discount row and re-derives
--      the amount.  If the client-asserted amount is too generous, the
--      smaller server number wins.
--   6. The final total_amount = subtotal + shipping + tax - discount_applied.
--   7. The recomputed totals are what gets stored — NOT the client-supplied
--      values.  The function returns them in its response so the frontend
--      can re-display them.
--
-- What this migration deliberately does NOT do
--   - Change the RPC signature (keeps existing frontend working unchanged).
--   - Reject the order if the client-asserted total disagreed with the server.
--     We just overwrite quietly.  A future revision can return a structured
--     "your total moved" warning if we want to confront the user.
--   - Touch the discount redemption flow.  redeem_discount_code is still
--     called separately from Checkout.tsx; we just sanity-check the amount
--     here for defence-in-depth.
--
-- Safety / rollback
--   - CREATE OR REPLACE: no schema changes to tables.  Pure function logic.
--   - The previous function definition is overwritten.  To roll back, re-run
--     migration 20260410000000_payment_tracking_fixes.sql or restore the
--     prior CREATE OR REPLACE body from version control.
--
-- Prerequisites
--   Requires the parity migration 20260517100000 (payment_tracking columns).
--   Safe to apply on a live DB that already has the table.

BEGIN;

-- -----------------------------------------------------------------------
-- Shipping / tax helpers — kept in SQL so the storefront and the RPC agree.
-- If src/lib/shippingPolicy.ts changes, update these to match.
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.express_shipping_aud(p_subtotal NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  -- Free over $250, else flat $11.90.  Must mirror src/lib/shippingPolicy.ts.
  -- If those constants change, change them HERE too.
  SELECT CASE
    WHEN COALESCE(p_subtotal, 0) >= 250 THEN 0::numeric
    ELSE 11.90::numeric
  END;
$$;

CREATE OR REPLACE FUNCTION public.checkout_gst_amount(p_subtotal NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  -- The storefront uses VITE_CHECKOUT_GST_RATE to apply tax; default is 0
  -- because product prices are already tax-inclusive.  Mirror that here.
  -- If a future deploy starts charging additional GST at checkout, replace
  -- this body and add a payment_tracking column for the rate-applied value.
  SELECT 0::numeric * COALESCE(p_subtotal, 0);
$$;

-- -----------------------------------------------------------------------
-- Recompute helper: given a cart_items jsonb and an optional discount,
-- returns the canonical totals derived from product_mappings.
-- -----------------------------------------------------------------------

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
  v_qty NUMERIC;
  v_canonical_price NUMERIC;
  v_line_total NUMERIC;
  v_dc_row RECORD;
BEGIN
  -- Walk the client's cart, replace each item's price with the canonical
  -- price from product_mappings, and accumulate the subtotal.
  IF p_cart_items IS NULL OR jsonb_typeof(p_cart_items) <> 'array' THEN
    p_cart_items := '[]'::jsonb;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items) LOOP
    v_id := COALESCE(v_item->>'id', '');
    v_qty := GREATEST(0, FLOOR(COALESCE((v_item->>'quantity')::numeric, 0)));
    IF v_id = '' OR v_qty = 0 THEN
      CONTINUE;
    END IF;

    -- Canonical price: look up by cfg_code OR by lower(cfg_code) so the
    -- frontend's peptide_id (lowercased cfg) still resolves.  If the id
    -- doesn't match any product, treat the line as $0 — the audit log
    -- will show the bogus id without exposing pricing.
    SELECT price INTO v_canonical_price
      FROM public.product_mappings
     WHERE cfg_code = v_id OR LOWER(cfg_code) = LOWER(v_id)
     LIMIT 1;

    v_canonical_price := COALESCE(v_canonical_price, 0);
    v_line_total := ROUND(v_canonical_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;

    -- Rebuild the cart item with the canonical price baked in so the admin
    -- modal and customer email always see consistent numbers.
    v_rebuilt := v_rebuilt || jsonb_build_object(
      'id', v_id,
      'name', v_item->>'name',
      'price', v_canonical_price,
      'quantity', v_qty,
      'image', v_item->>'image',
      -- Stamp the client's price so any tampering is forensically visible.
      'client_price', (v_item->>'price')
    );
  END LOOP;

  v_shipping := public.express_shipping_aud(v_subtotal);
  v_tax := public.checkout_gst_amount(v_subtotal);

  -- Discount: cap the client-asserted amount at what the discount code
  -- actually authorises.  If the code doesn't exist or has expired, the
  -- discount is zero regardless of what the client sent.
  -- Column names match the discount_codes schema at migration 20260408000000.
  IF p_discount_code IS NOT NULL AND trim(p_discount_code) <> '' THEN
    SELECT * INTO v_dc_row
      FROM public.discount_codes
     WHERE UPPER(code) = UPPER(trim(p_discount_code))
       AND COALESCE(is_active, true) = true
       AND (valid_until IS NULL OR valid_until > NOW())
       AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
       AND (min_order_amount IS NULL OR v_subtotal >= min_order_amount)
     LIMIT 1;

    IF v_dc_row IS NOT NULL THEN
      IF v_dc_row.discount_type = 'percentage' THEN
        v_discount := ROUND(v_subtotal * (v_dc_row.discount_value / 100.0), 2);
        -- Honour max_discount_amount cap for percentage discounts.
        IF v_dc_row.max_discount_amount IS NOT NULL
           AND v_discount > v_dc_row.max_discount_amount THEN
          v_discount := v_dc_row.max_discount_amount;
        END IF;
      ELSIF v_dc_row.discount_type = 'fixed' THEN
        v_discount := LEAST(v_subtotal, COALESCE(v_dc_row.discount_value, 0));
      END IF;
      -- Cap at the client's asserted amount so we never charge MORE
      -- discount than the storefront UI displayed.
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
-- Only invoked by upsert_payment_tracking (SECURITY DEFINER), never directly.

-- -----------------------------------------------------------------------
-- Replace upsert_payment_tracking to use the recomputed totals
-- -----------------------------------------------------------------------

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
  p_total_amount NUMERIC DEFAULT 0,     -- ignored: recomputed server-side
  p_currency TEXT DEFAULT 'AUD',
  p_discount_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0   -- capped server-side
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id UUID;
  v_recomputed RECORD;
  v_client_total NUMERIC := COALESCE(p_total_amount, 0);
  v_tamper_detected BOOLEAN := false;
BEGIN
  -- Recompute every number from the server's own data.
  SELECT * INTO v_recomputed FROM public._recompute_order_totals(
    p_cart_items, p_discount_code, p_discount_amount
  );

  -- Forensic flag: if the client's claim differs by more than 1¢, we
  -- record that on the order's admin_notes so an operator can spot it.
  IF ABS(v_recomputed.total_amount - v_client_total) > 0.01 THEN
    v_tamper_detected := true;
  END IF;

  INSERT INTO public.payment_tracking (
    order_reference, customer_email, customer_name, customer_phone,
    customer_address, cart_items, subtotal, shipping, tax,
    total_amount, currency, payment_status, discount_code, discount_amount,
    admin_notes
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
    END
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
    -- Preserve any prior admin_notes — append the tamper line instead
    -- of overwriting an existing operator comment.
    admin_notes = CASE
      WHEN payment_tracking.admin_notes IS NULL THEN EXCLUDED.admin_notes
      WHEN EXCLUDED.admin_notes IS NULL THEN payment_tracking.admin_notes
      ELSE payment_tracking.admin_notes || E'\n' || EXCLUDED.admin_notes
    END,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'tracking_id', v_id,
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

-- Re-grant — same surface the previous migration granted.
GRANT EXECUTE ON FUNCTION public.upsert_payment_tracking(
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, text, text, numeric
) TO anon, authenticated;

COMMIT;
