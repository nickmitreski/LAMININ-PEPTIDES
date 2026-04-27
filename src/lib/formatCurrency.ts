/**
 * Shared currency formatting helpers.
 *
 * Storefront prices are displayed in AUD inc. GST. Use these helpers instead of
 * raw `${value.toFixed(2)}` to keep formatting consistent across the site
 * (cart, checkout, admin, emails, schema metadata).
 */

const DEFAULT_LOCALE = 'en-AU';
const DEFAULT_CURRENCY = 'AUD';

/**
 * Format a number as currency, e.g. `formatCurrency(199)` → `"$199.00"`.
 *
 * @param amount  Numeric amount. Falsy/NaN values render as `$0.00`.
 * @param currency ISO currency code (defaults to AUD).
 * @param locale   BCP-47 locale tag (defaults to en-AU).
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format a numeric price without the currency code suffix — `"$199.00"`.
 *
 * Intl.NumberFormat with `currency: 'AUD'` in some locales appends `A$` rather
 * than `$`. This helper keeps the bare `$199.00` shape used throughout the
 * storefront UI.
 */
export function formatPrice(amount: number | null | undefined): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return `$${value.toFixed(2)}`;
}
