-- =====================================================================
-- PAYMENT TRACKING FIXES — 2026-04-29
-- =====================================================================
-- 1. Add discount_code/discount_amount to payment_tracking
-- 2. Recreate upsert_payment_tracking with discount params
-- 3. Create upsert_checkout_customer for customer record creation
-- =====================================================================

BEGIN;

-- 1. Add discount columns
ALTER TABLE public.payment_tracking
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- 2. Drop and recreate upsert_payment_tracking with discount support
DROP FUNCTION IF EXISTS public.upsert_payment_tracking(TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT);

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
  p_discount_amount NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.payment_tracking (
    order_reference, customer_email, customer_name, customer_phone,
    customer_address, cart_items, subtotal, shipping, tax,
    total_amount, currency, payment_status, discount_code, discount_amount
  ) VALUES (
    p_order_reference, p_customer_email, p_customer_name, p_customer_phone,
    p_customer_address, p_cart_items, p_subtotal, p_shipping, p_tax,
    p_total_amount, p_currency, 'pending', p_discount_code, p_discount_amount
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
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'tracking_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_payment_tracking(
  text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, text, text, numeric
) TO anon, authenticated;

-- 3. Create customer upsert function for checkout
CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_postcode TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_order_total NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('success', true, 'skipped', true);
  END IF;

  INSERT INTO public.customers (
    email, first_name, last_name, phone,
    address, city, state, postcode, country,
    total_orders, total_spent, last_order_date
  ) VALUES (
    lower(trim(p_email)), p_first_name, p_last_name, p_phone,
    p_address, p_city, p_state, p_postcode, p_country,
    1, COALESCE(p_order_total, 0), NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, customers.first_name),
    last_name = COALESCE(EXCLUDED.last_name, customers.last_name),
    phone = COALESCE(EXCLUDED.phone, customers.phone),
    address = COALESCE(EXCLUDED.address, customers.address),
    city = COALESCE(EXCLUDED.city, customers.city),
    state = COALESCE(EXCLUDED.state, customers.state),
    postcode = COALESCE(EXCLUDED.postcode, customers.postcode),
    country = COALESCE(EXCLUDED.country, customers.country),
    total_orders = customers.total_orders + 1,
    total_spent = customers.total_spent + COALESCE(p_order_total, 0),
    last_order_date = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'customer_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_checkout_customer(
  text, text, text, text, text, text, text, text, text, numeric
) TO anon, authenticated;

COMMIT;
