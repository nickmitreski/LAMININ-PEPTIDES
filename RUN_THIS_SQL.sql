-- =====================================================================
-- ADMIN CUSTOMER DELETION - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor, then click RUN
-- URL: https://ytacbvfcltikxzudlkzn.supabase.co/project/ytacbvfcltikxzudlkzn/sql/new
-- =====================================================================

-- 1. Create function to delete customer and all related data
CREATE OR REPLACE FUNCTION public.delete_customer_and_orders(
  p_customer_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_orders_deleted INTEGER := 0;
  v_notes_deleted INTEGER := 0;
  v_customer_deleted BOOLEAN := false;
BEGIN
  -- Get customer ID
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE email = p_customer_email;

  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Customer not found',
      'email', p_customer_email
    );
  END IF;

  -- Delete order notes first (if they reference orders by UUID)
  DELETE FROM public.order_notes
  WHERE order_id IN (
    SELECT id FROM public.order_references
    WHERE customer_email = p_customer_email
  );

  GET DIAGNOSTICS v_notes_deleted = ROW_COUNT;

  -- Delete all orders for this customer
  DELETE FROM public.order_references
  WHERE customer_email = p_customer_email;

  GET DIAGNOSTICS v_orders_deleted = ROW_COUNT;

  -- Delete the customer record
  DELETE FROM public.customers
  WHERE email = p_customer_email;

  GET DIAGNOSTICS v_customer_deleted = ROW_COUNT;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'customer_email', p_customer_email,
    'customer_id', v_customer_id,
    'orders_deleted', v_orders_deleted,
    'notes_deleted', v_notes_deleted,
    'customer_deleted', v_customer_deleted > 0
  );
END;
$$;

-- 2. Create function to delete individual order
CREATE OR REPLACE FUNCTION public.delete_order(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notes_deleted INTEGER := 0;
  v_order_deleted BOOLEAN := false;
  v_order_email TEXT;
BEGIN
  -- Get order email first
  SELECT customer_email INTO v_order_email
  FROM public.order_references
  WHERE id = p_order_id;

  IF v_order_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found',
      'order_id', p_order_id
    );
  END IF;

  -- Delete order notes
  DELETE FROM public.order_notes
  WHERE order_id = p_order_id;

  GET DIAGNOSTICS v_notes_deleted = ROW_COUNT;

  -- Delete the order
  DELETE FROM public.order_references
  WHERE id = p_order_id;

  GET DIAGNOSTICS v_order_deleted = ROW_COUNT;

  -- Update customer stats (decrease total_orders and total_spent)
  UPDATE public.customers
  SET
    total_orders = GREATEST(0, total_orders - 1),
    updated_at = NOW()
  WHERE email = v_order_email;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'customer_email', v_order_email,
    'notes_deleted', v_notes_deleted,
    'order_deleted', v_order_deleted > 0
  );
END;
$$;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.delete_customer_and_orders TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_order TO anon, authenticated;

-- 4. Add RLS policies for deletion
DROP POLICY IF EXISTS "Allow delete order references" ON public.order_references;
CREATE POLICY "Allow delete order references" ON public.order_references
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow delete customers" ON public.customers;
CREATE POLICY "Allow delete customers" ON public.customers
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow delete order notes" ON public.order_notes;
CREATE POLICY "Allow delete order notes" ON public.order_notes
  FOR DELETE USING (true);

-- 5. Verify functions were created
SELECT
  routine_name,
  routine_type,
  'Created successfully' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('delete_customer_and_orders', 'delete_order')
ORDER BY routine_name;

-- =====================================================================
-- DONE! You should see 2 functions listed above
-- =====================================================================
