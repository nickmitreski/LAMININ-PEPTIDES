/**
 * Helpers for building responsive AVIF/WebP/PNG srcsets from
 * /public/images/products/<file>.png — see scripts/optimize-product-images.sh.
 *
 * Outputs live in /images/products/optimized/<stem>-<width>w.{avif,webp,png}.
 */

const PRODUCT_SRC_RE = /^\/images\/products\/([^/]+)\.(png|PNG)$/;

/** Width buckets the optimiser produces. Keep in sync with the shell script. */
const WIDTHS = [400, 800, 1200] as const;

export type OptimizedSources = {
  /** AVIF `srcset` (best compression, modern browsers) */
  avifSrcSet: string;
  /** WebP `srcset` (broader support) */
  webpSrcSet: string;
  /** PNG `srcset` (universal fallback) */
  pngSrcSet: string;
  /** Default `src` (largest fallback PNG) — what the underlying <img> uses if no <source> matches */
  fallbackSrc: string;
  /** `sizes` attribute hint — leave configurable per-callsite */
  sizes?: string;
};

/**
 * Given an absolute public URL like `/images/products/CFG-001.png`, return
 * srcsets pointing into the optimised output directory. Returns null when
 * the URL doesn't match our products folder (e.g. Supabase storage URLs,
 * admin uploads). Callers then render the original `<img>` unchanged.
 */
export function buildOptimizedSources(src: string): OptimizedSources | null {
  const match = PRODUCT_SRC_RE.exec(src);
  if (!match) return null;
  const stem = decodeURIComponent(match[1]);
  // Encode each path segment so spaces/diacritics in filenames stay valid URLs.
  const encStem = encodeURIComponent(stem);

  const variant = (w: number, ext: 'avif' | 'webp' | 'png') =>
    `/images/products/optimized/${encStem}-${w}w.${ext} ${w}w`;

  return {
    avifSrcSet: WIDTHS.map((w) => variant(w, 'avif')).join(', '),
    webpSrcSet: WIDTHS.map((w) => variant(w, 'webp')).join(', '),
    pngSrcSet: WIDTHS.map((w) => variant(w, 'png')).join(', '),
    fallbackSrc: `/images/products/optimized/${encStem}-${WIDTHS[WIDTHS.length - 1]}w.png`,
  };
}
