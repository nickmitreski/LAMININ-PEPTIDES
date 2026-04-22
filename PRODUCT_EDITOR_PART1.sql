-- =====================================================================
-- PRODUCT EDITOR SETUP - PART 1: Add columns to product_mappings
-- =====================================================================
-- Run this first to add missing columns to the existing table

ALTER TABLE public.product_mappings
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS peptide_id TEXT,
ADD COLUMN IF NOT EXISTS strength TEXT;

-- Add index for peptide_id
CREATE INDEX IF NOT EXISTS idx_product_mappings_peptide_id ON public.product_mappings(peptide_id);

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_mappings'
ORDER BY column_name;
