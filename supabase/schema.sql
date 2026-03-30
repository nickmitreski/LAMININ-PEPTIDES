-- Laminin Peptide Lab - Supabase Schema
-- Run this in your Supabase SQL Editor: https://ytacbvfcltikxzudlkzn.supabase.co

-- ============================================================================
-- 1. CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;
CREATE POLICY "Anyone can create customers" ON public.customers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read customers" ON public.customers;
CREATE POLICY "Anyone can read customers" ON public.customers
  FOR SELECT USING (true);

-- ============================================================================
-- 2. ORDER REFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_order_id TEXT UNIQUE NOT NULL,
  protein_store_order_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  peptide_items JSONB NOT NULL,
  protein_items JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_refs_peptide_id ON public.order_references(peptide_order_id);
CREATE INDEX IF NOT EXISTS idx_order_refs_customer_email ON public.order_references(customer_email);
CREATE INDEX IF NOT EXISTS idx_order_refs_status ON public.order_references(status);

ALTER TABLE public.order_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create order references" ON public.order_references;
CREATE POLICY "Anyone can create order references" ON public.order_references
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read order references" ON public.order_references;
CREATE POLICY "Anyone can read order references" ON public.order_references
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update order status" ON public.order_references;
CREATE POLICY "Anyone can update order status" ON public.order_references
  FOR UPDATE USING (true);

-- ============================================================================
-- 3. PRODUCT MAPPINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfg_code TEXT UNIQUE NOT NULL,
  peptide_name TEXT NOT NULL,
  protein_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_mappings_cfg ON public.product_mappings(cfg_code);
CREATE INDEX IF NOT EXISTS idx_product_mappings_active ON public.product_mappings(is_active);

ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read product mappings" ON public.product_mappings;
CREATE POLICY "Anyone can read product mappings" ON public.product_mappings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert product mappings" ON public.product_mappings;
CREATE POLICY "Anyone can insert product mappings" ON public.product_mappings
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 4. SEED DATA - Product Mappings
-- ============================================================================
INSERT INTO public.product_mappings (cfg_code, peptide_name, protein_name, price, is_active)
VALUES
  ('CFG-001', 'CJC-1295 (no DAC) 10mg', 'CJC-1295 (no DAC)', 119.00, true),
  ('CFG-002', 'Melanotan-1 10mg', 'Melanotan-1', 69.00, true),
  ('CFG-003', 'Melanotan-2 10mg', 'Melanotan-2', 69.00, true),
  ('CFG-004', 'KPV 10mg', 'KPV', 79.00, true),
  ('CFG-005', 'CJC-1295 + Ipamorelin 20mg', 'CJC-1295 + Ipamorelin', 179.00, true),
  ('CFG-006', 'Epithalon 50mg', 'Epithalon', 179.00, true),
  ('CFG-009', '5-Amino-1MQ 10mg', '5-Amino-1MQ', 99.00, true),
  ('CFG-010', 'BPC-157 + TB-500 20mg', 'BPC-157 + TB-500 Blend', 149.00, true),
  ('CFG-011', 'Selank 10mg', 'Selank', 79.00, true),
  ('CFG-012', 'SS-31 50mg', 'SS-31', 249.00, true),
  ('CFG-015', 'GLOW 70mg', 'GLOW', 179.00, true),
  ('CFG-016', 'GHK-Cu 100mg', 'GHK-Cu', 109.00, true),
  ('CFG-017', 'IGF-1 LR3 1mg', 'IGF-1 LR3', 139.00, true),
  ('CFG-019', 'Cerebrolysin 60mg', 'Cerebrolysin', 89.00, true),
  ('CFG-020', 'TB-500 10mg', 'TB-500', 109.00, true),
  ('CFG-021', 'MOTS-c 40mg', 'MOTS-c', 149.00, true),
  ('CFG-022', 'FOXO4-DRI 10mg', 'FOXO4-DRI', 399.00, true),
  ('CFG-023', 'Retatrutide 10mg', 'Retatrutide', 149.00, true),
  ('CFG-026', 'Glutathione 1500mg', 'Glutathione', 89.00, true),
  ('CFG-027', 'Acetic Acid Water 10ml', 'Acetic Acid Water', 19.00, true),
  ('CFG-028', 'Bacteriostatic Water 3ml', 'Bacteriostatic Water', 5.00, true),
  ('CFG-029', 'ARA-290 10mg', 'ARA-290', 99.00, true),
  ('CFG-030', 'Ipamorelin 10mg', 'Ipamorelin', 89.00, true),
  ('CFG-031', 'BPC-157 10mg', 'BPC-157', 99.00, true),
  ('CFG-032', 'NAD+ 1000mg', 'NAD+', 169.00, true),
  ('CFG-034', 'Semax 10mg', 'Semax', 79.00, true),
  ('CFG-035', 'KLOW 80mg', 'KLOW', 189.00, true)
ON CONFLICT (cfg_code) DO NOTHING;

-- ============================================================================
-- DONE! Now add your credentials to .env.local:
-- ============================================================================
-- VITE_SUPABASE_URL=https://ytacbvfcltikxzudlkzn.supabase.co
-- VITE_SUPABASE_ANON_KEY=sb_publishable_jRLtLGh7uslmqubJ_qQY7w_ogbknh7D
