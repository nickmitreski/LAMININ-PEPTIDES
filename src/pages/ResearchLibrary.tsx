import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Brain,
  Droplets,
  ExternalLink,
  FlaskConical,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Section from '../components/layout/Section';
import PageHero from '../components/ui/PageHero';
import Card from '../components/ui/Card';
import { Heading, Label, Text } from '../components/ui/Typography';
import { PEPTIDE_PROFILES, CATEGORY_FILTERS } from '../data/peptideData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fetchResearchProfileOverrides, type ResearchProfileOverrideRow } from '../services/supabaseService';

type CategoryTheme = {
  id: string;
  shortLabel: string;
  icon: typeof Activity;
  // Static Tailwind classes (no dynamic interpolation — Tailwind would purge them).
  bg: string;
  bgSoft: string;
  text: string;
  ring: string;
  bar: string;
  pillActive: string;
};

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  metabolic: {
    id: 'metabolic',
    shortLabel: 'Metabolic',
    icon: Activity,
    bg: 'bg-amber-100',
    bgSoft: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
    bar: 'bg-amber-400',
    pillActive: 'bg-amber-500 text-white border-amber-500',
  },
  repair: {
    id: 'repair',
    shortLabel: 'Repair',
    icon: HeartPulse,
    bg: 'bg-emerald-100',
    bgSoft: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
    bar: 'bg-emerald-400',
    pillActive: 'bg-emerald-600 text-white border-emerald-600',
  },
  neurology: {
    id: 'neurology',
    shortLabel: 'Neurology',
    icon: Brain,
    bg: 'bg-indigo-100',
    bgSoft: 'bg-indigo-50',
    text: 'text-indigo-700',
    ring: 'ring-indigo-200',
    bar: 'bg-indigo-400',
    pillActive: 'bg-indigo-600 text-white border-indigo-600',
  },
  longevity: {
    id: 'longevity',
    shortLabel: 'Longevity',
    icon: Sparkles,
    bg: 'bg-sky-100',
    bgSoft: 'bg-sky-50',
    text: 'text-sky-700',
    ring: 'ring-sky-200',
    bar: 'bg-sky-400',
    pillActive: 'bg-sky-600 text-white border-sky-600',
  },
  skin: {
    id: 'skin',
    shortLabel: 'Skin',
    icon: Droplets,
    bg: 'bg-rose-100',
    bgSoft: 'bg-rose-50',
    text: 'text-rose-700',
    ring: 'ring-rose-200',
    bar: 'bg-rose-400',
    pillActive: 'bg-rose-600 text-white border-rose-600',
  },
};

const FALLBACK_THEME: CategoryTheme = {
  id: 'default',
  shortLabel: 'Research',
  icon: FlaskConical,
  bg: 'bg-neutral-100',
  bgSoft: 'bg-neutral-50',
  text: 'text-carbon-900',
  ring: 'ring-carbon-900/10',
  bar: 'bg-carbon-900',
  pillActive: 'bg-carbon-900 text-white border-carbon-900',
};

const themeFor = (id: string): CategoryTheme =>
  CATEGORY_THEMES[id] ?? FALLBACK_THEME;

export default function ResearchLibrary() {
  useDocumentTitle(
    'Research Library',
    'Curated peptide research summaries with credible references — covering metabolic, regenerative, healing, and longevity research.'
  );
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, ResearchProfileOverrideRow>>({});

  useEffect(() => {
    let c = false;
    void (async () => {
      const m = await fetchResearchProfileOverrides();
      if (!c) setOverrides(m);
    })();
    return () => {
      c = true;
    };
  }, []);

  const mergedProfiles = useMemo(() => {
    return PEPTIDE_PROFILES.map((p) => {
      const o = overrides[p.id];
      if (!o) return p;
      return {
        ...p,
        overview: o.overview?.trim() ? o.overview : p.overview,
        mechanism: o.mechanism?.trim() ? o.mechanism : p.mechanism,
        highlights: o.highlights?.trim() ? o.highlights : p.highlights,
      };
    });
  }, [overrides]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => setActiveFilters([]);

  const filteredPeptides =
    activeFilters.length === 0
      ? mergedProfiles
      : mergedProfiles.filter((peptide) =>
          peptide.categories.some((cat) => activeFilters.includes(cat))
        );

  const totalCount = PEPTIDE_PROFILES.length;

  return (
    <div className="min-h-screen bg-platinum">
      {/* Hero */}
      <Section background="white" spacing="sm">
        <PageHero
          title="Peptide science"
          subtitle="Comprehensive research resource featuring evidence-informed peptide profiles across metabolic, regenerative, neurological, and longevity applications."
          tiles={[
            { icon: <BookOpen className="h-4 w-4" />, label: 'Coverage', value: 'Multi-domain peptide classes' },
            { icon: <FlaskConical className="h-4 w-4" />, label: 'Focus', value: 'Research-grade compounds only' },
            { icon: <ShieldCheck className="h-4 w-4" />, label: 'Evidence', value: 'Profiled with citation links' },
          ]}
        />
      </Section>

      {/* Research Notice */}
      <Section background="white" spacing="sm" className="!pt-2">
        <div className="mx-auto max-w-6xl">
          <Card padding="md" className="border border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <Text variant="small" weight="medium" className="mb-1 text-blue-900">
                  Research-Grade Compounds
                </Text>
                <Text variant="caption" className="leading-relaxed text-blue-800">
                  All compounds are supplied for{' '}
                  <strong>laboratory research purposes only</strong>. Information
                  presented is derived from published peer-reviewed research and
                  scientific literature. These materials are intended for qualified
                  research institutions and laboratories conducting legitimate
                  scientific investigations.
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Category Filters */}
      <Section background="white" spacing="sm" className="!pt-2">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <Heading level={4} className="mb-4 text-center">
              Filter by category
            </Heading>
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORY_FILTERS.map((filter) => {
                const theme = themeFor(filter.id);
                const Icon = theme.icon;
                const isActive = activeFilters.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => toggleFilter(filter.id)}
                    className={`
                      inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium
                      transition-all duration-200 touch-manipulation
                      ${
                        isActive
                          ? `${theme.pillActive} shadow-sm`
                          : `border-carbon-900/15 bg-white text-carbon-900 hover:border-carbon-900/30 hover:bg-neutral-50`
                      }
                    `}
                    title={filter.description}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </button>
                );
              })}
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center rounded-full border border-carbon-900/20 px-4 py-2 text-sm font-medium text-carbon-900 transition-colors hover:bg-neutral-50 touch-manipulation"
                >
                  Clear all
                </button>
              )}
            </div>
            <Text variant="caption" muted className="mt-3 text-center">
              Showing {filteredPeptides.length} of {totalCount} compound
              {totalCount !== 1 ? 's' : ''}
              {activeFilters.length > 0 &&
                ` (filtered by ${activeFilters.length} categor${activeFilters.length !== 1 ? 'ies' : 'y'})`}
            </Text>
          </div>
        </div>
      </Section>

      {/* Peptide Cards Grid */}
      <Section background="white" spacing="sm">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPeptides.map((peptide) => {
              const primaryCategory = peptide.categories[0];
              const theme = themeFor(primaryCategory);
              const Icon = theme.icon;
              return (
                <article
                  key={peptide.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-carbon-900/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-carbon-900/20 hover:shadow-md"
                >
                  {/* Top color bar */}
                  <div className={`h-1 w-full ${theme.bar}`} aria-hidden="true" />

                  <div className="flex flex-1 flex-col p-6">
                    {/* Header row: icon + category tags */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {peptide.categories.map((cat) => {
                          const filter = CATEGORY_FILTERS.find(
                            (f) => f.id === cat
                          );
                          const catTheme = themeFor(cat);
                          return (
                            <span
                              key={cat}
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${catTheme.bgSoft} ${catTheme.text} ring-1 ${catTheme.ring}`}
                            >
                              {catTheme.shortLabel ||
                                filter?.label.split(' &')[0]}
                            </span>
                          );
                        })}
                      </div>
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${theme.bg} ${theme.text} ring-1 ${theme.ring}`}
                        aria-hidden="true"
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                    </div>

                    {/* Title & Class */}
                    <Heading level={5} className="mb-1 text-carbon-900">
                      {peptide.name}
                    </Heading>
                    <Text variant="caption" muted className="mb-4 italic">
                      {peptide.class}
                    </Text>

                    {/* Overview */}
                    <Text
                      variant="small"
                      className="mb-5 flex-1 leading-relaxed text-carbon-700"
                    >
                      {peptide.overview}
                    </Text>

                    {/* Mechanism */}
                    <div className="mb-3">
                      <Label className="mb-1.5 block text-carbon-600">
                        Mechanism
                      </Label>
                      <Text
                        variant="caption"
                        className="leading-relaxed text-carbon-700"
                      >
                        {peptide.mechanism}
                      </Text>
                    </div>

                    {/* Highlights */}
                    {peptide.highlights?.trim() ? (
                      <div className="mb-3">
                        <Label className="mb-1.5 block text-carbon-600">Highlights</Label>
                        <Text variant="caption" className="leading-relaxed text-carbon-700">
                          {peptide.highlights}
                        </Text>
                      </div>
                    ) : null}

                    {/* Evidence Note */}
                    <div className="mb-5 flex items-start gap-2 rounded-lg border border-carbon-900/10 bg-neutral-50 p-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark" />
                      <div>
                        <Label className="mb-1 block text-carbon-700">
                          Evidence level
                        </Label>
                        <Text
                          variant="caption"
                          className="leading-relaxed text-carbon-700"
                        >
                          {peptide.evidenceNote}
                        </Text>
                      </div>
                    </div>

                    {/* Citations */}
                    <div className="mt-auto border-t border-carbon-900/10 pt-4">
                      <Label className="mb-2 block text-carbon-600">
                        Key citations
                      </Label>
                      <div className="space-y-2">
                        {peptide.citations.map((citation, idx) => (
                          <a
                            key={idx}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-carbon-900 underline-offset-2 transition-colors hover:text-accent-dark hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span>{citation.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredPeptides.length === 0 && (
            <div className="py-16 text-center">
              <Heading level={4} className="mb-3">
                No compounds match your filters
              </Heading>
              <Text variant="body" muted className="mb-6">
                Try selecting different categories or clearing your filters.
              </Text>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-sm bg-carbon-900 px-6 py-3 font-medium text-white transition-colors hover:bg-carbon-900/90 touch-manipulation"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Research Support */}
      <Section background="neutral" spacing="md">
        <div className="mx-auto max-w-4xl text-center">
          <Text variant="small" muted className="leading-relaxed">
            Supporting research institutions worldwide with{' '}
            <strong>high-purity research compounds</strong>. All products are
            manufactured to exacting standards with comprehensive quality
            documentation. Evidence levels span preclinical research through
            clinical trials, representing diverse research opportunities.
          </Text>
          <Text variant="caption" muted className="mt-4 block">
            For research inquiries or ordering information, visit our{' '}
            <a
              href="/contact"
              className="font-medium text-carbon-900 underline underline-offset-2"
            >
              contact page
            </a>{' '}
            or review our{' '}
            <a
              href="/coa"
              className="font-medium text-carbon-900 underline underline-offset-2"
            >
              Certificate of Analysis
            </a>{' '}
            documentation for quality verification.
          </Text>
        </div>
      </Section>
    </div>
  );
}
