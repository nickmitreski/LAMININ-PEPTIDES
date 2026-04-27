-- =====================================================================
-- CREATE RPC FUNCTIONS FOR INVENTORY MANAGEMENT
-- =====================================================================
-- Run FORCE_DROP_FUNCTIONS.sql FIRST, then run this script
-- Project: ytacbvfcltikxzudlkzn.supabase.co
-- =====================================================================

-- =====================================================================
-- FUNCTION 1: adjust_inventory
-- Adjusts stock quantity and logs the transaction
-- =====================================================================

CREATE FUNCTION public.adjust_inventory(
  p_cfg_code TEXT,
  p_quantity_change INTEGER,
  p_transaction_type TEXT,
  p_notes TEXT DEFAULT NULL,
  p_admin_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current stock quantity with row lock
  SELECT stock_quantity INTO v_current_quantity
  FROM public.product_mappings
  WHERE cfg_code = p_cfg_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_cfg_code;
  END IF;

  -- Calculate new quantity
  v_new_quantity := v_current_quantity + p_quantity_change;

  -- Prevent negative stock
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Cannot reduce stock below 0. Current: %, Change: %', v_current_quantity, p_quantity_change;
  END IF;

  -- Update product stock
  UPDATE public.product_mappings
  SET stock_quantity = v_new_quantity, updated_at = now()
  WHERE cfg_code = p_cfg_code;

  -- Log the transaction
  INSERT INTO public.inventory_transactions (
    cfg_code, transaction_type, quantity_change,
    quantity_before, quantity_after, notes, created_by
  ) VALUES (
    p_cfg_code, p_transaction_type, p_quantity_change,
    v_current_quantity, v_new_quantity, p_notes, p_admin_email
  ) RETURNING id INTO v_transaction_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'quantity_before', v_current_quantity,
    'quantity_after', v_new_quantity
  );
END;
$$;

-- =====================================================================
-- FUNCTION 2: get_inventory_history
-- Retrieves transaction history for a product
-- =====================================================================

CREATE FUNCTION public.get_inventory_history(
  p_cfg_code TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  cfg_code TEXT,
  transaction_type TEXT,
  quantity_change INTEGER,
  quantity_before INTEGER,
  quantity_after INTEGER,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id, cfg_code, transaction_type, quantity_change,
    quantity_before, quantity_after, notes, created_by, created_at
  FROM public.inventory_transactions
  WHERE inventory_transactions.cfg_code = p_cfg_code
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- =====================================================================
-- FUNCTION 3: get_low_stock_products
-- Returns products below their low stock threshold
-- =====================================================================

CREATE FUNCTION public.get_low_stock_products()
RETURNS TABLE (
  cfg_code TEXT,
  peptide_name TEXT,
  protein_name TEXT,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER,
  price NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    cfg_code, peptide_name, protein_name,
    stock_quantity, low_stock_threshold, price
  FROM public.product_mappings
  WHERE track_inventory = true
    AND stock_quantity <= low_stock_threshold
    AND is_active = true
  ORDER BY stock_quantity ASC;
$$;

-- =====================================================================
-- SET INITIAL STOCK LEVELS
-- =====================================================================

UPDATE public.product_mappings
SET stock_quantity = 50
WHERE is_active = true;

-- =====================================================================
-- VERIFY SETUP
-- =====================================================================

SELECT 'Functions created successfully:' as status;
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('adjust_inventory', 'get_inventory_history', 'get_low_stock_products')
ORDER BY routine_name;

SELECT 'Stock levels updated:' as status;
SELECT cfg_code, peptide_name, stock_quantity
FROM public.product_mappings
WHERE is_active = true
ORDER BY peptide_name
LIMIT 5;

-- =====================================================================
-- SETUP COMPLETE! ✅
-- =====================================================================
