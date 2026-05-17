import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cancelOrder, paymentRowToOrder, type PaymentTrackingDbRow } from './supabaseService';

function makeRow(overrides: Partial<PaymentTrackingDbRow> = {}): PaymentTrackingDbRow {
  return {
    id: 'row-1',
    order_reference: 'LM-TEST1',
    payment_status: 'pending',
    customer_email: 'test@example.com',
    customer_name: 'Test User',
    customer_phone: '+61400000000',
    customer_address: {
      address: '1 Test St',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'AU',
    },
    total_amount: 250,
    cart_items: [],
    discount_code: null,
    discount_amount: null,
    admin_notes: null,
    payment_viewed_at: null,
    payment_completed_at: null,
    subtotal: 250,
    shipping: 0,
    tax: 0,
    currency: 'AUD',
    created_at: '2026-05-17T00:00:00Z',
    updated_at: '2026-05-17T00:00:00Z',
    ...overrides,
  };
}

describe('paymentRowToOrder — order items shape transform', () => {
  it('produces peptide_items with the field names OrderDetailsModal reads', () => {
    const row = makeRow({
      cart_items: [
        { id: 'bpc157', name: 'BPC-157 10mg', price: 79, quantity: 2, image: '/x.png' },
      ],
    });
    const order = paymentRowToOrder(row);
    const items = order.peptide_items as Array<Record<string, unknown>>;
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(1);

    const item = items[0];
    // The fields the modal reads:
    expect(item.peptide_display_name).toBe('BPC-157 10mg');
    expect(item.cfg_code).toBe('bpc157');
    expect(item.unit_price).toBe(79);
    expect(item.quantity).toBe(2);
    expect(item.line_total).toBe(158); // 79 * 2

    // Original keys are preserved for back-compat:
    expect(item.id).toBe('bpc157');
    expect(item.name).toBe('BPC-157 10mg');
    expect(item.price).toBe(79);
    expect(item.image).toBe('/x.png');
  });

  it('computes a sensible line_total even when source has only price/qty', () => {
    const row = makeRow({
      cart_items: [{ id: 'a', name: 'A', price: 10, quantity: 3 }],
    });
    const items = paymentRowToOrder(row).peptide_items as Array<Record<string, unknown>>;
    expect(items[0].line_total).toBe(30);
  });

  it('handles multiple cart items', () => {
    const row = makeRow({
      cart_items: [
        { id: 'a', name: 'A', price: 50, quantity: 1 },
        { id: 'b', name: 'B', price: 25, quantity: 4 },
      ],
    });
    const items = paymentRowToOrder(row).peptide_items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[1].peptide_display_name).toBe('B');
    expect(items[1].line_total).toBe(100);
  });

  it('coerces missing/invalid price or quantity to 0 without throwing', () => {
    const row = makeRow({
      // @ts-expect-error — exercise defensive coercion
      cart_items: [{ id: 'a', name: 'A', price: null, quantity: undefined }],
    });
    const items = paymentRowToOrder(row).peptide_items as Array<Record<string, unknown>>;
    expect(items[0].unit_price).toBe(0);
    expect(items[0].quantity).toBe(0);
    expect(items[0].line_total).toBe(0);
  });

  it('passes cart_items through unchanged when not an array (defensive)', () => {
    // @ts-expect-error — testing non-array path
    const row = makeRow({ cart_items: null });
    const out = paymentRowToOrder(row);
    expect(out.peptide_items).toBeNull();
  });

  it('maps customer address from nested JSON to flat columns', () => {
    const order = paymentRowToOrder(makeRow());
    expect(order.customer_city).toBe('Sydney');
    expect(order.customer_country).toBe('AU');
    expect(order.customer_postcode).toBe('2000');
  });

  it('maps order_reference to peptide_order_id', () => {
    expect(paymentRowToOrder(makeRow()).peptide_order_id).toBe('LM-TEST1');
  });
});

// -----------------------------------------------------------------------------
// cancelOrder — locks down behaviour now that admins can cancel/refund
// -----------------------------------------------------------------------------

/** Builds a chained mock that mirrors supabase-js's fluent API. */
function makeCancelClient({
  existing,
  updateError = null,
  insertCalls,
}: {
  existing: { id: string; order_reference: string; payment_status: string; admin_notes: string | null } | null;
  updateError?: { message: string } | null;
  insertCalls: Array<Record<string, unknown>>;
}): SupabaseClient {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'payment_tracking') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: updateError }),
          }),
        };
      }
      if (table === 'admin_audit_log') {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            insertCalls.push(row);
            return Promise.resolve({ error: null });
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as SupabaseClient;
}

describe('cancelOrder', () => {
  it('refuses an empty reason', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = makeCancelClient({
      existing: { id: 'r1', order_reference: 'LM-X', payment_status: 'pending', admin_notes: null },
      insertCalls: calls,
    });
    const r = await cancelOrder('r1', { reason: '  ' }, client);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/reason/i);
    expect(calls).toHaveLength(0);
  });

  it('returns failure when the order is already cancelled', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = makeCancelClient({
      existing: { id: 'r1', order_reference: 'LM-X', payment_status: 'cancelled', admin_notes: null },
      insertCalls: calls,
    });
    const r = await cancelOrder('r1', { reason: 'late' }, client);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/already cancelled/i);
  });

  it('cancels an order and writes an audit row tagged "order.cancel"', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = makeCancelClient({
      existing: { id: 'r1', order_reference: 'LM-X', payment_status: 'pending', admin_notes: null },
      insertCalls: calls,
    });
    const r = await cancelOrder('r1', { reason: 'out of stock' }, client);
    expect(r.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].action).toBe('order.cancel');
    expect(calls[0].target_table).toBe('payment_tracking');
    expect(calls[0].target_id).toBe('r1');
    expect(calls[0].note).toBe('out of stock');
    const after = calls[0].after as { payment_status: string; refunded: boolean };
    expect(after.payment_status).toBe('cancelled');
    expect(after.refunded).toBe(false);
  });

  it('marks "order.refund" when refunded=true', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const client = makeCancelClient({
      existing: { id: 'r1', order_reference: 'LM-X', payment_status: 'payment_received', admin_notes: 'prior note' },
      insertCalls: calls,
    });
    const r = await cancelOrder('r1', { reason: 'customer chargeback', refunded: true }, client);
    expect(r.success).toBe(true);
    expect(calls[0].action).toBe('order.refund');
    const after = calls[0].after as { refunded: boolean };
    expect(after.refunded).toBe(true);
  });
});
