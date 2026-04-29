import type { User } from '@supabase/supabase-js';

/** Accepts boolean true or common string/number shapes from JWT / API. */
function isTruthyAdminFlag(value: unknown): boolean {
  if (value === true) return true;
  if (value === 1) return true;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1' || s === 'yes';
  }
  return false;
}

/**
 * Admin access after a successful Supabase Auth sign-in.
 *
 * Set the admin flag in Supabase Dashboard → Authentication → Users → user →
 * App Metadata: `{ "admin": true }` (or run `supabase/admin_auth_setup.sql`).
 *
 * The database enforces admin access via `jwt_is_admin()` RLS policies, so
 * this client-side check is a UX gate only.
 */
export function isSupabaseAdminUser(user: User | null | undefined): boolean {
  if (!user?.email) return false;

  const meta = user.app_metadata as Record<string, unknown> | undefined;
  return isTruthyAdminFlag(meta?.admin);
}
