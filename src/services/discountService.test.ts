import { describe, expect, it, vi, beforeEach } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('../lib/supabase', () => ({
  supabase: { rpc },
}));

import { redeemDiscountCode } from './discountService';

describe('redeemDiscountCode', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('returns success when RPC returns { success: true }', async () => {
    rpc.mockResolvedValue({ data: { success: true }, error: null });

    const out = await redeemDiscountCode({
      discountCodeId: 'dc-1',
      orderReference: 'ORD-100',
      customerEmail: 'a@b.com',
      discountAmount: 25,
    });

    expect(out).toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith('redeem_discount_code', {
      p_discount_code_id: 'dc-1',
      p_order_reference: 'ORD-100',
      p_customer_email: 'a@b.com',
      p_discount_amount: 25,
    });
  });

  it('returns failure when RPC returns error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      rpc.mockResolvedValue({
        data: null,
        error: { message: 'permission denied' },
      });

      const out = await redeemDiscountCode({
        discountCodeId: 'dc-1',
        orderReference: 'ORD-100',
        discountAmount: 10,
      });

      expect(out.success).toBe(false);
      // Production code appends the RPC error code (or 'network' when missing)
      // to aid debugging — see services/discountService.ts:81.
      expect(out.error).toMatch(/^Could not redeem discount \(.+\)$/);
    } finally {
      errSpy.mockRestore();
    }
  });

  it('maps declined RPC result with error message', async () => {
    rpc.mockResolvedValue({
      data: { success: false, error: 'Already redeemed' },
      error: null,
    });

    const out = await redeemDiscountCode({
      discountCodeId: 'dc-1',
      orderReference: 'ORD-100',
      discountAmount: 10,
    });

    expect(out).toEqual({ success: false, error: 'Already redeemed' });
  });

  it('returns invalid response when data has no boolean success', async () => {
    rpc.mockResolvedValue({ data: { foo: 1 }, error: null });

    const out = await redeemDiscountCode({
      discountCodeId: 'dc-1',
      orderReference: 'ORD-100',
      discountAmount: 10,
    });

    expect(out).toEqual({ success: false, error: 'Invalid response from redeem' });
  });
});
