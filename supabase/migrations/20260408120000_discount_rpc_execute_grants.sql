-- Allow anon/authenticated callers to run discount RPCs from the storefront (Supabase REST + PostgREST).
-- Without this, validation / redeem may fail permission checks depending on DB defaults.

GRANT EXECUTE ON FUNCTION public.validate_discount_code(TEXT, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_discount_code(UUID, TEXT, TEXT, NUMERIC) TO anon, authenticated;
