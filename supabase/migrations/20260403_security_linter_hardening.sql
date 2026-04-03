-- Security hardening for Supabase database linter:
-- 0011_function_search_path_mutable, 0024_permissive_rls_policy (INSERT/UPDATE/ALL)
--
-- Run after 20260402_enhanced_customer_orders.sql
--
-- Notes:
-- - Checkout still uses the anon key: INSERT policies allow anon with non-trivial WITH CHECK.
-- - Admin dashboard writes require JWT app_metadata.admin = true (set in Dashboard or admin_auth_setup.sql).
--   VITE_ADMIN_EMAIL_ALLOWLIST is frontend-only and does NOT satisfy RLS.
-- - Enable "Leaked password protection" in Dashboard → Authentication (not SQL): see Supabase Auth settings.

-- ============================================================================
-- 1. Trigger function: fixed search_path + SECURITY DEFINER (RLS-safe updates)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.customers
  SET
    total_orders = total_orders + 1,
    total_spent = total_spent + COALESCE(NEW.total_price, 0),
    last_order_date = NEW.created_at,
    address = COALESCE(address, NEW.customer_address),
    city = COALESCE(city, NEW.customer_city),
    state = COALESCE(state, NEW.customer_state),
    postcode = COALESCE(postcode, NEW.customer_postcode),
    country = COALESCE(country, NEW.customer_country),
    phone = COALESCE(phone, NEW.customer_phone),
    updated_at = NOW()
  WHERE lower(trim(email)) = lower(trim(NEW.customer_email));

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_customer_stats() FROM PUBLIC;

-- ============================================================================
-- 2. Helper: admin claim in JWT (app_metadata.admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean,
    false
  );
$$;

REVOKE ALL ON FUNCTION public.jwt_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_is_admin() TO authenticated;

COMMENT ON FUNCTION public.jwt_is_admin() IS
  'True when Supabase Auth JWT includes app_metadata.admin (boolean or truthy string).';

-- ============================================================================
-- 3. customers: INSERT — not WITH CHECK (true)
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;
DROP POLICY IF EXISTS "Anon and users can insert customers with valid email" ON public.customers;
CREATE POLICY "Anon and users can insert customers with valid email"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) >= 5
    AND position('@' IN trim(email)) > 1
    AND position('.' IN split_part(trim(email), '@', 2)) >= 1
  );

-- ============================================================================
-- 4. order_references: INSERT — structured checkout rows only
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can create order references" ON public.order_references;
DROP POLICY IF EXISTS "Anon and users can create order references for checkout" ON public.order_references;
CREATE POLICY "Anon and users can create order references for checkout"
  ON public.order_references
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    customer_email IS NOT NULL
    AND length(trim(customer_email)) >= 5
    AND position('@' IN trim(customer_email)) > 1
    AND peptide_order_id IS NOT NULL
    AND peptide_order_id ~ '^PEP-[0-9]{8}-[A-Z0-9]{4}$'
    AND peptide_items IS NOT NULL
    AND jsonb_typeof(peptide_items) = 'array'
    AND jsonb_array_length(peptide_items) >= 1
    AND jsonb_array_length(peptide_items) <= 200
  );

-- ============================================================================
-- 5. order_references: UPDATE — admins only (was wide open)
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can update order status" ON public.order_references;
DROP POLICY IF EXISTS "Admins can update order references" ON public.order_references;
CREATE POLICY "Admins can update order references"
  ON public.order_references
  FOR UPDATE
  TO authenticated
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

-- ============================================================================
-- 6. product_mappings: INSERT — admins only
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can insert product mappings" ON public.product_mappings;
DROP POLICY IF EXISTS "Admins can insert product mappings" ON public.product_mappings;
CREATE POLICY "Admins can insert product mappings"
  ON public.product_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.jwt_is_admin());

-- ============================================================================
-- 7. order_notes: replace FOR ALL USING (true) with admin-only policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage order notes" ON public.order_notes;
DROP POLICY IF EXISTS "Admins can select order notes" ON public.order_notes;
DROP POLICY IF EXISTS "Admins can insert order notes" ON public.order_notes;
DROP POLICY IF EXISTS "Admins can update order notes" ON public.order_notes;
DROP POLICY IF EXISTS "Admins can delete order notes" ON public.order_notes;

CREATE POLICY "Admins can select order notes"
  ON public.order_notes
  FOR SELECT
  TO authenticated
  USING (public.jwt_is_admin());

CREATE POLICY "Admins can insert order notes"
  ON public.order_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY "Admins can update order notes"
  ON public.order_notes
  FOR UPDATE
  TO authenticated
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY "Admins can delete order notes"
  ON public.order_notes
  FOR DELETE
  TO authenticated
  USING (public.jwt_is_admin());
