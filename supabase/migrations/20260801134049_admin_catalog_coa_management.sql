-- Admin catalog and COA management overhaul.
-- Keeps public certificate reads simple while all mutations require an admin
-- JWT claim checked by public.jwt_is_admin().

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Repair schema drift from the historical manual product-editor setup.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.product_mappings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary
  ON public.product_images(product_id, is_primary);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
DROP POLICY IF EXISTS "Admin insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admin update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admin delete product images" ON public.product_images;

CREATE POLICY "Admin insert product images"
  ON public.product_images FOR INSERT
  TO authenticated
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY "Admin update product images"
  ON public.product_images FOR UPDATE
  TO authenticated
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

CREATE POLICY "Admin delete product images"
  ON public.product_images FOR DELETE
  TO authenticated
  USING (public.jwt_is_admin());

REVOKE ALL ON TABLE public.product_images FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_images TO authenticated;

DROP POLICY IF EXISTS "Admin can update product mappings" ON public.product_mappings;
CREATE POLICY "Admin can update product mappings"
  ON public.product_mappings FOR UPDATE
  TO authenticated
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin can delete product mappings" ON public.product_mappings;
CREATE POLICY "Admin can delete product mappings"
  ON public.product_mappings FOR DELETE
  TO authenticated
  USING (public.jwt_is_admin());

GRANT SELECT ON TABLE public.product_mappings TO anon, authenticated;
GRANT UPDATE ON TABLE public.product_mappings TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Versioned certificates of analysis.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_coas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.product_mappings(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Certificate of Analysis',
  batch_number TEXT,
  lab_name TEXT,
  test_date DATE,
  expires_at DATE,
  document_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/png', 'image/jpeg')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_coas_product
  ON public.product_coas(product_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_coas_one_current
  ON public.product_coas(product_id)
  WHERE is_current;

ALTER TABLE public.product_coas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published COAs" ON public.product_coas;
CREATE POLICY "Public can view published COAs"
  ON public.product_coas FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can view all COAs" ON public.product_coas;
CREATE POLICY "Admins can view all COAs"
  ON public.product_coas FOR SELECT
  TO authenticated
  USING (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admins can insert COAs" ON public.product_coas;
CREATE POLICY "Admins can insert COAs"
  ON public.product_coas FOR INSERT
  TO authenticated
  WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admins can update COAs" ON public.product_coas;
CREATE POLICY "Admins can update COAs"
  ON public.product_coas FOR UPDATE
  TO authenticated
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS "Admins can delete COAs" ON public.product_coas;
CREATE POLICY "Admins can delete COAs"
  ON public.product_coas FOR DELETE
  TO authenticated
  USING (public.jwt_is_admin());

REVOKE ALL ON TABLE public.product_coas FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.product_coas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_coas TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Public Storage buckets with admin-only mutations.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coa-documents',
  'coa-documents',
  TRUE,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
CREATE POLICY "Admin upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
CREATE POLICY "Admin update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.jwt_is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
CREATE POLICY "Admin delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin upload COA documents" ON storage.objects;
CREATE POLICY "Admin upload COA documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'coa-documents' AND public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin update COA documents" ON storage.objects;
CREATE POLICY "Admin update COA documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'coa-documents' AND public.jwt_is_admin())
  WITH CHECK (bucket_id = 'coa-documents' AND public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin delete COA documents" ON storage.objects;
CREATE POLICY "Admin delete COA documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'coa-documents' AND public.jwt_is_admin());

-- ---------------------------------------------------------------------------
-- 4. Harden legacy product-editor RPCs that were originally granted to anon.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_primary_product_image(
  p_image_id UUID,
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.product_images
    WHERE id = p_image_id AND product_id = p_product_id
  ) THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Image not found');
  END IF;

  UPDATE public.product_images
  SET is_primary = (id = p_image_id), updated_at = NOW()
  WHERE product_id = p_product_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION public.suggest_next_cfg_code()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT CASE
    WHEN public.jwt_is_admin() THEN
      'CFG-' || lpad(
        (COALESCE(
          MAX(NULLIF(regexp_replace(cfg_code, '^CFG-', ''), '')::INTEGER),
          0
        ) + 1)::TEXT,
        3,
        '0'
      )
    ELSE NULL
  END
  FROM public.product_mappings
  WHERE cfg_code ~ '^CFG-\d+$';
$$;

CREATE OR REPLACE FUNCTION public.delete_product_image(p_image_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_storage_path TEXT;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;

  DELETE FROM public.product_images
  WHERE id = p_image_id
  RETURNING storage_path INTO v_storage_path;

  IF v_storage_path IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Image not found');
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'storage_path', v_storage_path
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_with_images(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_product JSONB;
  v_images JSONB;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;

  SELECT to_jsonb(p.*) INTO v_product
  FROM public.product_mappings p
  WHERE p.id = p_product_id;

  IF v_product IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Product not found');
  END IF;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(i.*) ORDER BY i.is_primary DESC, i.display_order, i.created_at),
    '[]'::jsonb
  ) INTO v_images
  FROM public.product_images i
  WHERE i.product_id = p_product_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'product', v_product || jsonb_build_object('images', v_images)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_product_coa(
  p_coa_id UUID,
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_document_url TEXT;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;

  SELECT document_url INTO v_document_url
  FROM public.product_coas
  WHERE id = p_coa_id AND product_id = p_product_id;

  IF v_document_url IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Certificate not found');
  END IF;

  UPDATE public.product_coas
  SET is_current = FALSE,
      status = CASE WHEN status = 'published' THEN 'archived' ELSE status END,
      updated_at = NOW()
  WHERE product_id = p_product_id AND id <> p_coa_id;

  UPDATE public.product_coas
  SET is_current = TRUE, status = 'published', updated_at = NOW()
  WHERE id = p_coa_id;

  UPDATE public.product_mappings
  SET coa_link_url = v_document_url, updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object('success', TRUE, 'document_url', v_document_url);
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_product_coa(p_coa_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_product_id UUID;
  v_was_current BOOLEAN;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Unauthorized');
  END IF;

  SELECT product_id, is_current INTO v_product_id, v_was_current
  FROM public.product_coas
  WHERE id = p_coa_id;

  IF v_product_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Certificate not found');
  END IF;

  UPDATE public.product_coas
  SET is_current = FALSE, status = 'archived', updated_at = NOW()
  WHERE id = p_coa_id;

  IF v_was_current THEN
    UPDATE public.product_mappings
    SET coa_link_url = NULL, updated_at = NOW()
    WHERE id = v_product_id;
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'was_current', v_was_current);
END;
$$;

REVOKE ALL ON FUNCTION public.set_primary_product_image(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_product_image(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_product_with_images(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_current_product_coa(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.archive_product_coa(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_primary_product_image(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_image(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_with_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_product_coa(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_product_coa(UUID) TO authenticated;

-- Remove implicit PUBLIC execution from other mutating admin RPC overloads
-- while retaining their existing internal jwt_is_admin checks.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_product',
        'update_product',
        'delete_product',
        'duplicate_product',
        'suggest_next_cfg_code',
        'set_product_collections',
        'admin_update_customer',
        'adjust_inventory'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.signature);
  END LOOP;
END;
$$;

COMMIT;
