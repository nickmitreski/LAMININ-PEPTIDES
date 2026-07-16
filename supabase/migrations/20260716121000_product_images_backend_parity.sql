-- Product image backend parity.
--
-- The live project already has product_images and image helper RPCs, but they
-- were only present in docs/sql-reference. This migration makes a fresh DB
-- rebuild support admin product image upload/edit/delete from version control.

BEGIN;

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.product_mappings(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  file_name text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary
  ON public.product_images(product_id, is_primary);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_storage_path
  ON public.product_images(storage_path);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin insert product images" ON public.product_images;
CREATE POLICY "Admin insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin update product images" ON public.product_images;
CREATE POLICY "Admin update product images"
  ON public.product_images FOR UPDATE
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin delete product images" ON public.product_images;
CREATE POLICY "Admin delete product images"
  ON public.product_images FOR DELETE
  USING (public.jwt_is_admin());

-- Keep updated_at fresh for direct table edits.
CREATE OR REPLACE FUNCTION public.touch_product_images_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_images_touch_updated_at ON public.product_images;
CREATE TRIGGER product_images_touch_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_images_updated_at();

-- Storage bucket used by src/utils/imageUpload.ts.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read product image storage" ON storage.objects;
CREATE POLICY "Public read product image storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin insert product image storage" ON storage.objects;
CREATE POLICY "Admin insert product image storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin update product image storage" ON storage.objects;
CREATE POLICY "Admin update product image storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.jwt_is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin delete product image storage" ON storage.objects;
CREATE POLICY "Admin delete product image storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.jwt_is_admin());

CREATE OR REPLACE FUNCTION public.set_primary_product_image(
  p_image_id uuid,
  p_product_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.product_images
    WHERE id = p_image_id
      AND product_id = p_product_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Image not found');
  END IF;

  UPDATE public.product_images
     SET is_primary = false
   WHERE product_id = p_product_id;

  UPDATE public.product_images
     SET is_primary = true
   WHERE id = p_image_id;

  RETURN jsonb_build_object('success', true, 'message', 'Primary image updated');
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_primary_product_image(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_product_image(p_image_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_storage_path text;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT storage_path
    INTO v_storage_path
    FROM public.product_images
   WHERE id = p_image_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Image not found');
  END IF;

  DELETE FROM public.product_images
   WHERE id = p_image_id;

  RETURN jsonb_build_object(
    'success', true,
    'storage_path', v_storage_path,
    'message', 'Image deleted successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_product_image(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_product_with_images(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_product jsonb;
  v_images jsonb;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT to_jsonb(p.*)
    INTO v_product
    FROM public.product_mappings p
   WHERE p.id = p_product_id;

  IF v_product IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'image_url', i.image_url,
        'storage_path', i.storage_path,
        'is_primary', i.is_primary,
        'display_order', i.display_order,
        'file_name', i.file_name,
        'file_size', i.file_size,
        'created_at', i.created_at,
        'updated_at', i.updated_at
      )
      ORDER BY i.is_primary DESC, i.display_order ASC, i.created_at ASC
    ),
    '[]'::jsonb
  )
    INTO v_images
    FROM public.product_images i
   WHERE i.product_id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product', v_product || jsonb_build_object('images', v_images)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_with_images(uuid) TO authenticated;

COMMIT;
