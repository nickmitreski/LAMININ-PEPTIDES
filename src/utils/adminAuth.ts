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
 * Configure one of:
 * 1) Supabase Dashboard → Authentication → Users → user → set App Metadata: `{ "admin": true }`
 *    (or run `supabase/admin_auth_setup.sql` in the SQL Editor for that email), or
 * 2) `VITE_ADMIN_EMAIL_ALLOWLIST` in `.env.local` (comma-separated emails, dev / transitional only).
 */
export function isSupabaseAdminUser(user: User | null | undefined): boolean {
  if (!user?.email) return false;

  const meta = user.app_metadata as Record<string, unknown> | undefined;
  if (isTruthyAdminFlag(meta?.admin)) return true;

  const allow = import.meta.env.VITE_ADMIN_EMAIL_ALLOWLIST as string | undefined;
  if (allow?.trim()) {
    const emails = allow
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return emails.includes(user.email.toLowerCase());
  }

  return false;
}
