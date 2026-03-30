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

export default function Library() {
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

  const handleCategoryChange = (tab: string) => {
    setActiveCategory(tab as string);
    const q = searchTerm.trim();
    if (tab === 'All') {
      setSearchParams(q ? { q } : {}, { replace: true });
    } else {
      setSearchParams(q ? { category: tab, q } : { category: tab }, { replace: true });
    }
  };

  const categoryPeptides = getPeptidesByCategory(activeCategory);
  const filteredPeptides = filterPeptidesByName(searchTerm, categoryPeptides);

  return (
    <div className="min-h-screen">
      <Section background="white">
        <SectionTitle
          title="Research Library"
          subtitle="Browse our complete catalogue of laboratory-grade peptides with verified purity"
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
            {filteredPeptides.length} compounds found
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
          <div className="py-12 text-center sm:py-16">
            <Text variant="small" muted className="mb-4 block">
              No compounds found matching your search.
            </Text>
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
          </div>
        )}

        <Card padding="lg" className="mt-12 bg-grey sm:mt-16">
          <div className="max-w-xl">
            <Heading level={5} className="mb-3">
              Need Help Finding a Compound?
            </Heading>
            <Text variant="small" muted className="mb-5">
              Can't find what you're looking for? Our team can help source specific research compounds or provide guidance on alternatives.
            </Text>
            <Link to="/contact">
              <Button variant="primary" size="md">
                Contact Us
              </Button>
            </Link>
          </div>
        </Card>
      </Section>
    </div>
  );
}
