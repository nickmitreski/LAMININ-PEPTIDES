/**
 * CoreForge embedded checkout (iframe on Lamin `/pay`).
 * CoreForge must allow this storefront origin in `VITE_EMBED_PARENT_ORIGINS` and CSP `frame-ancestors`.
 */
export function getCoreForgePayOrigin(): string | null {
  const raw = (import.meta.env.VITE_COREFORGE_PAY_ORIGIN as string | undefined)?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    return `${u.origin}`;
  } catch {
    return null;
  }
}

export function coreForgeEmbedIframeSrc(paymentId: string): string | null {
  const origin = getCoreForgePayOrigin();
  if (!origin || !paymentId.trim()) return null;
  return `${origin}/embed/pay/${encodeURIComponent(paymentId.trim())}`;
}
