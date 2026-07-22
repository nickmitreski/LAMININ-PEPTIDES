-- =====================================================================
-- SECURITY AUDIT FIXES — 2026-04-29
-- =====================================================================
-- Addresses critical vulnerabilities found during project audit:
--   1. payment_tracking: anon can read full customer PII
--   2. adjust_inventory: anon can call and modify stock
--   3. delete_customer_and_orders / delete_order: anon can call
--   4. email_logs: anon can read (exposes bank details in email bodies)
--   5. inventory_transactions: no RLS enabled, anon can read
--   6. email_templates: anon can read
--   7. discount_codes: anon can enumerate all active codes
--   8. product_images: RLS policies use USING(true) for writes
-- =====================================================================

BEGIN;

-- =====================================================================
-- FIX 1: payment_tracking — restrict to admin-only SELECT
-- The upsert_payment_tracking, mark_payment_instructions_viewed, and
-- get_payment_tracking_by_reference RPCs are SECURITY DEFINER so they
-- bypass RLS for writes. Only direct table reads need locking down.
-- =====================================================================

-- Drop any existing permissive policies (names may vary depending on
-- how the table was created outside migrations)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payment_tracking'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_tracking', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.payment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin select payment_tracking"
  ON public.payment_tracking FOR SELECT
  USING (public.jwt_is_admin());

CREATE POLICY "Admin insert payment_tracking"
  ON public.payment_tracking FOR INSERT
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY "Admin update payment_tracking"
  ON public.payment_tracking FOR UPDATE
  USING (public.jwt_is_admin());

CREATE POLICY "Admin delete payment_tracking"
  ON public.payment_tracking FOR DELETE
  USING (public.jwt_is_admin());

-- =====================================================================
-- FIX 2: adjust_inventory — revoke from anon + add admin check inside
-- =====================================================================

DO $$
BEGIN
  IF to_regprocedure(
    'public.adjust_inventory(text,integer,text,text,text)'
  ) IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.adjust_inventory(
      TEXT, INTEGER, TEXT, TEXT, TEXT
    ) FROM anon;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_cfg_code TEXT,
  p_quantity_change INTEGER,
  p_transaction_type TEXT,
  p_notes TEXT DEFAULT NULL,
  p_admin_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Defense-in-depth: only admins can adjust inventory
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT stock_quantity INTO v_current_quantity
  FROM public.product_mappings
  WHERE cfg_code = p_cfg_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_cfg_code;
  END IF;

  v_new_quantity := v_current_quantity + p_quantity_change;

  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Cannot reduce stock below 0. Current: %, Change: %', v_current_quantity, p_quantity_change;
  END IF;

  UPDATE public.product_mappings
  SET stock_quantity = v_new_quantity, updated_at = now()
  WHERE cfg_code = p_cfg_code;

  INSERT INTO public.inventory_transactions (
    product_cfg_code, transaction_type, quantity_change,
    quantity_before, quantity_after, notes, created_by_email
  ) VALUES (
    p_cfg_code, p_transaction_type, p_quantity_change,
    v_current_quantity, v_new_quantity, p_notes, p_admin_email
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'quantity_before', v_current_quantity,
    'quantity_after', v_new_quantity
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- =====================================================================
-- FIX 3: delete_customer_and_orders / delete_order — revoke from anon
--         + add admin check inside function bodies
-- =====================================================================

DO $$
BEGIN
  IF to_regprocedure('public.delete_customer_and_orders(text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.delete_customer_and_orders(TEXT) FROM anon;
  END IF;
  IF to_regprocedure('public.delete_order(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.delete_order(UUID) FROM anon;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.delete_customer_and_orders(
  p_customer_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_customer_id UUID;
  v_orders_deleted INTEGER := 0;
  v_notes_deleted INTEGER := 0;
  v_customer_deleted BOOLEAN := false;
BEGIN
  -- Defense-in-depth: only admins can delete customers
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE email = p_customer_email;

  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Customer not found',
      'email', p_customer_email
    );
  END IF;

  DELETE FROM public.order_notes
  WHERE order_id IN (
    SELECT id FROM public.order_references
    WHERE customer_email = p_customer_email
  );
  GET DIAGNOSTICS v_notes_deleted = ROW_COUNT;

  DELETE FROM public.order_references
  WHERE customer_email = p_customer_email;
  GET DIAGNOSTICS v_orders_deleted = ROW_COUNT;

  DELETE FROM public.customers
  WHERE email = p_customer_email;
  GET DIAGNOSTICS v_customer_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'customer_email', p_customer_email,
    'customer_id', v_customer_id,
    'orders_deleted', v_orders_deleted,
    'notes_deleted', v_notes_deleted,
    'customer_deleted', v_customer_deleted > 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_order(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_notes_deleted INTEGER := 0;
  v_order_deleted BOOLEAN := false;
  v_order_email TEXT;
BEGIN
  -- Defense-in-depth: only admins can delete orders
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT customer_email INTO v_order_email
  FROM public.order_references
  WHERE id = p_order_id;

  IF v_order_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found',
      'order_id', p_order_id
    );
  END IF;

  DELETE FROM public.order_notes WHERE order_id = p_order_id;
  GET DIAGNOSTICS v_notes_deleted = ROW_COUNT;

  DELETE FROM public.order_references WHERE id = p_order_id;
  GET DIAGNOSTICS v_order_deleted = ROW_COUNT;

  UPDATE public.customers
  SET total_orders = GREATEST(0, total_orders - 1), updated_at = NOW()
  WHERE email = v_order_email;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'customer_email', v_order_email,
    'notes_deleted', v_notes_deleted,
    'order_deleted', v_order_deleted > 0
  );
END;
$$;

-- =====================================================================
-- FIX 4: email_logs — drop open policies, add admin-only
-- =====================================================================

DROP POLICY IF EXISTS "Admin full access to email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admin select email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admin insert email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admin update email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admin delete email_logs" ON public.email_logs;

CREATE POLICY "Admin select email_logs"
  ON public.email_logs FOR SELECT
  USING (public.jwt_is_admin());

CREATE POLICY "Admin insert email_logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);  -- Edge Functions use service_role, this is a fallback

CREATE POLICY "Admin update email_logs"
  ON public.email_logs FOR UPDATE
  USING (public.jwt_is_admin());

CREATE POLICY "Admin delete email_logs"
  ON public.email_logs FOR DELETE
  USING (public.jwt_is_admin());

-- =====================================================================
-- FIX 5: inventory_transactions — enable RLS + admin-only
-- =====================================================================

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin select inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Admin insert inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Admin update inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Admin delete inventory_transactions" ON public.inventory_transactions;

CREATE POLICY "Admin select inventory_transactions"
  ON public.inventory_transactions FOR SELECT
  USING (public.jwt_is_admin());

CREATE POLICY "Admin insert inventory_transactions"
  ON public.inventory_transactions FOR INSERT
  WITH CHECK (true);  -- SECURITY DEFINER functions handle inserts

CREATE POLICY "Admin update inventory_transactions"
  ON public.inventory_transactions FOR UPDATE
  USING (public.jwt_is_admin());

CREATE POLICY "Admin delete inventory_transactions"
  ON public.inventory_transactions FOR DELETE
  USING (public.jwt_is_admin());

-- =====================================================================
-- FIX 6: email_templates — drop open policies, add admin-only
-- =====================================================================

DROP POLICY IF EXISTS "Admin full access to email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin select email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin insert email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin update email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admin delete email_templates" ON public.email_templates;

CREATE POLICY "Admin select email_templates"
  ON public.email_templates FOR SELECT
  USING (public.jwt_is_admin());

CREATE POLICY "Admin insert email_templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY "Admin update email_templates"
  ON public.email_templates FOR UPDATE
  USING (public.jwt_is_admin());

CREATE POLICY "Admin delete email_templates"
  ON public.email_templates FOR DELETE
  USING (public.jwt_is_admin());

-- =====================================================================
-- FIX 7: discount_codes — remove public SELECT (RPC still works)
-- =====================================================================

DROP POLICY IF EXISTS "Anyone can read active discount codes" ON public.discount_codes;

-- Admin policy already exists: "Admin full access to discount codes"

-- =====================================================================
-- FIX 8: product_images — replace USING(true) write policies with
--         admin-only. Keep public SELECT for storefront image display.
-- =====================================================================

DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
DROP POLICY IF EXISTS "Admin insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admin update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admin delete product images" ON public.product_images;

CREATE POLICY "Admin insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY "Admin update product images"
  ON public.product_images FOR UPDATE
  USING (public.jwt_is_admin());

CREATE POLICY "Admin delete product images"
  ON public.product_images FOR DELETE
  USING (public.jwt_is_admin());

-- "Anyone can view product images" SELECT policy is kept (storefront needs it)

COMMIT;
