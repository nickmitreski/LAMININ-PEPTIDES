import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reveal-on-scroll hook. Sets `data-revealed="true"` once the node nears the
 * viewport (CSS `.reveal` starts at opacity 0).
 *
 * Fail-safes so content never stays invisible:
 * - prefers-reduced-motion → reveal immediately
 * - already on-screen → reveal immediately
 * - IntersectionObserver errors → reveal immediately
 * - still hidden after `fallbackMs` → force reveal
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: {
    rootMargin?: string;
    threshold?: number;
    once?: boolean;
    /** Hard cap so content cannot stay opacity-0 forever. */
    fallbackMs?: number;
  } = {}
) {
  // Generous margins so sections reveal just before they enter view.
  // Use px only — % rootMargin has been flaky across engines.
  const {
    rootMargin = '120px 0px 120px 0px',
    threshold = 0,
    once = true,
    fallbackMs = 900,
  } = options;
  const [revealed, setRevealed] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<T | null>(null);
  const revealedRef = useRef(false);

  const markRevealed = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  // Absolute fallback: never leave storefront content invisible.
  useEffect(() => {
    if (revealed) return;
    const id = window.setTimeout(markRevealed, fallbackMs);
    return () => window.clearTimeout(id);
  }, [revealed, fallbackMs, markRevealed]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [rootMargin, threshold, once]);

  const ref = useCallback(
    (node: T | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      nodeRef.current = node;
      if (!node) return;
      if (revealedRef.current) {
        setRevealed(true);
        return;
      }

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
        markRevealed();
        return;
      }

      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      // Already in or near the viewport (including slightly below).
      if (rect.top < vh + 120 && rect.bottom > -120) {
        markRevealed();
        return;
      }

      try {
        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                markRevealed();
                if (once) observer.disconnect();
              } else if (!once) {
                revealedRef.current = false;
                setRevealed(false);
              }
            }
          },
          { rootMargin, threshold }
        );
        observer.observe(node);
        observerRef.current = observer;
      } catch {
        markRevealed();
      }
    },
    [rootMargin, threshold, once, markRevealed]
  );

  return { ref, revealed };
}

export default useScrollReveal;
