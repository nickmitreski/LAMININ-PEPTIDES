-- =====================================================================
-- PRODUCT EDITOR SETUP - PART 5: Create RPC functions Part 2 (FIXED)
-- =====================================================================
-- Run this after Part 4

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.delete_product_image(UUID);
DROP FUNCTION IF EXISTS public.get_product_with_images(UUID);

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
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product',
    'set_primary_product_image',
    'delete_product_image',
    'get_product_with_images'
  )
ORDER BY routine_name;
