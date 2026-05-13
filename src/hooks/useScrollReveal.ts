import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll hook. Adds a `data-revealed="true"` attribute to the
 * referenced element once it scrolls into view, which CSS uses to drive an
 * entrance animation. Honours `prefers-reduced-motion` by revealing immediately.
 *
 * Uses a callback ref so the observer is (re-)attached whenever the underlying
 * DOM node mounts — fixes the case where the element is conditionally rendered
 * (e.g. hidden behind a loading gate) and doesn't exist on first render.
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
  const [revealed, setRevealed] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<T | null>(null);

  // Tear down any existing observer when options change or on unmount.
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [rootMargin, threshold, once]);

  // Callback ref: called whenever the DOM node mounts or unmounts.
  const ref = useCallback(
    (node: T | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      nodeRef.current = node;
      if (!node) return;

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
      observerRef.current = observer;
    },
    [rootMargin, threshold, once]
  );

  return { ref, revealed };
}

export default useScrollReveal;
