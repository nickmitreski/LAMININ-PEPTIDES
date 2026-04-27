import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Scrolls the window to the top on forward route navigation, while letting the
 * browser restore the previous scroll position on back/forward (POP) navigation.
 *
 * Listens to `pathname` only — search-string changes from in-page filtering
 * (e.g. Library debounced search sync) should not scroll the user back up.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      // Browser will restore scroll for back/forward. Don't override.
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, navigationType]);

  return null;
}
