import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { absoluteUrl } from '../lib/siteUrl';

const SITE_NAME = 'Laminin Peptide Lab';
const DEFAULT_DESCRIPTION =
  'Australian supplier of high-quality research peptides and laboratory materials. Transparent quality certificates, consistent purity, reliable supply for research applications.';

interface DocumentMetaOptions {
  /** Override the canonical path (defaults to the current pathname, no query/hash). */
  canonicalPath?: string;
  /** Disable the canonical link tag (e.g. for noindex pages). */
  noCanonical?: boolean;
}

function ensureCanonicalLink(): HTMLLinkElement {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Set the page `<title>`, `<meta name="description">`, and `<link rel="canonical">`.
 *
 * Restores the previous values on unmount, so individual pages remain decoupled
 * from the global default in `index.html`.
 *
 * @param title       Page-specific title (without the site suffix).
 * @param description Optional meta description override.
 * @param options     Canonical URL controls.
 */
export function useDocumentTitle(
  title: string,
  description?: string,
  options?: DocumentMetaOptions
): void {
  const { pathname } = useLocation();
  const canonicalPath = options?.canonicalPath ?? pathname;
  const noCanonical = options?.noCanonical ?? false;

  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const previousDescription = metaDescription?.getAttribute('content') ?? null;

    document.title = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
    if (description && metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    let canonicalEl: HTMLLinkElement | null = null;
    let previousCanonicalHref: string | null = null;
    if (!noCanonical) {
      canonicalEl = ensureCanonicalLink();
      previousCanonicalHref = canonicalEl.getAttribute('href');
      canonicalEl.setAttribute('href', absoluteUrl(canonicalPath));
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          previousDescription ?? DEFAULT_DESCRIPTION
        );
      }
      if (canonicalEl) {
        if (previousCanonicalHref !== null) {
          canonicalEl.setAttribute('href', previousCanonicalHref);
        } else {
          canonicalEl.parentNode?.removeChild(canonicalEl);
        }
      }
    };
  }, [title, description, canonicalPath, noCanonical]);
}
