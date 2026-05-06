import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Section from '../components/layout/Section';
import SearchField from '../components/ui/SearchField';
import Card from '../components/ui/Card';
import { Heading, Text } from '../components/ui/Typography';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useShopImages } from '../context/ShopImagesContext';
import { buildSiteSearchHits } from '../lib/siteSearch';
import { FileText, FlaskConical, LayoutGrid, ArrowRight } from 'lucide-react';

function kindLabel(kind: string): string {
  switch (kind) {
    case 'product':
      return 'Product';
    case 'research':
      return 'Research';
    default:
      return 'Page';
  }
}

function kindIcon(kind: string) {
  switch (kind) {
    case 'product':
      return <FlaskConical className="h-4 w-4" aria-hidden />;
    case 'research':
      return <FileText className="h-4 w-4" aria-hidden />;
    default:
      return <LayoutGrid className="h-4 w-4" aria-hidden />;
  }
}

export default function SiteSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const { loading, allProducts } = useShopImages();

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useDocumentTitle(
    query ? `Search: ${query}` : 'Search',
    'Search products, research, and pages on Laminin Peptide Lab.'
  );

  const hits = useMemo(
    () => buildSiteSearchHits(query, allProducts),
    [query, allProducts]
  );

  const syncUrl = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      if (trimmed) setSearchParams({ q: trimmed }, { replace: true });
      else setSearchParams({}, { replace: true });
    },
    [setSearchParams]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    syncUrl(query);
  };

  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="lg">
        <Heading level={1} className="mb-2">
          Search
        </Heading>
        <Text variant="body" muted className="mb-6 max-w-prose">
          Find compounds, peptide science profiles, and site pages in one place.
        </Text>

        <form onSubmit={onSubmit} className="mb-8 max-w-xl">
          <SearchField
            type="search"
            placeholder="Search products, COA, shipping, research…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => syncUrl(query)}
            autoComplete="off"
            aria-label="Site search"
            className="text-base md:text-sm min-h-11"
          />
        </form>

        {loading ? (
          <Text variant="body" muted>
            Loading catalogue…
          </Text>
        ) : !query.trim() ? (
          <Text variant="body" muted>
            Enter a term to search the full site.
          </Text>
        ) : hits.length === 0 ? (
          <Card padding="md" className="border border-carbon-900/10">
            <Text variant="body">
              No results for &quot;{query.trim()}&quot;. Try a product name,
              &quot;COA&quot;, or &quot;shipping&quot;.
            </Text>
          </Card>
        ) : (
          <ul className="space-y-3">
            {hits.map((h) => (
              <li key={h.id}>
                <Link
                  to={h.to}
                  className="group flex items-start gap-4 rounded-sm border border-carbon-900/10 bg-white p-4 shadow-sm transition-colors hover:border-accent/40 hover:bg-accent/5 touch-manipulation min-h-11"
                >
                  <span
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-platinum text-carbon-700"
                    aria-hidden
                  >
                    {kindIcon(h.kind)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-carbon-500">
                        {kindLabel(h.kind)}
                      </span>
                    </div>
                    <Heading level={5} className="mt-0.5 text-carbon-900">
                      {h.title}
                    </Heading>
                    <Text variant="small" muted className="mt-1">
                      {h.description}
                    </Text>
                  </div>
                  <ArrowRight
                    className="mt-2 h-5 w-5 shrink-0 text-carbon-400 transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
