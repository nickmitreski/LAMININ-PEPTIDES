-- Client feature pack: storefront content fields, collections, bundles, research overrides,
-- duplicate product, admin customer update.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Product content + bundle fields on product_mappings
-- ---------------------------------------------------------------------------

ALTER TABLE public.product_mappings
  ADD COLUMN IF NOT EXISTS overview_text TEXT,
  ADD COLUMN IF NOT EXISTS specifications_text TEXT,
  ADD COLUMN IF NOT EXISTS analytical_text TEXT,
  ADD COLUMN IF NOT EXISTS coa_link_url TEXT,
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (product_type IN ('standard', 'bundle')),
  ADD COLUMN IF NOT EXISTS bundle_items JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.product_mappings.overview_text IS
  'Storefront overview/description paragraphs (plain text; line breaks preserved).';
COMMENT ON COLUMN public.product_mappings.specifications_text IS
  'Optional override for SPECIFICATIONS accordion (plain text). Falls back to defaults when null.';
COMMENT ON COLUMN public.product_mappings.analytical_text IS
  'Optional copy for ANALYTICAL VERIFICATION section (plain text).';
COMMENT ON COLUMN public.product_mappings.coa_link_url IS
  'Optional direct COA URL for this product line; used in addition to static coaPdfs.';
COMMENT ON COLUMN public.product_mappings.product_type IS
  'standard = single SKU; bundle = composed offer (see bundle_items).';
COMMENT ON COLUMN public.product_mappings.bundle_items IS
  'JSON array: [{"cfg_code":"CFG-031","qty":1},...] for bundle products.';

-- ---------------------------------------------------------------------------
-- 2. Collections
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections (slug);

CREATE TABLE IF NOT EXISTS public.product_collection_members (
  product_id UUID NOT NULL REFERENCES public.product_mappings(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_pcm_collection ON public.product_collection_members (collection_id);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collection_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read collections" ON public.collections;
CREATE POLICY "Anyone can read collections"
  ON public.collections FOR SELECT
  USING (is_active = true OR public.jwt_is_admin());

DROP POLICY IF EXISTS "Admin manage collections" ON public.collections;
CREATE POLICY "Admin manage collections"
  ON public.collections FOR ALL
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS "Anyone can read product_collection_members" ON public.product_collection_members;
CREATE POLICY "Anyone can read product_collection_members"
  ON public.product_collection_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage product_collection_members" ON public.product_collection_members;
CREATE POLICY "Admin manage product_collection_members"
  ON public.product_collection_members FOR ALL
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

-- ---------------------------------------------------------------------------
-- 3. Research profile overrides (Peptide science /research)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.research_profile_overrides (
  profile_id TEXT PRIMARY KEY,
  overview TEXT,
  mechanism TEXT,
  highlights TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.research_profile_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read research overrides" ON public.research_profile_overrides;
CREATE POLICY "Anyone read research overrides"
  ON public.research_profile_overrides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin write research overrides" ON public.research_profile_overrides;
CREATE POLICY "Admin write research overrides"
  ON public.research_profile_overrides FOR ALL
  USING (public.jwt_is_admin())
  WITH CHECK (public.jwt_is_admin());

-- ---------------------------------------------------------------------------
-- 4. update_product — extend with content + bundle + collection handled separately
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.update_product(
  uuid, text, text, text, numeric, text, boolean, integer, integer, boolean, numeric, text, integer, boolean, boolean
);

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
  p_clear_sale_label BOOLEAN DEFAULT FALSE,
  p_overview_text TEXT DEFAULT NULL,
  p_specifications_text TEXT DEFAULT NULL,
  p_analytical_text TEXT DEFAULT NULL,
  p_coa_link_url TEXT DEFAULT NULL,
  p_clear_coa_link_url BOOLEAN DEFAULT FALSE,
  p_product_type TEXT DEFAULT NULL,
  p_bundle_items JSONB DEFAULT NULL
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

  IF p_product_type IS NOT NULL AND p_product_type NOT IN ('standard', 'bundle') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid product_type');
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
    overview_text = COALESCE(p_overview_text, overview_text),
    specifications_text = COALESCE(p_specifications_text, specifications_text),
    analytical_text = COALESCE(p_analytical_text, analytical_text),
    coa_link_url = CASE
      WHEN p_clear_coa_link_url THEN NULL
      ELSE COALESCE(p_coa_link_url, coa_link_url)
    END,
    product_type = COALESCE(p_product_type, product_type),
    bundle_items = COALESCE(p_bundle_items, bundle_items),
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'message', 'Product updated successfully'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. create_product — extend
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.create_product(
  text, text, text, numeric, text, text, boolean, integer, integer, boolean, numeric, text, integer
);

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
  p_sort_order INTEGER DEFAULT 0,
  p_overview_text TEXT DEFAULT NULL,
  p_specifications_text TEXT DEFAULT NULL,
  p_analytical_text TEXT DEFAULT NULL,
  p_coa_link_url TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT 'standard',
  p_bundle_items JSONB DEFAULT '[]'::jsonb
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

  IF p_product_type NOT IN ('standard', 'bundle') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid product_type');
  END IF;

  IF EXISTS (SELECT 1 FROM public.product_mappings WHERE cfg_code = trim(p_cfg_code)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CFG code already exists');
  END IF;

  INSERT INTO public.product_mappings (
    cfg_code, peptide_name, protein_name, price, description, category,
    is_active, stock_quantity, low_stock_threshold, track_inventory,
    compare_at_price, sale_label, sort_order,
    overview_text, specifications_text, analytical_text, coa_link_url,
    product_type, bundle_items
  ) VALUES (
    trim(p_cfg_code), trim(p_peptide_name), COALESCE(trim(p_protein_name), ''),
    p_price, COALESCE(p_description, ''), COALESCE(p_category, ''),
    p_is_active, p_stock_quantity, p_low_stock_threshold, p_track_inventory,
    p_compare_at_price, p_sale_label, p_sort_order,
    p_overview_text, p_specifications_text, p_analytical_text, p_coa_link_url,
    p_product_type, COALESCE(p_bundle_items, '[]'::jsonb)
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_new_id,
    'cfg_code', trim(p_cfg_code),
    'message', 'Product created successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_product(
  text, text, text, numeric, text, text, boolean, integer, integer, boolean, numeric, text, integer,
  text, text, text, text, text, jsonb
) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. duplicate_product
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.duplicate_product(p_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_old public.product_mappings%ROWTYPE;
  v_new_id UUID;
  v_new_cfg TEXT;
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_old FROM public.product_mappings WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  v_new_cfg := public.suggest_next_cfg_code();
  IF v_new_cfg IS NULL OR v_new_cfg = '' THEN
    v_new_cfg := 'CFG-NEW-' || substr(md5(random()::text), 1, 8);
  END IF;

  INSERT INTO public.product_mappings (
    cfg_code,
    peptide_name,
    protein_name,
    price,
    description,
    category,
    is_active,
    stock_quantity,
    low_stock_threshold,
    track_inventory,
    compare_at_price,
    sale_label,
    sort_order,
    overview_text,
    specifications_text,
    analytical_text,
    coa_link_url,
    product_type,
    bundle_items
  )
  VALUES (
    v_new_cfg,
    trim(v_old.peptide_name) || ' (Copy)',
    v_old.protein_name,
    v_old.price,
    v_old.description,
    v_old.category,
    FALSE,
    v_old.stock_quantity,
    v_old.low_stock_threshold,
    v_old.track_inventory,
    v_old.compare_at_price,
    v_old.sale_label,
    v_old.sort_order,
    v_old.overview_text,
    v_old.specifications_text,
    v_old.analytical_text,
    v_old.coa_link_url,
    v_old.product_type,
    v_old.bundle_items
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    storage_path,
    file_name,
    file_size,
    is_primary,
    display_order
  )
  SELECT
    v_new_id,
    i.image_url,
    i.storage_path,
    i.file_name,
    i.file_size,
    i.is_primary,
    i.display_order
  FROM public.product_images i
  WHERE i.product_id = p_product_id;

  INSERT INTO public.product_collection_members (product_id, collection_id)
  SELECT v_new_id, m.collection_id
  FROM public.product_collection_members m
  WHERE m.product_id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_new_id,
    'cfg_code', v_new_cfg
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.duplicate_product(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. set_product_collections — replace memberships
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_product_collections(
  p_product_id UUID,
  p_collection_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.product_mappings WHERE id = p_product_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  DELETE FROM public.product_collection_members WHERE product_id = p_product_id;

  IF p_collection_ids IS NOT NULL AND array_length(p_collection_ids, 1) > 0 THEN
    INSERT INTO public.product_collection_members (product_id, collection_id)
    SELECT p_product_id, c
    FROM (SELECT DISTINCT unnest(p_collection_ids) AS c) u
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_product_collections(UUID, UUID[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Admin: update customer
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_update_customer(
  p_customer_id UUID,
  p_email TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_postcode TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  IF p_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.email = trim(p_email) AND c.id <> p_customer_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email already in use');
  END IF;

  UPDATE public.customers
  SET
    email = CASE WHEN p_email IS NULL THEN email ELSE trim(p_email) END,
    first_name = CASE WHEN p_first_name IS NULL THEN first_name ELSE p_first_name END,
    last_name = CASE WHEN p_last_name IS NULL THEN last_name ELSE p_last_name END,
    phone = CASE WHEN p_phone IS NULL THEN phone ELSE p_phone END,
    address = CASE WHEN p_address IS NULL THEN address ELSE p_address END,
    city = CASE WHEN p_city IS NULL THEN city ELSE p_city END,
    state = CASE WHEN p_state IS NULL THEN state ELSE p_state END,
    postcode = CASE WHEN p_postcode IS NULL THEN postcode ELSE p_postcode END,
    country = CASE WHEN p_country IS NULL THEN country ELSE p_country END,
    updated_at = NOW()
  WHERE id = p_customer_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. Grants for new tables (RLS still applies)
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.collections TO anon, authenticated;
GRANT SELECT ON public.product_collection_members TO anon, authenticated;
GRANT SELECT ON public.research_profile_overrides TO anon, authenticated;

COMMIT;
