-- Check what columns exist in product_mappings table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_mappings'
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'product_mappings';
