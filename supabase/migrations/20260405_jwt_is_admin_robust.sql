-- Fix admin RLS when jwt_is_admin() misses app_metadata.admin (boolean vs text, path, etc.)
-- Run in SQL Editor if order status updates still fail after setting raw_app_meta_data.

CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT CASE
    WHEN auth.jwt() IS NULL THEN false
    ELSE
      COALESCE(
        (to_jsonb(auth.jwt()) #> '{app_metadata,admin}') = 'true'::jsonb,
        false
      )
      OR COALESCE(
        lower(nullif(trim(to_jsonb(auth.jwt()) #>> '{app_metadata,admin}'), '')) IN (
          'true',
          't',
          '1',
          'yes'
        ),
        false
      )
  END;
$$;

REVOKE ALL ON FUNCTION public.jwt_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_is_admin() TO authenticated;

COMMENT ON FUNCTION public.jwt_is_admin() IS
  'True if JWT app_metadata.admin is JSON true or string true/t/1/yes.';
