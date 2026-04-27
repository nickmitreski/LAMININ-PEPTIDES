import { useEffect } from 'react';

const SITE_NAME = 'Laminin Peptide Lab';
const DEFAULT_DESCRIPTION =
  'Australian supplier of high-quality research peptides and laboratory materials. Transparent quality certificates, consistent purity, reliable supply for research applications.';

/**
 * Set the page `<title>` and (optionally) `<meta name="description">`.
 *
 * Restores the previous values on unmount, so individual pages remain decoupled
 * from the global default in `index.html`.
 *
 * @param title       Page-specific title (without the site suffix).
 * @param description Optional meta description override.
 */
export function useDocumentTitle(title: string, description?: string): void {
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

    return () => {
      document.title = previousTitle;
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          previousDescription ?? DEFAULT_DESCRIPTION
        );
      }
    };
  }, [title, description]);
}
