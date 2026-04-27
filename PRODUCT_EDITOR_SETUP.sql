-- =====================================================================
-- PRODUCT EDITOR - COMPLETE SETUP SQL
-- =====================================================================
-- Run this in Supabase SQL Editor to enable product editing with images
-- URL: https://ytacbvfcltikxzudlkzn.supabase.co/project/ytacbvfcltikxzudlkzn/sql/new
-- =====================================================================

-- =====================================================================
-- PART 1: Create product_images table
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.product_mappings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_images
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images" ON public.product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
CREATE POLICY "Admins can insert product images" ON public.product_images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
CREATE POLICY "Admins can update product images" ON public.product_images
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
CREATE POLICY "Admins can delete product images" ON public.product_images
  FOR DELETE USING (true);

-- =====================================================================
-- PART 2: Add missing columns to product_mappings
-- =====================================================================

-- Add description and other useful fields
ALTER TABLE public.product_mappings
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS peptide_id TEXT,
ADD COLUMN IF NOT EXISTS strength TEXT;

-- Add index for peptide_id
CREATE INDEX IF NOT EXISTS idx_product_mappings_peptide_id ON public.product_mappings(peptide_id);

-- =====================================================================
-- PART 3: Create update_product function
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

-- =====================================================================
-- PART 4: Create set_primary_image function
-- =====================================================================

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

-- =====================================================================
-- PART 5: Create delete_product_image function
-- =====================================================================

CREATE OR REPLACE FUNCTION public.delete_product_image(
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

-- =====================================================================
-- PART 6: Create get_product_with_images function
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_product_with_images(
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

-- =====================================================================
-- PART 7: Grant permissions
-- =====================================================================

GRANT EXECUTE ON FUNCTION public.update_product TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_primary_product_image TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_image TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_with_images TO anon, authenticated;

-- =====================================================================
-- PART 8: Verify setup
-- =====================================================================

SELECT 'Tables Created:' as status;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('product_mappings', 'product_images')
ORDER BY table_name;

SELECT 'Functions Created:' as status;
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

-- =====================================================================
-- DONE! Now set up Supabase Storage in the dashboard
-- =====================================================================
-- Next steps:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket called 'product-images'
-- 3. Make it PUBLIC
-- 4. Add this policy:
--    - Policy name: "Anyone can view images"
--    - Allowed operation: SELECT
--    - Policy definition: true
-- 5. Add this policy:
--    - Policy name: "Admins can upload images"
--    - Allowed operation: INSERT
--    - Policy definition: true
-- =====================================================================
