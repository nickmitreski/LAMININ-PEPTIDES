import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Lightweight wrapper around the admin_audit_log table.
 *
 * Conventions
 *   `action` is `<entity>.<verb>` — e.g. `order.mark_paid`, `customer.edit`,
 *   `product.delete`, `order.refund`, `order.cancel`. Use past-tense verbs.
 *
 *   `target_table` matches the underlying DB table (`payment_tracking`,
 *   `customers`, `product_mappings`, `discount_codes`). Useful for "show
 *   me everything that happened to row X" queries.
 *
 *   `target_id` is the row's primary key as a string (uuid or text).
 *
 *   `before` / `after` are jsonb snapshots — keep them shallow and
 *   non-sensitive. Don't shove secrets (tokens, full card data) in here.
 *
 * Graceful degradation
 *   The table may not exist yet on the live project (migration
 *   20260517120000 not applied). All helpers silently swallow that
 *   specific error so calling code can always `await logAdminAction(...)`
 *   without try/catch noise. Other errors are logged to console for
 *   diagnostics but never thrown — audit logging must never break the
 *   primary admin action.
 */

export interface AuditLogInput {
  action: string;
  target_table: string;
  target_id?: string | null;
  before?: unknown;
  after?: unknown;
  note?: string;
}

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === '42P01') return true;
  return /relation .* does not exist/.test(error.message ?? '');
}

/**
 * Write a single audit row. Returns true on success, false on any failure.
 * Never throws.
 *
 * Pass `client` (the admin-scoped client from `getAdminSupabase()`) when
 * calling from an admin page — RLS requires the JWT `is_admin` claim for
 * INSERT.
 */
export async function logAdminAction(
  input: AuditLogInput,
  client: SupabaseClient | null = supabase
): Promise<boolean> {
  if (!client) return false;
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    const { error } = await client.from('admin_audit_log').insert({
      action: input.action,
      target_table: input.target_table,
      target_id: input.target_id ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      note: input.note ?? null,
      user_agent: ua,
    });
    if (error) {
      if (isMissingRelation(error)) return false; // migration not applied yet — silent
      console.warn('[auditLog] insert failed', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[auditLog] exception', err);
    return false;
  }
}

export interface AuditLogRow {
  id: string;
  actor: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  user_agent: string | null;
  note: string | null;
  created_at: string;
}

/**
 * Fetch audit history for a given row. Returns [] when the table doesn't
 * exist yet (pre-migration) or on any error.
 */
export async function getAuditLog(
  target_table: string,
  target_id: string,
  client: SupabaseClient | null = supabase,
  limit = 50
): Promise<AuditLogRow[]> {
  if (!client) return [];
  const { data, error } = await client
    .from('admin_audit_log')
    .select('*')
    .eq('target_table', target_table)
    .eq('target_id', target_id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingRelation(error)) return [];
    console.warn('[auditLog] getAuditLog', error);
    return [];
  }
  return (data as AuditLogRow[]) ?? [];
}

export interface AuditLogFilters {
  /** Substring match on `action` (e.g. "order." or "delete"). */
  action?: string;
  /** Exact match on `target_table`. */
  targetTable?: string;
  /** Exact match on `actor`. */
  actor?: string;
  /** ISO-string lower bound on `created_at` (inclusive). */
  since?: string;
}

/** Paginated audit-log browse — for the /admin/audit page. */
export async function listAuditLog(
  filters: AuditLogFilters,
  client: SupabaseClient | null = supabase,
  limit = 100,
  offset = 0
): Promise<{ rows: AuditLogRow[]; missingTable: boolean }> {
  if (!client) return { rows: [], missingTable: false };
  let q = client.from('admin_audit_log').select('*');
  if (filters.action) q = q.ilike('action', `%${filters.action}%`);
  if (filters.targetTable) q = q.eq('target_table', filters.targetTable);
  if (filters.actor) q = q.eq('actor', filters.actor);
  if (filters.since) q = q.gte('created_at', filters.since);
  const { data, error } = await q
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    if (isMissingRelation(error)) return { rows: [], missingTable: true };
    console.warn('[auditLog] listAuditLog', error);
    return { rows: [], missingTable: false };
  }
  return { rows: (data as AuditLogRow[]) ?? [], missingTable: false };
}
