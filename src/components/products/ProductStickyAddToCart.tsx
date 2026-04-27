import { useEffect, useState } from 'react';
import Button from '../ui/Button';

interface ProductStickyAddToCartProps {
  /** Element that owns the in-page add-to-cart button. The sticky bar appears when this is offscreen. */
  watchRef: React.RefObject<HTMLElement | null>;
  /** Currently displayed price line (e.g. "$120 AUD"). */
  priceLabel: string | null;
  /** Optional secondary line (e.g. variant strength). */
  secondaryLabel?: string | null;
  /** Add-to-cart click handler. */
  onAddToCart: () => void;
  /** CTA copy ("Add to cart" / "Add more to cart"). */
  ctaLabel: string;
  /** Disable the CTA when no price is available. */
  disabled?: boolean;
}

/**
 * Mobile-only sticky bar that pops up once the main Add-to-cart button has
 * scrolled out of view. Hidden on tablet/desktop where the CTA stays in view.
 */
export default function ProductStickyAddToCart({
  watchRef,
  priceLabel,
  secondaryLabel,
  onAddToCart,
  ctaLabel,
  disabled,
}: ProductStickyAddToCartProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = watchRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show the sticky bar when the main CTA has scrolled out of view.
        setShow(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [watchRef]);

  return (
    <div
      role="region"
      aria-label="Sticky add to cart"
      data-visible={show}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 transform border-t border-carbon-900/10 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(15,15,15,0.18)] backdrop-blur-md transition-transform duration-300 data-[visible=false]:translate-y-full data-[visible=true]:translate-y-0 data-[visible=true]:pointer-events-auto md:hidden motion-reduce:transition-none"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-carbon-900">
            {priceLabel ?? 'Contact for pricing'}
          </p>
          {secondaryLabel && (
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              {secondaryLabel}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onAddToCart}
          disabled={disabled}
          className="shrink-0 px-5 py-3 text-xs uppercase tracking-button"
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
