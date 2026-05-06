-- =====================================================================
-- PRODUCT MANAGEMENT ENHANCEMENTS — 2026-04-29
-- =====================================================================
-- Adds sale pricing, display ordering, and full CRUD RPCs for products.
-- =====================================================================

BEGIN;

-- =====================================================================
-- 1. Add sale/display columns to product_mappings
-- =====================================================================

ALTER TABLE public.product_mappings
  ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS sale_label TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.product_mappings.compare_at_price IS
  'Original price before sale. When set and > price, product is displayed as on sale.';
COMMENT ON COLUMN public.product_mappings.sale_label IS
  'Custom label shown on sale badge, e.g. "SALE", "20% OFF". NULL uses default "SALE".';
COMMENT ON COLUMN public.product_mappings.sort_order IS
  'Admin-controlled display ordering. Lower numbers sort first.';

-- =====================================================================
-- 2. Update update_product RPC to include new fields
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_product(
  p_product_id UUID,
  p_peptide_name TEXT DEFAULT NULL,
  p_protein_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_stock_quantity INTEGER DEFAULT NULL,
  p_low_stock_threshold INTEGER DEFAULT NULL,
  p_track_inventory BOOLEAN DEFAULT NULL,
  p_compare_at_price NUMERIC DEFAULT NULL,
  p_sale_label TEXT DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL,
  p_clear_compare_at_price BOOLEAN DEFAULT FALSE,
  p_clear_sale_label BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_product public.product_mappings%ROWTYPE;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_product
  FROM public.product_mappings
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  UPDATE public.product_mappings
  SET
    peptide_name = COALESCE(p_peptide_name, peptide_name),
    protein_name = COALESCE(p_protein_name, protein_name),
    description = COALESCE(p_description, description),
    price = COALESCE(p_price, price),
    category = COALESCE(p_category, category),
    is_active = COALESCE(p_is_active, is_active),
    stock_quantity = COALESCE(p_stock_quantity, stock_quantity),
    low_stock_threshold = COALESCE(p_low_stock_threshold, low_stock_threshold),
    track_inventory = COALESCE(p_track_inventory, track_inventory),
    compare_at_price = CASE
      WHEN p_clear_compare_at_price THEN NULL
      ELSE COALESCE(p_compare_at_price, compare_at_price)
    END,
    sale_label = CASE
      WHEN p_clear_sale_label THEN NULL
      ELSE COALESCE(p_sale_label, sale_label)
    END,
    sort_order = COALESCE(p_sort_order, sort_order),
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'message', 'Product updated successfully'
  );
END;
$$;

-- =====================================================================
-- 3. Create create_product RPC (admin-only)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.create_product(
  p_cfg_code TEXT,
  p_peptide_name TEXT,
  p_protein_name TEXT DEFAULT '',
  p_price NUMERIC DEFAULT 0,
  p_description TEXT DEFAULT '',
  p_category TEXT DEFAULT '',
  p_is_active BOOLEAN DEFAULT TRUE,
  p_stock_quantity INTEGER DEFAULT 0,
  p_low_stock_threshold INTEGER DEFAULT 10,
  p_track_inventory BOOLEAN DEFAULT TRUE,
  p_compare_at_price NUMERIC DEFAULT NULL,
  p_sale_label TEXT DEFAULT NULL,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_cfg_code IS NULL OR trim(p_cfg_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'CFG code is required');
  END IF;

  IF p_peptide_name IS NULL OR trim(p_peptide_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product name is required');
  END IF;

  -- Check for duplicate CFG code
  IF EXISTS (SELECT 1 FROM public.product_mappings WHERE cfg_code = p_cfg_code) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CFG code already exists');
  END IF;

  INSERT INTO public.product_mappings (
    cfg_code, peptide_name, protein_name, price, description, category,
    is_active, stock_quantity, low_stock_threshold, track_inventory,
    compare_at_price, sale_label, sort_order
  ) VALUES (
    trim(p_cfg_code), trim(p_peptide_name), COALESCE(trim(p_protein_name), ''),
    p_price, COALESCE(p_description, ''), COALESCE(p_category, ''),
    p_is_active, p_stock_quantity, p_low_stock_threshold, p_track_inventory,
    p_compare_at_price, p_sale_label, p_sort_order
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_new_id,
    'cfg_code', p_cfg_code,
    'message', 'Product created successfully'
  );
END;
$$;

-- Explicit arg types so GRANT is unambiguous when older create_product overloads exist.
GRANT EXECUTE ON FUNCTION public.create_product(
  text, text, text, numeric, text, text, boolean, integer, integer, boolean, numeric, text, integer
) TO authenticated;

-- =====================================================================
-- 4. Create delete_product RPC (admin-only)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.delete_product(
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_cfg_code TEXT;
  v_images_deleted INTEGER := 0;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT cfg_code INTO v_cfg_code
  FROM public.product_mappings
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  -- Delete associated images
  DELETE FROM public.product_images WHERE product_id = p_product_id;
  GET DIAGNOSTICS v_images_deleted = ROW_COUNT;

  -- Delete associated inventory transactions
  DELETE FROM public.inventory_transactions WHERE product_cfg_code = v_cfg_code;

  -- Delete the product
  DELETE FROM public.product_mappings WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'cfg_code', v_cfg_code,
    'images_deleted', v_images_deleted,
    'message', 'Product deleted successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_product(uuid) TO authenticated;

-- =====================================================================
-- 5. Add UPDATE/DELETE RLS policies for product_mappings (admin-only)
-- =====================================================================

DROP POLICY IF EXISTS "Admin can update product mappings" ON public.product_mappings;
CREATE POLICY "Admin can update product mappings"
  ON public.product_mappings FOR UPDATE
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin can delete product mappings" ON public.product_mappings;
CREATE POLICY "Admin can delete product mappings"
  ON public.product_mappings FOR DELETE
  USING (public.jwt_is_admin());

-- =====================================================================
-- 6. Suggest next CFG code helper (read-only, admin-only)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.suggest_next_cfg_code()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT 'CFG-' || lpad(
    (COALESCE(
      MAX(NULLIF(regexp_replace(cfg_code, '^CFG-', ''), '')::INTEGER),
      0
    ) + 1)::TEXT,
    3, '0'
  )
  FROM public.product_mappings
  WHERE cfg_code ~ '^CFG-\d+$';
$$;

GRANT EXECUTE ON FUNCTION public.suggest_next_cfg_code() TO authenticated;

COMMIT;
