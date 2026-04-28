import { useEffect, useState } from 'react';

type ShopProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
  fetchPriority?: 'high' | 'low' | 'auto';
};

/**
 * Tiny pulse placeholder until the image fires onLoad (helps storage / slow networks).
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
}: ShopProductImageProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
  }, [src]);

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
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
        className={`${ready ? 'opacity-100' : 'opacity-0'} motion-safe:transition-opacity motion-safe:duration-200 ${imgClassName}`}
      />
    </span>
  );
}
