-- =====================================================================
-- FORCE DROP ALL VERSIONS OF INVENTORY FUNCTIONS
-- =====================================================================
-- This script drops ALL possible versions of these functions
-- Run this first, then run the CREATE script
-- =====================================================================

-- Drop all possible signatures of adjust_inventory
DROP FUNCTION IF EXISTS public.adjust_inventory(TEXT, INTEGER, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_inventory(TEXT, INTEGER, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_inventory(TEXT, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_inventory CASCADE;

-- Drop all possible signatures of get_inventory_history
DROP FUNCTION IF EXISTS public.get_inventory_history(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_inventory_history(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_inventory_history CASCADE;

-- Drop all possible signatures of get_low_stock_products
DROP FUNCTION IF EXISTS public.get_low_stock_products() CASCADE;
DROP FUNCTION IF EXISTS public.get_low_stock_products CASCADE;

-- Verify all functions are gone
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('adjust_inventory', 'get_inventory_history', 'get_low_stock_products');

-- If you see any results above, manually drop them using the exact signature shown
