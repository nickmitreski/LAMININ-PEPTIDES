import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logAdminAction, getAuditLog } from './auditLog';

/** Build a minimal fake SupabaseClient with a stubbed insert chain. */
function makeClient(
  behaviour:
    | { kind: 'ok' }
    | { kind: 'missingTable' }
    | { kind: 'otherError'; code: string; message: string }
): SupabaseClient {
  const insert = vi.fn().mockImplementation(() => {
    if (behaviour.kind === 'ok') return Promise.resolve({ error: null });
    if (behaviour.kind === 'missingTable') {
      return Promise.resolve({
        error: { code: '42P01', message: 'relation "admin_audit_log" does not exist' },
      });
    }
    return Promise.resolve({
      error: { code: behaviour.code, message: behaviour.message },
    });
  });
  return {
    from: vi.fn().mockReturnValue({ insert }),
  } as unknown as SupabaseClient;
}

describe('logAdminAction', () => {
  it('returns true on successful insert', async () => {
    const client = makeClient({ kind: 'ok' });
    const ok = await logAdminAction(
      { action: 'order.mark_paid', target_table: 'payment_tracking', target_id: 'abc' },
      client
    );
    expect(ok).toBe(true);
  });

  it('returns false silently when the table does not exist (pre-migration)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const client = makeClient({ kind: 'missingTable' });
      const ok = await logAdminAction(
        { action: 'order.mark_paid', target_table: 'payment_tracking', target_id: 'abc' },
        client
      );
      expect(ok).toBe(false);
      // Should NOT log a warning for the missing-table case — that's the whole point.
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('logs (but does not throw) when an unexpected error occurs', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const client = makeClient({
        kind: 'otherError',
        code: '42501',
        message: 'permission denied for table admin_audit_log',
      });
      const ok = await logAdminAction(
        { action: 'order.mark_paid', target_table: 'payment_tracking', target_id: 'abc' },
        client
      );
      expect(ok).toBe(false);
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('returns false when client is null', async () => {
    const ok = await logAdminAction(
      { action: 'order.mark_paid', target_table: 'payment_tracking', target_id: 'abc' },
      null
    );
    expect(ok).toBe(false);
  });
});

describe('getAuditLog', () => {
  it('returns [] gracefully when table is missing', async () => {
    const select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42P01', message: 'relation "admin_audit_log" does not exist' },
            }),
          }),
        }),
      }),
    });
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as SupabaseClient;

    const rows = await getAuditLog('payment_tracking', 'abc', client);
    expect(rows).toEqual([]);
  });
});
