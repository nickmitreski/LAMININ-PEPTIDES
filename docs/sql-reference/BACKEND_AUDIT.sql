-- =====================================================================
-- LAMININ PEPTIDES - COMPREHENSIVE BACKEND AUDIT
-- =====================================================================
-- This script audits your entire Supabase backend configuration
-- Run this in Supabase SQL Editor to get a complete health report
-- Created: 2026-04-22
-- =====================================================================

\echo '==================== STARTING BACKEND AUDIT ===================='
\echo ''

-- =====================================================================
-- SECTION 1: DATABASE TABLES
-- =====================================================================
\echo '1. CHECKING DATABASE TABLES...'
\echo '--------------------------------------------------------------'

SELECT
  '✓ Tables Found' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name AND columns.table_schema = 'public') as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''

-- =====================================================================
-- SECTION 2: PRODUCT_MAPPINGS TABLE AUDIT
-- =====================================================================
\echo '2. PRODUCT MAPPINGS TABLE STRUCTURE...'
\echo '--------------------------------------------------------------'

-- Check all columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_mappings'
ORDER BY ordinal_position;

\echo ''
\echo 'Product Mappings Row Count:'

SELECT
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_products
FROM public.product_mappings;

\echo ''
\echo 'Inventory Columns Check:'

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_mappings'
    AND column_name = 'stock_quantity'
  ) as has_stock_quantity,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_mappings'
    AND column_name = 'track_inventory'
  ) as has_track_inventory,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_mappings'
    AND column_name = 'low_stock_threshold'
  ) as has_low_stock_threshold;

\echo ''
\echo 'Sample Products with Inventory Data:'

SELECT
  cfg_code,
  peptide_name,
  COALESCE(stock_quantity::text, 'NULL') as stock_quantity,
  COALESCE(track_inventory::text, 'NULL') as track_inventory,
  COALESCE(low_stock_threshold::text, 'NULL') as low_stock_threshold,
  price
FROM public.product_mappings
WHERE is_active = true
ORDER BY peptide_name
LIMIT 10;

\echo ''

-- =====================================================================
-- SECTION 3: INVENTORY TRANSACTIONS TABLE
-- =====================================================================
\echo '3. INVENTORY TRANSACTIONS TABLE...'
\echo '--------------------------------------------------------------'

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'inventory_transactions'
  ) as table_exists;

\echo ''

-- If table exists, show structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'inventory_transactions'
ORDER BY ordinal_position;

\echo ''
\echo 'Transaction Statistics:'

SELECT
  COUNT(*) as total_transactions,
  COUNT(DISTINCT product_cfg_code) as products_with_transactions,
  MIN(created_at) as first_transaction,
  MAX(created_at) as last_transaction
FROM public.inventory_transactions;

\echo ''
\echo 'Recent Transactions (Last 5):'

SELECT
  product_cfg_code,
  transaction_type,
  quantity_change,
  quantity_before,
  quantity_after,
  created_at
FROM public.inventory_transactions
ORDER BY created_at DESC
LIMIT 5;

\echo ''

-- =====================================================================
-- SECTION 4: ORDER_REFERENCES TABLE AUDIT
-- =====================================================================
\echo '4. ORDER REFERENCES TABLE...'
\echo '--------------------------------------------------------------'

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_references'
ORDER BY ordinal_position;

\echo ''
\echo 'Order Statistics:'

SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
  COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders
FROM public.order_references;

\echo ''
\echo 'Customer Data Completeness:'

SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE customer_email IS NOT NULL) as has_email,
  COUNT(*) FILTER (WHERE customer_phone IS NOT NULL) as has_phone,
  COUNT(*) FILTER (WHERE customer_address IS NOT NULL) as has_address,
  COUNT(*) FILTER (WHERE customer_city IS NOT NULL) as has_city,
  COUNT(*) FILTER (WHERE customer_state IS NOT NULL) as has_state,
  COUNT(*) FILTER (WHERE customer_postcode IS NOT NULL) as has_postcode
FROM public.order_references;

\echo ''
\echo 'Recent Orders (Last 5):'

SELECT
  peptide_order_id,
  customer_email,
  status,
  total_price,
  created_at
FROM public.order_references
ORDER BY created_at DESC
LIMIT 5;

\echo ''

-- =====================================================================
-- SECTION 5: CUSTOMERS TABLE AUDIT
-- =====================================================================
\echo '5. CUSTOMERS TABLE...'
\echo '--------------------------------------------------------------'

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

\echo ''
\echo 'Customer Statistics:'

SELECT
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE phone IS NOT NULL) as has_phone,
  COUNT(*) FILTER (WHERE address IS NOT NULL) as has_address,
  COUNT(*) FILTER (WHERE total_orders > 0) as customers_with_orders,
  COALESCE(AVG(total_orders), 0)::numeric(10,2) as avg_orders_per_customer,
  COALESCE(AVG(total_spent), 0)::numeric(10,2) as avg_spent_per_customer
FROM public.customers;

\echo ''

-- =====================================================================
-- SECTION 6: RPC FUNCTIONS
-- =====================================================================
\echo '6. RPC FUNCTIONS (STORED PROCEDURES)...'
\echo '--------------------------------------------------------------'

SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'adjust_inventory',
    'get_inventory_history',
    'get_low_stock_products',
    'update_customer_stats'
  )
ORDER BY routine_name;

\echo ''
\echo 'Function Details:'

-- Check adjust_inventory function
SELECT
  'adjust_inventory' as function_name,
  EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'adjust_inventory'
  ) as exists;

SELECT
  'get_inventory_history' as function_name,
  EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'get_inventory_history'
  ) as exists;

SELECT
  'get_low_stock_products' as function_name,
  EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'get_low_stock_products'
  ) as exists;

\echo ''

-- =====================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
\echo '7. ROW LEVEL SECURITY POLICIES...'
\echo '--------------------------------------------------------------'

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo 'RLS Status by Table:'

SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('product_mappings', 'order_references', 'customers', 'inventory_transactions', 'order_notes')
ORDER BY tablename;

\echo ''

-- =====================================================================
-- SECTION 8: INDEXES
-- =====================================================================
\echo '8. DATABASE INDEXES...'
\echo '--------------------------------------------------------------'

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('product_mappings', 'order_references', 'customers', 'inventory_transactions')
ORDER BY tablename, indexname;

\echo ''

-- =====================================================================
-- SECTION 9: TRIGGERS
-- =====================================================================
\echo '9. DATABASE TRIGGERS...'
\echo '--------------------------------------------------------------'

SELECT
  trigger_schema,
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_timing as timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''

-- =====================================================================
-- SECTION 10: DATA INTEGRITY CHECKS
-- =====================================================================
\echo '10. DATA INTEGRITY CHECKS...'
\echo '--------------------------------------------------------------'

\echo 'Checking for orphaned inventory transactions...'

SELECT
  COUNT(*) as orphaned_transactions
FROM public.inventory_transactions it
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_mappings pm
  WHERE pm.cfg_code = it.product_cfg_code
);

\echo ''
\echo 'Checking for orders without customer records...'

SELECT
  COUNT(*) as orders_without_customer
FROM public.order_references o
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c
  WHERE c.email = o.customer_email
);

\echo ''
\echo 'Checking for negative stock quantities...'

SELECT
  COUNT(*) as products_with_negative_stock
FROM public.product_mappings
WHERE stock_quantity < 0;

\echo ''
\echo 'Checking for price anomalies...'

SELECT
  COUNT(*) as products_with_zero_price
FROM public.product_mappings
WHERE price <= 0 AND is_active = true;

\echo ''

-- =====================================================================
-- SECTION 11: LOW STOCK ALERTS
-- =====================================================================
\echo '11. LOW STOCK ALERTS...'
\echo '--------------------------------------------------------------'

SELECT
  cfg_code,
  peptide_name,
  stock_quantity,
  low_stock_threshold,
  (low_stock_threshold - stock_quantity) as shortage
FROM public.product_mappings
WHERE track_inventory = true
  AND stock_quantity <= low_stock_threshold
  AND is_active = true
ORDER BY stock_quantity ASC
LIMIT 10;

\echo ''

-- =====================================================================
-- SECTION 12: RECENT ACTIVITY SUMMARY
-- =====================================================================
\echo '12. RECENT ACTIVITY (LAST 24 HOURS)...'
\echo '--------------------------------------------------------------'

SELECT
  'New Orders' as activity,
  COUNT(*) as count
FROM public.order_references
WHERE created_at >= NOW() - INTERVAL '24 hours';

SELECT
  'Inventory Adjustments' as activity,
  COUNT(*) as count
FROM public.inventory_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours';

SELECT
  'New Customers' as activity,
  COUNT(*) as count
FROM public.customers
WHERE created_at >= NOW() - INTERVAL '24 hours';

\echo ''

-- =====================================================================
-- SECTION 13: STORAGE & PERFORMANCE
-- =====================================================================
\echo '13. STORAGE & PERFORMANCE...'
\echo '--------------------------------------------------------------'

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('product_mappings', 'order_references', 'customers', 'inventory_transactions')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''

-- =====================================================================
-- SECTION 14: MISSING INVENTORY COLUMNS CHECK
-- =====================================================================
\echo '14. INVENTORY SYSTEM READINESS...'
\echo '--------------------------------------------------------------'

\echo 'Required Columns for Inventory System:'

WITH required_columns AS (
  SELECT 'stock_quantity' as col_name UNION ALL
  SELECT 'track_inventory' UNION ALL
  SELECT 'low_stock_threshold' UNION ALL
  SELECT 'peptide_id' UNION ALL
  SELECT 'strength'
)
SELECT
  rc.col_name,
  CASE
    WHEN c.column_name IS NOT NULL THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status,
  COALESCE(c.data_type, 'N/A') as data_type
FROM required_columns rc
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'product_mappings'
  AND c.column_name = rc.col_name
ORDER BY
  CASE WHEN c.column_name IS NOT NULL THEN 0 ELSE 1 END,
  rc.col_name;

\echo ''

-- =====================================================================
-- SECTION 15: RECOMMENDATIONS
-- =====================================================================
\echo '15. AUDIT RECOMMENDATIONS...'
\echo '--------------------------------------------------------------'

-- Check if inventory columns are missing
DO $$
DECLARE
  missing_cols INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_cols
  FROM (
    SELECT 'stock_quantity' as col UNION ALL
    SELECT 'track_inventory' UNION ALL
    SELECT 'low_stock_threshold'
  ) required
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_mappings'
      AND column_name = required.col
  );

  IF missing_cols > 0 THEN
    RAISE NOTICE '⚠ CRITICAL: Inventory columns are missing from product_mappings table';
    RAISE NOTICE '  → Run FINAL_INVENTORY_SETUP.sql to add required columns';
  ELSE
    RAISE NOTICE '✓ All inventory columns present';
  END IF;
END $$;

-- Check if RPC functions exist
DO $$
DECLARE
  missing_funcs INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_funcs
  FROM (
    SELECT 'adjust_inventory' as func UNION ALL
    SELECT 'get_inventory_history' UNION ALL
    SELECT 'get_low_stock_products'
  ) required
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = required.func
  );

  IF missing_funcs > 0 THEN
    RAISE NOTICE '⚠ CRITICAL: RPC functions are missing';
    RAISE NOTICE '  → Run FINAL_INVENTORY_SETUP.sql to create functions';
  ELSE
    RAISE NOTICE '✓ All RPC functions present';
  END IF;
END $$;

-- Check if inventory_transactions table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'inventory_transactions'
  ) THEN
    RAISE NOTICE '⚠ CRITICAL: inventory_transactions table is missing';
    RAISE NOTICE '  → Run FINAL_INVENTORY_SETUP.sql to create table';
  ELSE
    RAISE NOTICE '✓ inventory_transactions table exists';
  END IF;
END $$;

-- Check for orders with missing customer data
DO $$
DECLARE
  incomplete_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO incomplete_orders
  FROM public.order_references
  WHERE customer_email IS NULL
     OR customer_address IS NULL;

  IF incomplete_orders > 0 THEN
    RAISE NOTICE '⚠ WARNING: % orders have incomplete customer data', incomplete_orders;
    RAISE NOTICE '  → Review checkout form to ensure all fields are captured';
  ELSE
    RAISE NOTICE '✓ All orders have complete customer data';
  END IF;
END $$;

\echo ''
\echo '==================== AUDIT COMPLETE ===================='
\echo ''
\echo 'Summary:'
\echo '  - Review all sections above for issues'
\echo '  - Pay special attention to CRITICAL warnings'
\echo '  - Check for missing tables, columns, or functions'
\echo '  - Verify RLS policies are configured correctly'
\echo '  - Review data integrity issues'
\echo ''
\echo 'Next Steps:'
\echo '  1. Fix any CRITICAL issues first'
\echo '  2. Address WARNING items'
\echo '  3. Test inventory system functionality'
\echo '  4. Test order creation flow'
\echo '  5. Test admin dashboard'
\echo ''

-- =====================================================================
-- END OF AUDIT
-- =====================================================================
