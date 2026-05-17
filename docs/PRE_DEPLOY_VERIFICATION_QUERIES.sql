-- =====================================================================
-- Pre-deploy verification queries
-- =====================================================================
-- Run this BEFORE applying the 2026-05-17 migration batch to capture the
-- current state.  Save each result to a text file so you can diff after.
--
-- Then run it AGAIN after every migration step and diff the output.  Any
-- unexpected change is a signal to stop and investigate.

-- 1. Row counts (these should NOT change)
SELECT 'payment_tracking'        AS table, COUNT(*) AS rows FROM public.payment_tracking
UNION ALL
SELECT 'customers',               COUNT(*) FROM public.customers
UNION ALL
SELECT 'product_mappings',        COUNT(*) FROM public.product_mappings
UNION ALL
SELECT 'discount_codes',          COUNT(*) FROM public.discount_codes
UNION ALL
SELECT 'order_references',        COUNT(*) FROM public.order_references
UNION ALL
-- These may not exist pre-migration — comment out if they error.
SELECT 'order_status_history',    COUNT(*) FROM public.order_status_history
UNION ALL
SELECT 'admin_audit_log',         COUNT(*) FROM public.admin_audit_log
UNION ALL
SELECT 'bank_details',            COUNT(*) FROM public.bank_details;

-- 2. Functions present (compare pre vs post)
SELECT proname, pronargs
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace
   AND proname IN (
     'upsert_payment_tracking',
     'lookup_order_by_ref_and_email',
     'mark_payment_received',
     'get_payment_tracking_by_reference',
     'mark_payment_instructions_viewed',
     'redeem_discount_code',
     'validate_discount_code',
     'upsert_checkout_customer',
     'express_shipping_aud',
     'checkout_gst_amount',
     '_recompute_order_totals',
     'log_payment_status_change',
     'log_bank_details_change',
     'touch_bank_details',
     'touch_payment_tracking_updated_at',
     'jwt_is_admin'
   )
 ORDER BY proname;

-- 3. Triggers on payment_tracking
SELECT trigger_name, event_manipulation, action_timing
  FROM information_schema.triggers
 WHERE event_object_schema = 'public'
   AND event_object_table IN ('payment_tracking', 'bank_details')
 ORDER BY event_object_table, trigger_name;

-- 4. RLS policies that matter
SELECT schemaname, tablename, policyname, cmd
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN (
     'payment_tracking',
     'order_status_history',
     'admin_audit_log',
     'bank_details',
     'bank_details_history',
     'customers',
     'discount_codes',
     'order_references',
     'product_mappings'
   )
 ORDER BY tablename, cmd, policyname;

-- 5. Recent orders (so you can verify they still exist post-migration)
SELECT id, order_reference, payment_status, customer_email, total_amount, created_at
  FROM public.payment_tracking
 ORDER BY created_at DESC
 LIMIT 5;

-- 6. Confirm realtime publication includes the table (needed for live updates)
SELECT pubname, schemaname, tablename
  FROM pg_publication_tables
 WHERE pubname = 'supabase_realtime'
   AND schemaname = 'public'
   AND tablename = 'payment_tracking';
-- Expect: one row.  If missing, run:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_tracking;

-- 7. Active sessions / queries (just to know what else is happening)
SELECT pid, usename, application_name, state, query_start, LEFT(query, 80) AS q
  FROM pg_stat_activity
 WHERE datname = current_database()
   AND state != 'idle'
   AND pid != pg_backend_pid()
 ORDER BY query_start DESC;
