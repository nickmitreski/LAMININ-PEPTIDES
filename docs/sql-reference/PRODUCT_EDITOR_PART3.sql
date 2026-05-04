-- =====================================================================
-- PRODUCT EDITOR SETUP - PART 3: Create RLS policies
-- =====================================================================
-- Run this after Part 2

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

-- Verify policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'product_images'
ORDER BY policyname;
