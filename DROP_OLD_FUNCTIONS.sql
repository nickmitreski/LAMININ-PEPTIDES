-- =====================================================================
-- DROP OLD FUNCTIONS - Remove all old versions
-- =====================================================================
-- Run this to clean up old function versions

-- Drop the old set_primary_product_image function with old signature
DROP FUNCTION IF EXISTS public.set_primary_product_image(text, uuid) CASCADE;

-- Drop any other versions that might exist
DROP FUNCTION IF EXISTS public.set_primary_product_image(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_product CASCADE;
DROP FUNCTION IF EXISTS public.delete_product_image(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_product_with_images(uuid) CASCADE;

-- Verify all are gone
SELECT routine_name, pg_get_function_identity_arguments(p.oid) as arguments
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product',
    'set_primary_product_image',
    'delete_product_image',
    'get_product_with_images'
  )
ORDER BY routine_name;
