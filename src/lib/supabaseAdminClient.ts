import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './supabase';

/**
 * Separate client for admin UI: persists the Supabase Auth session in localStorage
 * under a dedicated key so it does not mix with the storefront client
 * (`src/lib/supabase.ts`, persistSession: false).
 *
 * SECURITY NOTE: This client uses the anon key. All write operations are protected
 * by Row Level Security (RLS) policies that check `auth.jwt() -> app_metadata ->> 'role' = 'admin'`.
 * For higher security, consider proxying sensitive operations (delete, payment marking)
 * through a Supabase Edge Function that uses the service-role key and adds additional
 * audit logging. The client-side auth + RLS approach is sufficient for most use cases.
 */
let adminClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (adminClient) return adminClient;

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  adminClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      storageKey: 'laminin-admin-supabase-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return adminClient;
}

/**
 * Verify that the admin client has a valid, non-expired session before performing
 * a sensitive operation. Returns the authenticated client or null if the session
 * is invalid (forces re-login).
 */
export async function getVerifiedAdminSupabase(): Promise<SupabaseClient | null> {
  const client = getAdminSupabase();
  if (!client) return null;

  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) {
    console.warn('[admin] Session expired or invalid — clearing admin state');
    await client.auth.signOut();
    return null;
  }

  return client;
}
