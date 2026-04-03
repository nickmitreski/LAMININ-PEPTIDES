-- Run once in LAMIN Supabase → SQL (as admin). Creates a row secure-checkout-init can attach to.
-- Then: ./scripts/smoke-secure-checkout.sh  (uses PEP-20991231-SMK1 by default)

INSERT INTO public.order_references (
  peptide_order_id,
  customer_email,
  customer_name,
  peptide_items,
  protein_items,
  total_price,
  status
) VALUES (
  'PEP-20991231-SMK1',
  'smoke-test@example.com',
  'Smoke Test',
  '[{"peptide_display_name":"Smoke line","cfg_code":"SMK1","unit_price":99.5,"line_total":99.5}]'::jsonb,
  '[{"protein_name":"Smoke protein"}]'::jsonb,
  99.50,
  'pending'
)
ON CONFLICT (peptide_order_id) DO UPDATE SET
  customer_email = EXCLUDED.customer_email,
  total_price = EXCLUDED.total_price,
  updated_at = now();
