-- Checkout uses supabase-js upsert(onConflict: 'email') → PostgREST runs INSERT or UPDATE.
-- Hardening migration added INSERT for anon but no UPDATE, so returning customers get 401/42501.

DROP POLICY IF EXISTS "Anon and users can update customers for checkout upsert" ON public.customers;

CREATE POLICY "Anon and users can update customers for checkout upsert"
  ON public.customers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) >= 5
    AND position('@' IN trim(email)) > 1
    AND position('.' IN split_part(trim(email), '@', 2)) >= 1
  );

COMMENT ON POLICY "Anon and users can update customers for checkout upsert" ON public.customers IS
  'Allows PostgREST upsert for checkout; WITH CHECK mirrors insert policy.';
