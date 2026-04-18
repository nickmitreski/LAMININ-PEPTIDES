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
      <Section background="white" spacing="lg" className="bg-accent">
        <div className="max-w-4xl mx-auto text-center">
          <Heading level={2} className="mb-4 text-black">
            PEPTIDE SCIENCE
          </Heading>
          <Text variant="body" className="text-black/80 max-w-2xl mx-auto">
            Comprehensive research resource featuring cutting-edge peptides and compounds
            for qualified research institutions. Explore published findings and research opportunities
            across metabolic, regenerative, neurological, and longevity applications.
          </Text>
        </div>
      </Section>

      {/* Research Notice */}
      <Section background="white" spacing="sm">
        <div className="max-w-6xl mx-auto">
          <Card padding="md" className="bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <Text variant="small" weight="medium" className="mb-1 text-blue-900">
                  Research-Grade Compounds
                </Text>
                <Text variant="caption" className="text-blue-800 leading-relaxed">
                  All compounds are supplied for <strong>laboratory research purposes only</strong>.
                  Information presented is derived from published peer-reviewed research and scientific literature.
                  These materials are intended for qualified research institutions and laboratories
                  conducting legitimate scientific investigations.
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
            <Heading level={4} className="mb-4 text-center">
              Filter by category
            </Heading>
            <div className="flex flex-wrap justify-center gap-3">
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
            <Text variant="caption" muted className="mt-3 text-center">
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
              <Card key={peptide.id} padding="lg" className="flex flex-col h-full border-2 border-accent">
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

      {/* Research Support */}
      <Section background="platinum" spacing="md">
        <div className="max-w-4xl mx-auto text-center">
          <Text variant="small" muted className="leading-relaxed">
            Supporting research institutions worldwide with <strong>high-purity research compounds</strong>.
            All products are manufactured to exacting standards with comprehensive quality documentation.
            Evidence levels span preclinical research through clinical trials, representing diverse research opportunities.
          </Text>
          <Text variant="caption" muted className="mt-4 block">
            For research inquiries or ordering information, visit our{' '}
            <a href="/contact" className="font-medium text-carbon-900 underline underline-offset-2">
              contact page
            </a>
            {' '}or review our{' '}
            <a href="/coa" className="font-medium text-carbon-900 underline underline-offset-2">
              Certificate of Analysis
            </a>{' '}
            documentation for quality verification.
          </Text>
        </div>
      </Section>
    </div>
  );
}
