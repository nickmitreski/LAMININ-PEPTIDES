-- Run in Supabase SQL Editor (Dashboard → SQL) after you create the user under
-- Authentication → Users (Email provider). Change the email in the WHERE clause
-- to match the account you use on /admin/login.
--
-- Grants admin UI access (see src/utils/adminAuth.ts: app_metadata.admin === true).
-- Alternative: Dashboard → Users → select user → edit "App Metadata" JSON → add "admin": true

UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"admin": true}'::jsonb
WHERE lower(email) = lower('admin@lamininpeplab.com.au');

-- Verify:
-- SELECT id, email, raw_app_meta_data FROM auth.users WHERE lower(email) = lower('admin@lamininpeplab.com.au');
