import { useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll hook. Adds a `data-revealed="true"` attribute to the
 * referenced element once it scrolls into view, which CSS uses to drive an
 * entrance animation. Honours `prefers-reduced-motion` by revealing immediately.
 *
 * Usage:
 *   const { ref, revealed } = useScrollReveal<HTMLDivElement>();
 *   <div ref={ref} data-revealed={revealed} className="reveal" />
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: { rootMargin?: string; threshold?: number; once?: boolean } = {}
) {
  const { rootMargin = '0px 0px -10% 0px', threshold = 0.15, once = true } =
    options;
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If the user prefers reduced motion or IntersectionObserver isn't
    // available, reveal immediately.
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setRevealed(false);
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, revealed };
}

export default useScrollReveal;
