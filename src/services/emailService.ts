import { supabase } from '../lib/supabase';

interface SendOrderEmailParams {
  orderReference: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  currency?: string;
}

/**
 * Send payment instruction email via the send-order-email edge function.
 * Non-blocking — checkout succeeds even if the email fails.
 */
export async function sendOrderEmail(params: SendOrderEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured — skipping order email');
      return { success: false, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase.functions.invoke('send-order-email', {
      body: {
        order_reference: params.orderReference,
        customer_email: params.customerEmail,
        customer_name: params.customerName,
        total_amount: params.totalAmount,
        currency: params.currency || 'AUD',
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data?.ok === true,
      error: data?.error || undefined,
    };
  } catch (err) {
    console.error('Failed to send order email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
