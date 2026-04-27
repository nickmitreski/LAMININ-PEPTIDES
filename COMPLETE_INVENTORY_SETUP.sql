-- =====================================================================
-- COMPLETE LAMININ INVENTORY SYSTEM SETUP
-- =====================================================================
-- Run this entire script in Supabase SQL Editor
-- Project: ytacbvfcltikxzudlkzn.supabase.co
-- =====================================================================

-- =====================================================================
-- STEP 1: Add Inventory Columns to product_mappings
-- =====================================================================

-- Add stock_quantity column (defaults to 0)
ALTER TABLE public.product_mappings
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

-- Add track_inventory column (defaults to true)
ALTER TABLE public.product_mappings
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT true;

-- Add low_stock_threshold column (defaults to 10)
ALTER TABLE public.product_mappings
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_mappings_stock
ON public.product_mappings(stock_quantity)
WHERE track_inventory = true;

CREATE INDEX IF NOT EXISTS idx_product_mappings_low_stock
ON public.product_mappings(stock_quantity, low_stock_threshold)
WHERE track_inventory = true AND stock_quantity <= low_stock_threshold;

-- =====================================================================
-- STEP 2: Create inventory_transactions Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfg_code TEXT NOT NULL REFERENCES public.product_mappings(cfg_code) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'restock', 'sale', 'adjustment', 'damage', 'return', etc.
  quantity_change INTEGER NOT NULL, -- Positive for additions, negative for subtractions
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  notes TEXT,
  created_by TEXT, -- Admin email who made the change
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB -- For additional context (supplier, batch number, etc.)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_cfg_code
ON public.inventory_transactions(cfg_code);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at
ON public.inventory_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type
ON public.inventory_transactions(transaction_type);

-- =====================================================================
-- STEP 3: Create adjust_inventory RPC Function
-- =====================================================================

CREATE OR REPLACE FUNCTION public.adjust_inventory(
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
  -- Get current stock quantity
  SELECT stock_quantity INTO v_current_quantity
  FROM public.product_mappings
  WHERE cfg_code = p_cfg_code
  FOR UPDATE; -- Lock the row to prevent race conditions

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
  SET
    stock_quantity = v_new_quantity,
    updated_at = now()
  WHERE cfg_code = p_cfg_code;

  -- Log the transaction
  INSERT INTO public.inventory_transactions (
    cfg_code,
    transaction_type,
    quantity_change,
    quantity_before,
    quantity_after,
    notes,
    created_by
  ) VALUES (
    p_cfg_code,
    p_transaction_type,
    p_quantity_change,
    v_current_quantity,
    v_new_quantity,
    p_notes,
    p_admin_email
  ) RETURNING id INTO v_transaction_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'quantity_before', v_current_quantity,
    'quantity_after', v_new_quantity
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to adjust inventory: %', SQLERRM;
END;
$$;

-- =====================================================================
-- STEP 4: Create get_inventory_history RPC Function
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_inventory_history(
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
    id,
    cfg_code,
    transaction_type,
    quantity_change,
    quantity_before,
    quantity_after,
    notes,
    created_by,
    created_at
  FROM public.inventory_transactions
  WHERE inventory_transactions.cfg_code = p_cfg_code
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- =====================================================================
-- STEP 5: Create get_low_stock_products RPC Function
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_low_stock_products()
RETURNS TABLE (
  cfg_code TEXT,
  peptide_id TEXT,
  strength TEXT,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER,
  price_aud NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    cfg_code,
    peptide_id,
    strength,
    stock_quantity,
    low_stock_threshold,
    price_aud
  FROM public.product_mappings
  WHERE
    track_inventory = true
    AND stock_quantity <= low_stock_threshold
    AND is_active = true
  ORDER BY stock_quantity ASC;
$$;

-- =====================================================================
-- STEP 6: Set Initial Stock Levels (CUSTOMIZE THESE VALUES!)
-- =====================================================================

-- Set default stock for all active products
-- Adjust these numbers based on your actual inventory!

UPDATE public.product_mappings
SET
  stock_quantity = 50,  -- Default starting stock
  track_inventory = true,
  low_stock_threshold = 10
WHERE is_active = true;

-- =====================================================================
-- STEP 7: Verify Setup
-- =====================================================================

-- Check that columns exist
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'product_mappings'
  AND column_name IN ('stock_quantity', 'track_inventory', 'low_stock_threshold')
ORDER BY column_name;

-- Check that inventory_transactions table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'inventory_transactions';

-- Check that RPC functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('adjust_inventory', 'get_inventory_history', 'get_low_stock_products')
ORDER BY routine_name;

-- Show all products with their stock levels
SELECT
  cfg_code,
  peptide_id,
  strength,
  stock_quantity,
  low_stock_threshold,
  track_inventory,
  is_active
FROM public.product_mappings
ORDER BY peptide_id, strength;

-- =====================================================================
-- SETUP COMPLETE! ✅
-- =====================================================================
--
-- What was created:
-- ✅ stock_quantity, track_inventory, low_stock_threshold columns
-- ✅ inventory_transactions table with indexes
-- ✅ adjust_inventory() RPC function
-- ✅ get_inventory_history() RPC function
-- ✅ get_low_stock_products() RPC function
-- ✅ All products set to 50 units initial stock
--
-- Next steps:
-- 1. Go to http://localhost:5173/admin/inventory
-- 2. Refresh the page
-- 3. You should now see all products with stock levels!
-- 4. Click a product and test adjusting inventory
--
-- =====================================================================
