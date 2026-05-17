/**
 * Express shipping (AUD) — must stay aligned with `/shipping` policy copy.
 *
 * Total formula at checkout is `subtotal + shipping - discount`. No GST,
 * no other tax — prices on the storefront are the final price the customer pays.
 */
export const FREE_SHIPPING_THRESHOLD_AUD = 250;
export const FLAT_EXPRESS_SHIPPING_AUD = 11.9;

export function expressShippingAud(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD_AUD ? 0 : FLAT_EXPRESS_SHIPPING_AUD;
}

/**
 * Bank-transfer payment deadline policy.
 * Customers have this many hours from order creation to complete the wire
 * before the order is treated as abandoned. Must stay aligned with
 * PAYMENT_DEADLINE_HOURS in supabase/functions/send-order-email/index.ts.
 */
export const PAYMENT_DEADLINE_HOURS = 48;

/**
 * Compute the absolute payment deadline as a Date.
 * Pass the order's `created_at` ISO string; falls back to "now" when omitted
 * (useful at the moment of order creation when the row isn't visible yet).
 */
export function paymentDeadlineDate(fromIso?: string | null): Date {
  const base = fromIso ? new Date(fromIso) : new Date();
  return new Date(base.getTime() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000);
}

/**
 * Format the deadline in the visitor's LOCAL time so they don't miscount
 * across time zones. The email template uses AEST instead because that's where
 * the bank is — the discrepancy is intentional, not a bug.
 */
export function formatPaymentDeadlineLocal(fromIso?: string | null): string {
  const due = paymentDeadlineDate(fromIso);
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(due);
  } catch {
    return due.toISOString();
  }
}
