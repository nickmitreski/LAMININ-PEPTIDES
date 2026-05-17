import { useEffect } from 'react';

/**
 * Lock document body scroll while the hook is mounted (i.e. while a modal is
 * open). Captures the previous overflow so multiple modals nest cleanly.
 *
 * Skip on iOS-style touch devices entirely if `disabled = true`.
 */
export default function useBodyScrollLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Compensate for scrollbar disappearance to avoid layout shift behind the modal
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [active]);
}
