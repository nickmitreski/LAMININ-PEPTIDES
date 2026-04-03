/** White-label checkout copy (set in .env so affiliates don’t see a fixed third-party name). */
export const CHECKOUT_BRAND_NAME =
  (import.meta.env.VITE_CHECKOUT_BRAND_NAME as string | undefined)?.trim() || 'Secure checkout';

export const CHECKOUT_PARTNER_LABEL =
  (import.meta.env.VITE_CHECKOUT_PARTNER_LABEL as string | undefined)?.trim() ||
  'payment provider';

/** Shown in UI when describing SMS/email from the storefront (match Edge secret CHECKOUT_DELIVERY_BRAND). */
export const CHECKOUT_DELIVERY_BRAND =
  (import.meta.env.VITE_CHECKOUT_DELIVERY_BRAND as string | undefined)?.trim() || 'LAMININ';
