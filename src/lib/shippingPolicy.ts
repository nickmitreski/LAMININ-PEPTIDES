/**
 * Express shipping (AUD) — must stay aligned with `/shipping` policy copy.
 */
export const FREE_SHIPPING_THRESHOLD_AUD = 250;
export const FLAT_EXPRESS_SHIPPING_AUD = 11.9;

export function expressShippingAud(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD_AUD ? 0 : FLAT_EXPRESS_SHIPPING_AUD;
}

/**
 * Tax rate applied to cart subtotal at checkout.
 * Prices are tax-inclusive so the default is 0 (no additional tax).
 * Override with `VITE_CHECKOUT_GST_RATE` if needed.
 */
export function checkoutGstRate(): number {
  const raw = import.meta.env.VITE_CHECKOUT_GST_RATE as string | undefined;
  if (raw === undefined || raw === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0;
  return n;
}

export function checkoutGstAmount(subtotal: number, rate: number = checkoutGstRate()): number {
  return Math.round(subtotal * rate * 100) / 100;
}
