import type { CartItem } from '../types/cart';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CheckoutPayload } from './proteinCheckout';

export interface EnrichedCheckoutLine {
  peptide_id: string;
  peptide_display_name: string;
  variant_id?: string;
  cfg_code: string;
  protein_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface SecureCheckoutInitResponse {
  ok: boolean;
  sent_email?: boolean;
  sent_sms?: boolean;
  /** True when email/SMS was requested but nothing was delivered (e.g. Resend/Twilio off). */
  code_delivery_pending?: boolean;
  delivery_enabled?: boolean;
  payment_portal_url?: string | null;
  payment_link_id?: string | null;
  /** True after create-payment-link returned a URL (may be hidden from browser if omit flag set). */
  payment_link_created?: boolean;
  /** True if PAYMENT_LINK_PARTNER_NOTIFY_URL returned OK (partner should open pay UI on their site). */
  partner_payment_ui_notify_ok?: boolean;
  /** True when email/SMS included the payment link (partner URL), reference, and code. */
  payment_link_in_delivery?: boolean;
  error?: string;
}

/** Zip cart lines with bridge payloads so partner + dashboards share one structure. */
export function buildEnrichedLineItemsFromPayload(
  items: CartItem[],
  payload: CheckoutPayload
): EnrichedCheckoutLine[] {
  const { peptide_items, protein_items } = payload;
  if (
    items.length !== peptide_items.length ||
    items.length !== protein_items.length
  ) {
    throw new Error('Cart line count mismatch building enriched checkout lines.');
  }
  return items.map((item, i) => ({
    peptide_id: item.peptideId,
    peptide_display_name: peptide_items[i].peptide_display_name,
    variant_id: item.variantId,
    cfg_code: peptide_items[i].cfg_code,
    protein_name: protein_items[i].protein_name,
    quantity: item.quantity,
    unit_price: peptide_items[i].unit_price,
    line_total: peptide_items[i].line_total,
  }));
}

const MOCK_FLAG = import.meta.env.VITE_DEV_MOCK_SECURE_CHECKOUT === 'true';

/**
 * Calls Supabase Edge Function `secure-checkout-init` to hash/store a code, notify the customer,
 * and optionally notify the partner payment API. Resend/Twilio run only when the Edge secret
 * `ENABLE_CODE_DELIVERY=true` is set.
 */
export async function initiateSecureCheckoutSession(
  payload: CheckoutPayload,
  items: CartItem[],
  opts: { sendEmail: boolean; sendSms: boolean }
): Promise<SecureCheckoutInitResponse> {
  if (MOCK_FLAG && import.meta.env.DEV) {
    return {
      ok: true,
      sent_email: false,
      sent_sms: false,
      code_delivery_pending: true,
      delivery_enabled: false,
      payment_portal_url: null,
      payment_link_created: false,
      payment_link_in_delivery: false,
      partner_payment_ui_notify_ok: false,
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      error:
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then deploy the secure-checkout-init Edge Function.',
    };
  }

  let enriched_lines: EnrichedCheckoutLine[];
  try {
    enriched_lines = buildEnrichedLineItemsFromPayload(items, payload);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Could not build line items.',
    };
  }

  const body = {
    peptide_order_id: payload.peptide_order_id,
    customer: payload.customer,
    totals: payload.totals,
    peptide_items: payload.peptide_items,
    protein_items: payload.protein_items,
    enriched_lines,
    send_email: opts.sendEmail,
    send_sms: opts.sendSms,
  };

  const checkoutSecret = (import.meta.env.VITE_CHECKOUT_INIT_SECRET as string | undefined)?.trim();
  const headers: Record<string, string> = {};
  if (checkoutSecret) {
    headers['x-checkout-init-secret'] = checkoutSecret;
  }

  const { data, error } = await supabase.functions.invoke<SecureCheckoutInitResponse>(
    'secure-checkout-init',
    { body, headers }
  );

  if (error) {
    return {
      ok: false,
      error: error.message || 'Secure checkout service unavailable.',
    };
  }

  if (data && typeof data === 'object' && 'ok' in data) {
    return data as SecureCheckoutInitResponse;
  }

  return { ok: false, error: 'Unexpected response from secure checkout.' };
}

export function describeCodeDestinations(sendEmail: boolean, sendSms: boolean): string {
  if (sendEmail && sendSms) return 'your email and mobile number';
  if (sendEmail) return 'your email';
  if (sendSms) return 'your mobile number';
  return 'your contact';
}
