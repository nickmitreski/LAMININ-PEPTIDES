import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logAdminAction } from './auditLog';

export interface BankDetails {
  id: string;
  bsb: string;
  account_number: string;
  account_name: string;
  bank_name: string | null;
  updated_at: string;
}

/** Fallback values used when the DB table doesn't exist yet (pre-migration). */
const FALLBACK: BankDetails = {
  id: 'fallback',
  bsb: '013-402',
  account_number: '807 892 935',
  account_name: 'MJCA Group',
  bank_name: null,
  updated_at: '1970-01-01T00:00:00Z',
};

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === '42P01') return true;
  return /relation .* does not exist/.test(error.message ?? '');
}

/**
 * Read the current bank details row. Returns a hardcoded fallback if the
 * table doesn't exist yet so the storefront never breaks pre-migration.
 *
 * Cached on the module for the page lifetime to avoid hitting Supabase on
 * every checkout render. Callers can pass `{ force: true }` to refetch.
 */
let cache: { value: BankDetails; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function getBankDetails(
  client: SupabaseClient | null = supabase,
  opts?: { force?: boolean }
): Promise<BankDetails> {
  const now = Date.now();
  if (!opts?.force && cache && now - cache.at < TTL_MS) return cache.value;
  if (!client) return FALLBACK;
  const { data, error } = await client
    .from('bank_details')
    .select('id, bsb, account_number, account_name, bank_name, updated_at')
    .eq('singleton', true)
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) {
      cache = { value: FALLBACK, at: now };
      return FALLBACK;
    }
    console.warn('[bankDetailsService] getBankDetails', error);
    cache = { value: FALLBACK, at: now };
    return FALLBACK;
  }
  const value = (data as BankDetails | null) ?? FALLBACK;
  cache = { value, at: now };
  return value;
}

/** Force-invalidate the cache. Call after a successful update. */
export function invalidateBankDetailsCache() {
  cache = null;
}

export interface BankDetailsUpdate {
  bsb: string;
  account_number: string;
  account_name: string;
  bank_name?: string | null;
}

/**
 * Update the singleton bank details row. Admin-only via RLS.
 * Writes an admin_audit_log entry on success.
 */
export async function updateBankDetails(
  id: string,
  patch: BankDetailsUpdate,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };
  // Minimal validation — BSB and account number can't be empty or wildly long.
  const bsb = patch.bsb.trim();
  const account_number = patch.account_number.trim();
  const account_name = patch.account_name.trim();
  if (!bsb || !account_number || !account_name) {
    return { success: false, error: 'BSB, account number and account name are required.' };
  }
  if (bsb.length > 16 || account_number.length > 32 || account_name.length > 100) {
    return { success: false, error: 'One or more fields are too long.' };
  }

  const { data: existing } = await client
    .from('bank_details')
    .select('id, bsb, account_number, account_name, bank_name')
    .eq('id', id)
    .maybeSingle();

  const { error } = await client
    .from('bank_details')
    .update({
      bsb,
      account_number,
      account_name,
      bank_name: patch.bank_name?.trim() || null,
    })
    .eq('id', id);

  if (error) {
    if (isMissingRelation(error)) {
      return {
        success: false,
        error: 'Bank details table not deployed yet. Apply migration 20260517180000.',
      };
    }
    console.error('[bankDetailsService] updateBankDetails', error);
    return { success: false, error: error.message };
  }

  invalidateBankDetailsCache();

  await logAdminAction(
    {
      action: 'bank_details.edit',
      target_table: 'bank_details',
      target_id: id,
      before: existing ?? null,
      after: { bsb, account_number, account_name, bank_name: patch.bank_name ?? null },
    },
    client
  );

  return { success: true };
}
