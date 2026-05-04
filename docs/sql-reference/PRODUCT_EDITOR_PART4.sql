-- =====================================================================
-- PRODUCT EDITOR SETUP - PART 4: Create RPC functions (Part 1)
-- =====================================================================
-- Run this after Part 3

-- Function 1: update_product
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
  p_track_inventory BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product public.product_mappings%ROWTYPE;
BEGIN
  -- Get current product
  SELECT * INTO v_product
  FROM public.product_mappings
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;

  -- Update product with provided values (only non-null)
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
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'message', 'Product updated successfully'
  );
END;
$$;

-- Function 2: set_primary_product_image
CREATE OR REPLACE FUNCTION public.set_primary_product_image(
  p_image_id UUID,
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if image exists
  IF NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE id = p_image_id AND product_id = p_product_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Image not found'
    );
  END IF;

  -- Unset all primary images for this product
  UPDATE public.product_images
  SET is_primary = false
  WHERE product_id = p_product_id;

  -- Set new primary image
  UPDATE public.product_images
  SET is_primary = true
  WHERE id = p_image_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Primary image updated'
  );
END;
$$;

-- Verify functions created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_product', 'set_primary_product_image')
ORDER BY routine_name;
