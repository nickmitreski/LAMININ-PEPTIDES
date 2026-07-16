import { describe, expect, it, vi } from 'vitest';
import { getPaymentEventsByReference } from './ordersService';

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
