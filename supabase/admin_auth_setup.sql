-- Run in Supabase SQL Editor (Dashboard → SQL) after you create the admin user
-- under Authentication → Users (Email provider). Replace the email if needed.
--
-- Grants admin UI access when used with src/utils/adminAuth.ts (app_metadata.admin).

UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"admin": true}'::jsonb
WHERE email = 'admin@lamininpeplab.com.au';

-- Verify:
-- SELECT id, email, raw_app_meta_data FROM auth.users WHERE email = 'admin@lamininpeplab.com.au';
