import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  hasCheckoutCompleted,
  resetCheckoutComplete,
  trackEvent,
} from '../../lib/analytics';

function textFor(el: Element): string {
  return (
    el.getAttribute('aria-label') ||
    el.textContent?.replace(/\s+/g, ' ').trim() ||
    ''
  ).slice(0, 160);
}

function closestTrackable(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest('button,a,[role="button"],input,select,textarea');
}

export default function AnalyticsTracker() {
  const location = useLocation();
  const { state } = useCart();
  const pageStartedAt = useRef(Date.now());
  const checkoutStartedAt = useRef<number | null>(null);
  const maxScrollY = useRef(0);
  const cartRef = useRef({ itemCount: state.itemCount, total: state.total });

  useEffect(() => {
    cartRef.current = { itemCount: state.itemCount, total: state.total };
  }, [state.itemCount, state.total]);

  useEffect(() => {
    const cart = cartRef.current;
    const previousDuration = Date.now() - pageStartedAt.current;
    if (previousDuration > 250) {
      trackEvent(
        {
          event_name: 'page_leave',
          duration_ms: previousDuration,
          scroll_y: maxScrollY.current,
          cart_item_count: cart.itemCount,
          cart_total: cart.total,
        },
        true
      );
    }

    pageStartedAt.current = Date.now();
    maxScrollY.current = window.scrollY;

    trackEvent({
      event_name: 'page_view',
      cart_item_count: cart.itemCount,
      cart_total: cart.total,
      metadata: {
        search: location.search,
      },
    });

    if (location.pathname === '/checkout') {
      resetCheckoutComplete();
      checkoutStartedAt.current = Date.now();
      trackEvent({
        event_name: 'checkout_start',
        cart_item_count: cart.itemCount,
        cart_total: cart.total,
      });
    } else {
      checkoutStartedAt.current = null;
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = closestTrackable(event.target);
      if (!el) return;
      const anchor = el instanceof HTMLAnchorElement ? el : el.closest('a');
      trackEvent({
        event_name: 'click',
        element_tag: el.tagName.toLowerCase(),
        element_text: textFor(el),
        element_role: el.getAttribute('role') || undefined,
        element_href: anchor?.href,
        click_x: event.clientX,
        click_y: event.clientY,
        scroll_y: window.scrollY,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        cart_item_count: state.itemCount,
        cart_total: state.total,
      });
    };

    const onScroll = () => {
      maxScrollY.current = Math.max(maxScrollY.current, window.scrollY);
    };

    const flush = () => {
      const durationMs = Date.now() - pageStartedAt.current;
      trackEvent(
        {
          event_name: 'page_leave',
          duration_ms: durationMs,
          scroll_y: maxScrollY.current,
          cart_item_count: state.itemCount,
          cart_total: state.total,
        },
        true
      );

      if (checkoutStartedAt.current && !hasCheckoutCompleted()) {
        trackEvent(
          {
            event_name: 'checkout_abandoned',
            duration_ms: Date.now() - checkoutStartedAt.current,
            cart_item_count: state.itemCount,
            cart_total: state.total,
          },
          true
        );
      }
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', flush);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', flush);
    };
  }, [state.itemCount, state.total]);

  return null;
}
