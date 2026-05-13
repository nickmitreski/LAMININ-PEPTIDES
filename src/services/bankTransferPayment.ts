import { supabase } from '../lib/supabase';

export interface BankTransferPaymentData {
  orderReference: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerAddress: {
    address: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  totalAmount: number;
  currency?: string;
  discountCode?: string | null;
  discountAmount?: number;
}

/**
 * Create or update payment tracking record when customer checks out
 */
export async function createPaymentTracking(
  data: BankTransferPaymentData
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Guard against accidental overwrites: if a record with this order reference
    // already exists and is past the pending state, don't upsert over it.
    const { data: existing } = await supabase
      .from('payment_tracking')
      .select('id, payment_status')
      .eq('order_reference', data.orderReference)
      .maybeSingle();

    if (existing && existing.payment_status !== 'pending') {
      return {
        success: false,
        error: `Order ${data.orderReference} already exists with status "${existing.payment_status}".`,
      };
    }

    const { data: result, error } = await supabase.rpc('upsert_payment_tracking', {
      p_order_reference: data.orderReference,
      p_customer_email: data.customerEmail,
      p_customer_name: data.customerName,
      p_customer_phone: data.customerPhone,
      p_customer_address: data.customerAddress,
      p_cart_items: data.cartItems,
      p_subtotal: data.subtotal,
      p_shipping: data.shipping,
      p_tax: data.tax,
      p_total_amount: data.totalAmount,
      p_currency: data.currency || 'AUD',
      p_discount_code: data.discountCode ?? null,
      p_discount_amount: data.discountAmount ?? 0,
    });

    if (error) {
      console.error('Error creating payment tracking:', error);
      return { success: false, error: error.message };
    }

    return {
      success: result?.success || false,
      trackingId: result?.tracking_id,
    };
  } catch (err) {
    console.error('Exception creating payment tracking:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Mark that customer clicked Payment button and viewed instructions
 */
export async function markPaymentInstructionsViewed(
  orderReference: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    const { data: result, error } = await supabase.rpc('mark_payment_instructions_viewed', {
      p_order_reference: orderReference,
    });

    if (error) {
      console.error('Error marking payment viewed:', error);
      return { success: false, error: error.message };
    }

    return { success: result?.success || false };
  } catch (err) {
    console.error('Exception marking payment viewed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get payment tracking info by order reference
 */
export async function getPaymentTrackingByReference(
  orderReference: string
): Promise<{
  success: boolean;
  data?: {
    orderReference: string;
    customerName: string;
    totalAmount: number;
    currency: string;
    paymentStatus: string;
    paymentViewedAt: string | null;
    createdAt: string;
  };
  error?: string;
}> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    const { data: result, error } = await supabase.rpc('get_payment_tracking_by_reference', {
      p_order_reference: orderReference,
    });

    if (error) {
      console.error('Error getting payment tracking:', error);
      return { success: false, error: error.message };
    }

    if (!result?.success) {
      return { success: false, error: result?.error || 'Order not found' };
    }

    return {
      success: true,
      data: {
        orderReference: result.order_reference,
        customerName: result.customer_name,
        totalAmount: result.total_amount,
        currency: result.currency,
        paymentStatus: result.payment_status,
        paymentViewedAt: result.payment_viewed_at,
        createdAt: result.created_at,
      },
    };
  } catch (err) {
    console.error('Exception getting payment tracking:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
