import { useEffect, useState } from 'react';
import { imgFetchPriorityProps } from '../../lib/imgFetchPriority';
import { buildOptimizedSources } from '../../lib/optimizedImage';

type ShopProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Intrinsic dimensions hint — prevents CLS while the image streams in. */
  width?: number;
  height?: number;
  /** `sizes` for the responsive srcset. Default: assumes the image fills its container at common breakpoints. */
  sizes?: string;
  /** Shown if `src` fails to load (broken upload, expired storage URL, etc.). */
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = '/images/purity.png';
const DEFAULT_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px';

/**
 * Tiny pulse placeholder until the image fires onLoad (helps storage / slow networks).
 * If the source 404s or fails, swaps to a fallback so the user never sees a broken icon.
 * Resets when `src` changes.
 *
 * When `src` points to a /images/products/*.png file, automatically emits a
 * <picture> with AVIF + WebP + PNG srcsets sourced from
 * /images/products/optimized/ (produced by scripts/optimize-product-images.sh).
 * Falls back gracefully to the original src for Supabase storage URLs and
 * admin uploads, which the optimiser doesn't touch.
 */
export default function ShopProductImage({
  src,
  alt,
  className = 'relative block overflow-hidden',
  imgClassName = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  width,
  height,
  sizes = DEFAULT_SIZES,
  fallbackSrc = DEFAULT_FALLBACK,
}: ShopProductImageProps) {
  const [ready, setReady] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [didFallback, setDidFallback] = useState(false);

  useEffect(() => {
    setReady(false);
    setCurrentSrc(src);
    setDidFallback(false);
  }, [src]);

  const handleError = () => {
    if (!didFallback && currentSrc !== fallbackSrc) {
      console.warn('[ShopProductImage] image failed, falling back', {
        attempted: currentSrc,
        fallback: fallbackSrc,
      });
      setDidFallback(true);
      setCurrentSrc(fallbackSrc);
      return;
    }
    setReady(true);
  };

  // Build srcset only when we have not yet fallen back (the optimised variants
  // are derived from the ORIGINAL src; if it 404s we drop down to fallbackSrc
  // and don't try the variants).
  const optimised =
    !didFallback ? buildOptimizedSources(currentSrc) : null;

  const imgClass = `${ready ? 'opacity-100' : 'opacity-0'} motion-safe:transition-opacity motion-safe:duration-200 ${imgClassName}`;

  return (
    <span className={className}>
      <span
        aria-hidden
        className={
          ready
            ? 'pointer-events-none absolute inset-0 hidden'
            : 'pointer-events-none absolute inset-0 animate-pulse rounded-[inherit] bg-neutral-100'
        }
      />
      {optimised ? (
        <picture>
          <source type="image/avif" srcSet={optimised.avifSrcSet} sizes={sizes} />
          <source type="image/webp" srcSet={optimised.webpSrcSet} sizes={sizes} />
          <img
            src={optimised.fallbackSrc}
            srcSet={optimised.pngSrcSet}
            sizes={sizes}
            alt={alt}
            loading={loading}
            decoding={decoding}
            {...imgFetchPriorityProps(fetchPriority)}
            width={width}
            height={height}
            onLoad={() => setReady(true)}
            onError={handleError}
            className={imgClass}
          />
        </picture>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          loading={loading}
          decoding={decoding}
          {...imgFetchPriorityProps(fetchPriority)}
          width={width}
          height={height}
          onLoad={() => setReady(true)}
          onError={handleError}
          className={imgClass}
        />
      )}
    </span>
  );
}
