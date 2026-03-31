import type { User } from '@supabase/supabase-js';

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
  if (meta?.admin === true) return true;

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
