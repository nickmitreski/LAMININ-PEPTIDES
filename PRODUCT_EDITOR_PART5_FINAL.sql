-- =====================================================================
-- PRODUCT EDITOR SETUP - PART 5: Create RPC functions Part 2 (FINAL)
-- =====================================================================
-- Run this after Part 4

-- Drop ALL existing versions of these functions first
DROP FUNCTION IF EXISTS public.delete_product_image(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_product_with_images(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.set_primary_product_image(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_product CASCADE;

-- Function 1: update_product (recreate to ensure it exists)
CREATE FUNCTION public.update_product(
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

-- Function 2: set_primary_product_image (recreate to ensure it exists)
CREATE FUNCTION public.set_primary_product_image(
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

-- Function 3: delete_product_image
CREATE FUNCTION public.delete_product_image(
  p_image_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_storage_path TEXT;
  v_product_id UUID;
BEGIN
  -- Get image details
  SELECT storage_path, product_id INTO v_storage_path, v_product_id
  FROM public.product_images
  WHERE id = p_image_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Image not found'
    );
  END IF;

  -- Delete from database
  DELETE FROM public.product_images
  WHERE id = p_image_id;

  RETURN jsonb_build_object(
    'success', true,
    'storage_path', v_storage_path,
    'message', 'Image deleted successfully'
  );
END;
$$;

-- Function 4: get_product_with_images
CREATE FUNCTION public.get_product_with_images(
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product JSONB;
  v_images JSONB;
BEGIN
  -- Get product details
  SELECT to_jsonb(p.*) INTO v_product
  FROM public.product_mappings p
  WHERE p.id = p_product_id;

  IF v_product IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;

  -- Get product images
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'image_url', i.image_url,
      'storage_path', i.storage_path,
      'is_primary', i.is_primary,
      'display_order', i.display_order,
      'file_name', i.file_name,
      'created_at', i.created_at
    ) ORDER BY i.is_primary DESC, i.display_order ASC
  ), '[]'::jsonb) INTO v_images
  FROM public.product_images i
  WHERE i.product_id = p_product_id;

  -- Combine product and images
  RETURN jsonb_build_object(
    'success', true,
    'product', v_product || jsonb_build_object('images', v_images)
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_product TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_primary_product_image TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_image TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_with_images TO anon, authenticated;

-- Verify all functions created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product',
    'set_primary_product_image',
    'delete_product_image',
    'get_product_with_images'
  )
ORDER BY routine_name;
