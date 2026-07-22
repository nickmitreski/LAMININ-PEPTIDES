import { describe, expect, it, vi } from 'vitest';
import { getPaymentEventsByReference, replaceAdminOrderLines } from './ordersService';

describe('getPaymentEventsByReference', () => {
  it('returns empty when client is null', async () => {
    expect(await getPaymentEventsByReference('LM-123', null)).toEqual([]);
  });

  it('returns payment events when order and attempts exist', async () => {
    const events = [
      {
        id: 'ev-1',
        payment_attempt_id: 'pa-1',
        event_type: 'order_created',
        payload: { order_reference: 'LM-123' },
        created_at: '2026-07-01T00:00:00Z',
      },
    ];

    const client = {
      from: vi.fn((table: string) => {
        if (table === 'orders') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'order-1' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'payment_attempts') {
          return {
            select: () => ({
              eq: async () => ({ data: [{ id: 'pa-1' }], error: null }),
            }),
          };
        }
        if (table === 'payment_events') {
          return {
            select: () => ({
              in: () => ({
                order: async () => ({ data: events, error: null }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await getPaymentEventsByReference(
      'LM-123',
      client as unknown as import('@supabase/supabase-js').SupabaseClient
    );
    expect(result).toHaveLength(1);
    expect(result[0].event_type).toBe('order_created');
  });
});

describe('replaceAdminOrderLines', () => {
  it('sends validated lines and reason to the admin RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        success: true,
        subtotal: 210.5,
        shipping: 11.9,
        tax: 0,
        discount_amount: 0,
        total_amount: 222.4,
      },
      error: null,
    });
    const client = { rpc };
    const lines = [
      {
        id: 'CFG-031',
        name: 'BPC-157 10mg',
        quantity: 2,
        price: 99,
        line_total: 198,
        line_type: 'catalog' as const,
        note: null,
      },
      {
        id: 'CUSTOM-2',
        name: 'Custom laboratory handling',
        quantity: 1,
        price: 12.5,
        line_total: 12.5,
        line_type: 'custom' as const,
        note: 'Owner approved',
      },
    ];

    const result = await replaceAdminOrderLines(
      'tracking-1',
      lines,
      'Added laboratory handling',
      client as unknown as import('@supabase/supabase-js').SupabaseClient
    );

    expect(rpc).toHaveBeenCalledWith('admin_replace_order_lines', {
      p_tracking_id: 'tracking-1',
      p_lines: lines,
      p_reason: 'Added laboratory handling',
    });
    expect(result).toEqual({
      success: true,
      subtotal: 210.5,
      shipping: 11.9,
      tax: 0,
      discountAmount: 0,
      totalAmount: 222.4,
    });
  });

  it('rejects missing client or reason before calling Supabase', async () => {
    expect(
      await replaceAdminOrderLines('tracking-1', [], 'reason', null)
    ).toEqual({
      success: false,
      error: 'No database client',
    });

    const rpc = vi.fn();
    const result = await replaceAdminOrderLines(
      'tracking-1',
      [],
      ' ',
      { rpc } as unknown as import('@supabase/supabase-js').SupabaseClient
    );

    expect(result).toEqual({
      success: false,
      error: 'A reason is required when changing order lines.',
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
