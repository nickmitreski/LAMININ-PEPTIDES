/**
 * Appends a stable cache-busting query param so CDN/browser refreshes after
 * admin replaces an object at the same storage path.
 */
export function appendImageCacheVersion(
  url: string,
  versionKey: string
): string {
  const v = versionKey.trim().slice(0, 64);
  if (!url || !v) return url;
  try {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://localhost';
    const u = url.startsWith('http') ? new URL(url) : new URL(url, base);
    u.searchParams.set('v', v);
    return u.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${encodeURIComponent(v)}`;
  }
}
