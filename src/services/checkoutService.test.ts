import { describe, expect, it, vi, beforeEach } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
const { createPaymentTracking } = vi.hoisted(() => ({
  createPaymentTracking: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
}));

vi.mock('./bankTransferPayment', () => ({
  createPaymentTracking,
}));

import { createCheckoutOrder } from './checkoutService';

const basePayload = {
  orderReference: 'LM-TEST01',
  customerEmail: 'test@example.com',
  customerName: 'Test User',
  customerPhone: '0412345678',
  customerAddress: {
    address: '1 Test St',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    country: 'Australia',
  },
  cartItems: [{ id: 'CFG-031', name: 'BPC-157', price: 89, quantity: 1 }],
  subtotal: 89,
  shipping: 11.9,
  tax: 0,
  totalAmount: 100.9,
  currency: 'AUD',
};

describe('createCheckoutOrder', () => {
  beforeEach(() => {
    invoke.mockReset();
    createPaymentTracking.mockReset();
  });

  it('uses edge function when it succeeds', async () => {
    invoke.mockResolvedValue({
      data: {
        success: true,
        trackingId: 'track-1',
        orderId: 'order-1',
        orderReference: 'LM-TEST01',
        serverTotals: { available: true, serverTotal: 100.9 },
      },
      error: null,
    });

    const result = await createCheckoutOrder(basePayload);

    expect(result.success).toBe(true);
    expect(result.via).toBe('edge');
    expect(result.trackingId).toBe('track-1');
    expect(createPaymentTracking).not.toHaveBeenCalled();
  });

  it('falls back to RPC when edge function is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      invoke.mockResolvedValue({
        data: { success: false, error: 'create_order not deployed', code: 'NOT_DEPLOYED' },
        error: null,
      });
      createPaymentTracking.mockResolvedValue({
        success: true,
        trackingId: 'legacy-1',
        serverTotals: { available: true, serverTotal: 100.9 },
      });

      const result = await createCheckoutOrder(basePayload);

      expect(result.success).toBe(true);
      expect(result.via).toBe('rpc');
      expect(result.trackingId).toBe('legacy-1');
      expect(createPaymentTracking).toHaveBeenCalledWith(basePayload);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
