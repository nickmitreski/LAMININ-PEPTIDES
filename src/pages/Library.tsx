import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Section from '../components/layout/Section';
import SectionTitle from '../components/ui/SectionTitle';
import ToggleTabs from '../components/ui/ToggleTabs';
import PeptideCard from '../components/peptides/PeptideCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import SearchField from '../components/ui/SearchField';
import TextLink from '../components/ui/TextLink';
import { Heading, Text } from '../components/ui/Typography';
import {
  peptideCategories,
  libraryTabItems,
  getPeptidesByCategory,
  filterPeptidesByName,
} from '../data/peptides';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useShopImages } from '../context/ShopImagesContext';

export default function Library() {
  useDocumentTitle(
    'Compound Library',
    'Browse our full compound library of research-grade peptides — categorised by application, with purity certificates available on request.'
  );
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>(peptideCategories[0]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const param = params.get('category');
    const q = params.get('q');
    if (q !== null) {
      setSearchTerm(q);
    }
    if (
      param &&
      (peptideCategories as readonly string[]).includes(param)
    ) {
      setActiveCategory(param as string);
    } else if (!param) {
      setActiveCategory('All' as string);
    }
  }, [location.search]);

  // Debounce search-term to URL for shareable filter URLs
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentQ = params.get('q') ?? '';
    const trimmed = searchTerm.trim();
    if (currentQ === trimmed) return;
    const timer = setTimeout(() => {
      const next: Record<string, string> = {};
      if (activeCategory && activeCategory !== 'All') {
        next.category = activeCategory;
      }
      if (trimmed) {
        next.q = trimmed;
      }
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, activeCategory]);

  const handleCategoryChange = (tab: string) => {
    setActiveCategory(tab as string);
    const q = searchTerm.trim();
    if (tab === 'All') {
      setSearchParams(q ? { q } : {}, { replace: true });
    } else {
      setSearchParams(q ? { category: tab, q } : { category: tab }, { replace: true });
    }
  };

  const { isProductActive, allProducts } = useShopImages();

  // Use merged catalog (static + DB-only products), filtered by category and active status
  const categoryPeptides = activeCategory === 'All'
    ? [...allProducts].sort((a, b) => a.name.localeCompare(b.name))
    : allProducts.filter((p) => p.libraryFilters.includes(activeCategory as import('../data/peptides').LibraryTheme));
  const activePeptides = categoryPeptides.filter((p) => isProductActive(p.id));
  const filteredPeptides = filterPeptidesByName(searchTerm, activePeptides);

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <SectionTitle
          label="Compound library"
          title="Compound catalogue"
          subtitle="Browse our complete catalogue of laboratory-grade peptides with verified purity"
          titleClassName="!font-bold"
        />

        <div className="mx-auto mb-8 max-w-xl md:mb-12">
          <SearchField
            type="search"
            placeholder="Search compounds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            aria-label="Search compounds"
          />
        </div>

        <div className="mb-8 md:mb-12">
          <ToggleTabs
            items={libraryTabItems}
            activeTab={activeCategory}
            onTabChange={handleCategoryChange}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
          <Text variant="caption" muted>
            {filteredPeptides.length} {filteredPeptides.length === 1 ? 'compound' : 'compounds'} found
          </Text>
          <TextLink to="/coa" className="shrink-0 self-start sm:self-auto">
            View all certificates →
          </TextLink>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-4 md:gap-6">
          {filteredPeptides.map((peptide) => (
            <PeptideCard key={peptide.id} peptide={peptide} />
          ))}
        </div>

        {filteredPeptides.length === 0 && (
          <div className="mx-auto max-w-md py-12 text-center sm:py-16">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-platinum">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-carbon-600"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </div>
            <Heading level={5} className="mb-2">
              No compounds found
            </Heading>
            <Text variant="small" muted className="mb-5 block">
              {searchTerm
                ? `We couldn't find anything matching "${searchTerm}"${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}. Try a different search or browse another category.`
                : 'No compounds match the selected filters.'}
            </Text>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {searchTerm ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSearchTerm('')}
                  className="touch-manipulation"
                >
                  Clear search
                </Button>
              ) : null}
              {activeCategory !== 'All' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => handleCategoryChange('All')}
                  className="touch-manipulation"
                >
                  View all compounds
                </Button>
              )}
            </div>
          </div>
        )}

        <Card padding="lg" className="mt-12 bg-platinum sm:mt-16">
          <div className="max-w-xl">
            <Heading level={5} className="mb-3">
              Need help finding a compound?
            </Heading>
            <Text variant="small" muted className="mb-5">
              Can't find what you're looking for? Our team can help source specific research compounds or provide guidance on alternatives.
            </Text>
            <Link to="/contact">
              <Button variant="primary" size="md">
                Contact us
              </Button>
            </Link>
          </div>
        </Card>
      </Section>
    </div>
  );
}
