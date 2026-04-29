import { useEffect, useState } from 'react';

type ShopProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Shown if `src` fails to load (broken upload, expired storage URL, etc.). */
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = '/images/products/purity.png';

/**
 * Tiny pulse placeholder until the image fires onLoad (helps storage / slow networks).
 * If the source 404s or fails, swaps to a fallback so the user never sees a broken icon.
 * Resets when `src` changes.
 */
export default function ShopProductImage({
  src,
  alt,
  className = 'relative block overflow-hidden',
  imgClassName = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
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
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={() => setReady(true)}
        onError={handleError}
        className={`${ready ? 'opacity-100' : 'opacity-0'} motion-safe:transition-opacity motion-safe:duration-200 ${imgClassName}`}
      />
    </span>
  );
}
