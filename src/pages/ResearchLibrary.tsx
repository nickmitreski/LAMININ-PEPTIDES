import { useState } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import { Heading, Text } from '../components/ui/Typography';
import { PEPTIDE_PROFILES, CATEGORY_FILTERS } from '../data/peptideData';

export default function ResearchLibrary() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => setActiveFilters([]);

  // Filter peptides by active categories
  const filteredPeptides = activeFilters.length === 0
    ? PEPTIDE_PROFILES
    : PEPTIDE_PROFILES.filter(peptide =>
        peptide.categories.some(cat => activeFilters.includes(cat))
      );

  return (
    <div className="min-h-screen bg-platinum">
      {/* Hero Section */}
      <Section background="carbon" spacing="lg">
        <div className="max-w-4xl mx-auto text-center">
          <Heading level={2} className="mb-4 text-white">
            PEPTIDE SCIENCE
          </Heading>
          <Text variant="body" className="text-white/80 max-w-2xl mx-auto">
            Educational resource covering investigational compounds from published research.
            For laboratory and research purposes only.
          </Text>
        </div>
      </Section>

      {/* Disclaimer */}
      <Section background="white" spacing="sm">
        <div className="max-w-6xl mx-auto">
          <Card padding="md" className="bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <Text variant="small" weight="medium" className="mb-1 text-amber-900">
                  Important: Educational content only
                </Text>
                <Text variant="caption" className="text-amber-800 leading-relaxed">
                  Information on this page is for <strong>general education</strong> about published research.
                  It is <strong>not medical advice</strong>, <strong>not a substitute for professional care</strong>,
                  and <strong>not an offer to diagnose or treat</strong>. Product availability and regulations vary by jurisdiction.
                  Laminin does not claim that any compound is safe or effective for a particular person.
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Category Filters */}
      <Section background="white" spacing="sm">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Heading level={4} className="mb-3">
              Filter by category
            </Heading>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => toggleFilter(filter.id)}
                  className={`
                    px-4 py-2 rounded-sm text-sm font-medium transition-all duration-200 touch-manipulation
                    ${activeFilters.includes(filter.id)
                      ? 'bg-carbon-900 text-white'
                      : 'bg-neutral-100 text-carbon-900 hover:bg-neutral-200'
                    }
                  `}
                  title={filter.description}
                >
                  {filter.label}
                </button>
              ))}
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-sm text-sm font-medium text-carbon-900 border border-carbon-900/20 hover:bg-neutral-50 transition-colors touch-manipulation"
                >
                  Clear all
                </button>
              )}
            </div>
            <Text variant="caption" muted className="mt-3">
              {filteredPeptides.length} compound{filteredPeptides.length !== 1 ? 's' : ''} shown
              {activeFilters.length > 0 && ` (filtered by ${activeFilters.length} categor${activeFilters.length !== 1 ? 'ies' : 'y'})`}
            </Text>
          </div>
        </div>
      </Section>

      {/* Peptide Cards Grid */}
      <Section background="white" spacing="lg">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeptides.map(peptide => (
              <Card key={peptide.id} padding="lg" className="flex flex-col h-full">
                {/* Category tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {peptide.categories.map(cat => {
                    const filter = CATEGORY_FILTERS.find(f => f.id === cat);
                    return (
                      <span
                        key={cat}
                        className="px-2 py-1 text-xs font-medium text-carbon-900 bg-neutral-100 rounded-sm"
                      >
                        {filter?.label.split(' &')[0]}
                      </span>
                    );
                  })}
                </div>

                {/* Title & Class */}
                <Heading level={5} className="mb-2">
                  {peptide.name}
                </Heading>
                <Text variant="caption" muted className="mb-4 italic">
                  {peptide.class}
                </Text>

                {/* Overview */}
                <Text variant="small" className="mb-4 leading-relaxed text-carbon-900 flex-1">
                  {peptide.overview}
                </Text>

                {/* Mechanism */}
                <div className="mb-4">
                  <Text variant="caption" weight="medium" className="mb-1 text-carbon-900">
                    Mechanism
                  </Text>
                  <Text variant="caption" className="text-neutral-700 leading-relaxed">
                    {peptide.mechanism}
                  </Text>
                </div>

                {/* Evidence Note */}
                <div className="mb-4 p-3 bg-neutral-50 rounded-sm border border-carbon-900/10">
                  <Text variant="caption" weight="medium" className="mb-1 text-carbon-900">
                    Evidence level
                  </Text>
                  <Text variant="caption" className="text-neutral-700">
                    {peptide.evidenceNote}
                  </Text>
                </div>

                {/* Citations */}
                <div className="pt-4 border-t border-carbon-900/10">
                  <Text variant="caption" weight="medium" className="mb-2 text-carbon-900">
                    Key citations
                  </Text>
                  <div className="space-y-2">
                    {peptide.citations.map((citation, idx) => (
                      <a
                        key={idx}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-carbon-900 hover:text-carbon-900/80 underline underline-offset-2 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span>{citation.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredPeptides.length === 0 && (
            <div className="text-center py-16">
              <Heading level={4} className="mb-3">
                No compounds match your filters
              </Heading>
              <Text variant="body" muted className="mb-6">
                Try selecting different categories or clearing your filters.
              </Text>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-3 bg-carbon-900 text-white font-medium rounded-sm hover:bg-carbon-900/90 transition-colors touch-manipulation"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Bottom Disclaimer */}
      <Section background="platinum" spacing="md">
        <div className="max-w-4xl mx-auto text-center">
          <Text variant="small" muted className="leading-relaxed">
            All compounds listed are for <strong>research use only</strong>.
            Many are not TGA-approved (Australia) or FDA-approved (US) for the uses described in popular media.
            Evidence levels range from preclinical (animal/lab) to early clinical trials.{' '}
            <strong>Always discuss any health decisions with a qualified clinician.</strong>
          </Text>
          <Text variant="caption" muted className="mt-4 block">
            For questions about products or ordering, visit our{' '}
            <a href="/contact" className="font-medium text-carbon-900 underline underline-offset-2">
              contact page
            </a>
            {' '}or check the{' '}
            <a href="/coa" className="font-medium text-carbon-900 underline underline-offset-2">
              Certificate of Analysis
            </a>{' '}
            page for product quality documentation.
          </Text>
        </div>
      </Section>
    </div>
  );
}
