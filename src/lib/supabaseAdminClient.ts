import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './supabase';

/**
 * Separate client for admin UI: persists the Supabase Auth session in localStorage
 * under a dedicated key so it does not mix with the storefront client
 * (`src/lib/supabase.ts`, persistSession: false).
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
