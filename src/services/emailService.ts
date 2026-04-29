import { supabase } from '../lib/supabase';

interface SendOrderEmailParams {
  orderReference: string;
  /** Optional — edge function skips Resend when empty */
  customerEmail?: string;
  customerName: string;
  /** Shown in Twilio WhatsApp admin notification */
  customerPhone?: string;
  totalAmount: number;
  currency?: string;
}

interface SendContactMessageParams {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

/**
 * Try to read the JSON body of a non-2xx Edge Function response so we can
 * surface the real `detail` / `error` instead of just `FunctionsHttpError`.
 * `supabase-js` exposes the response on `error.context` as a `Response` clone.
 */
async function extractEdgeFunctionDetail(error: unknown): Promise<string | null> {
  const ctx = (error as { context?: Response | { json?: () => Promise<unknown> } } | null)?.context;
  if (!ctx) return null;
  try {
    const maybeResponse = ctx as Response;
    if (typeof maybeResponse.json === 'function') {
      const body = (await maybeResponse.json()) as { detail?: string; error?: string } | null;
      return body?.detail || body?.error || null;
    }
  } catch {
    /* swallow — we'll fall back to the generic message */
  }
  return null;
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
        customer_email: params.customerEmail ?? '',
        customer_name: params.customerName,
        customer_phone: params.customerPhone ?? '',
        total_amount: params.totalAmount,
        currency: params.currency || 'AUD',
      },
    });

    if (error) {
      const detail = await extractEdgeFunctionDetail(error);
      console.error('Edge function error (send-order-email):', error.message, { detail });
      return { success: false, error: detail || error.message };
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

/**
 * Submit a contact form message via the send-contact-message edge function.
 * Delivers the message to the support inbox and sends an auto-reply confirmation.
 */
export async function sendContactMessage(params: SendContactMessageParams): Promise<{
  success: boolean;
  confirmationSent?: boolean;
  error?: string;
}> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured — cannot submit contact form');
      return { success: false, error: 'Contact form is temporarily unavailable.' };
    }

    const { data, error } = await supabase.functions.invoke('send-contact-message', {
      body: {
        name: params.name,
        email: params.email,
        phone: params.phone || undefined,
        message: params.message,
      },
    });

    if (error) {
      const detail = await extractEdgeFunctionDetail(error);
      console.error('Contact edge function error:', error.message, { detail });
      return { success: false, error: detail || error.message || 'Could not send your message.' };
    }

    return {
      success: data?.ok === true,
      confirmationSent: data?.confirmation_sent === true,
      error: data?.error || undefined,
    };
  } catch (err) {
    console.error('Failed to send contact message:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
