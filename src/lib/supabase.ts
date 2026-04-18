import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  url?.trim() && anonKey?.trim()
);

const globalLaminin = globalThis as typeof globalThis & {
  __LAMININ_STOREFRONT_SUPABASE__?: SupabaseClient;
};

function createStorefrontClient(): SupabaseClient {
  return createClient(url!, anonKey!, {
    auth: {
      persistSession: false,
      storageKey: 'laminin-storefront-supabase-v1',
    },
  });
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? (globalLaminin.__LAMININ_STOREFRONT_SUPABASE__ ??=
      createStorefrontClient())
  : null;
