import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Admin dashboard uses the shared browser client (`./supabase`). Writes still depend on RLS
 * (JWT `app_metadata.role = 'admin'`). One client = one GoTrueClient — avoids supabase-js
 * "Multiple GoTrueClient instances" warnings in dev.
 */
export function getAdminSupabase(): SupabaseClient | null {
  return isSupabaseConfigured ? supabase : null;
}

/**
 * Verify that the client has a valid, non-expired session before performing
 * a sensitive operation. Returns the authenticated client or null if the session
 * is invalid (forces re-login).
 */
export async function getVerifiedAdminSupabase(): Promise<SupabaseClient | null> {
  const client = getAdminSupabase();
  if (!client) return null;

  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error || !session) {
    console.warn('[admin] Session expired or invalid — clearing admin state');
    await client.auth.signOut();
    return null;
  }

  return client;
}
