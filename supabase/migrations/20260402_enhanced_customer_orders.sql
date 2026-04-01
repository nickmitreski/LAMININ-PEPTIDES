-- Enhanced Customer Order Schema
-- This migration adds detailed customer contact information storage

-- ============================================================================
-- 1. Add shipping/contact fields to order_references table
-- ============================================================================
ALTER TABLE public.order_references
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS customer_city TEXT,
ADD COLUMN IF NOT EXISTS customer_state TEXT,
ADD COLUMN IF NOT EXISTS customer_postcode TEXT,
ADD COLUMN IF NOT EXISTS customer_country TEXT DEFAULT 'Australia',
ADD COLUMN IF NOT EXISTS customer_first_name TEXT,
ADD COLUMN IF NOT EXISTS customer_last_name TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_order_refs_customer_phone ON public.order_references(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_refs_customer_city ON public.order_references(customer_city);

-- ============================================================================
-- 2. Update customers table to include shipping address
-- ============================================================================
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Australia',
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_customers_total_orders ON public.customers(total_orders);
CREATE INDEX IF NOT EXISTS idx_customers_last_order ON public.customers(last_order_date);

-- ============================================================================
-- 3. Create function to update customer stats when order is created
-- ============================================================================
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer record with order stats
  UPDATE public.customers
  SET
    total_orders = total_orders + 1,
    total_spent = total_spent + COALESCE(NEW.total_price, 0),
    last_order_date = NEW.created_at,
    -- Update address if provided in order and not already set
    address = COALESCE(address, NEW.customer_address),
    city = COALESCE(city, NEW.customer_city),
    state = COALESCE(state, NEW.customer_state),
    postcode = COALESCE(postcode, NEW.customer_postcode),
    country = COALESCE(country, NEW.customer_country),
    phone = COALESCE(phone, NEW.customer_phone),
    updated_at = NOW()
  WHERE email = NEW.customer_email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.order_references;

CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT ON public.order_references
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- ============================================================================
-- 4. Create admin notes table for internal communication
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.order_references(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON public.order_notes(order_id);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage order notes" ON public.order_notes;
CREATE POLICY "Admins can manage order notes" ON public.order_notes
  FOR ALL USING (true);

COMMENT ON TABLE public.order_notes IS 'Internal admin notes for orders';
