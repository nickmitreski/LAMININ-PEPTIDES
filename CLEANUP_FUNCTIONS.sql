-- =====================================================================
-- CLEANUP: Remove all duplicate functions
-- =====================================================================
-- Run this first to clean up any duplicate functions

-- List all existing versions of our functions
SELECT
  routine_name,
  routine_type,
  data_type as return_type,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product',
    'set_primary_product_image',
    'delete_product_image',
    'get_product_with_images'
  )
ORDER BY routine_name, arguments;
