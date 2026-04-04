/**
 * Public site origin for JSON-LD, sitemaps, and absolute URLs.
 * Set `VITE_APP_URL` in production (e.g. https://your-domain.com.au) — no trailing slash required.
 */
export const SITE_FALLBACK_ORIGIN = 'https://laminincollective.com';

export function normalizeSiteOrigin(input: string | undefined | null): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    return null;
  }
}

/** Browser / Vite: uses `import.meta.env.VITE_APP_URL`. */
export function siteOrigin(): string {
  const fromEnv = import.meta.env.VITE_APP_URL as string | undefined;
  return normalizeSiteOrigin(fromEnv) ?? SITE_FALLBACK_ORIGIN;
}

export function absoluteUrl(path: string): string {
  const base = siteOrigin();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/** Product schema `priceCurrency` — storefront lists AUD inc. GST. */
export function listingPriceCurrency(): string {
  return (
    (import.meta.env.VITE_LISTING_PRICE_CURRENCY as string | undefined)?.trim() || 'AUD'
  );
}
