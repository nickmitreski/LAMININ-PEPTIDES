import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  Database,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import { Heading, Label, Text } from '../ui/Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

const AQUA_CTA =
  'btn inline-flex items-center justify-center rounded-sm px-7 py-3 text-sm font-medium tracking-wide uppercase bg-accent text-carbon-900 border border-carbon-900/10 transition-all duration-200 hover:bg-accent-dark active:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-carbon-900';

type Pillar = {
  icon: typeof BookOpenCheck;
  title: string;
  body: string;
};

const pillars: Pillar[] = [
  {
    icon: BookOpenCheck,
    title: 'Peer-reviewed literature',
    body:
      'Every compound traceable to published peptide research, not blog posts or marketing claims.',
  },
  {
    icon: Database,
    title: 'Credible source databases',
    body:
      'Studies sourced from NIH PubMed, NCBI, ScienceDirect, Nature, Cell, and other primary biomedical journals.',
  },
  {
    icon: FileSearch,
    title: 'Open, linkable citations',
    body:
      'Product pages and the research library link directly to the underlying papers — no walled gardens.',
  },
  {
    icon: ShieldCheck,
    title: 'Updated continuously',
    body:
      'Our research library is reviewed and refreshed as new peptide science is published.',
  },
];

const sources = [
  'NIH PubMed',
  'NCBI',
  'ScienceDirect',
  'Nature',
  'Cell',
  'The Lancet',
];

export default function PeptideScience() {
  const { ref: gridRef, revealed: gridRevealed } =
    useScrollReveal<HTMLDivElement>();

  return (
    <Section
      background="white"
      spacing="lg"
      id="peptide-science"
      aria-labelledby="peptide-science-heading"
    >
      <SectionTitle
        label="Peptide Science"
        title="Grounded in peer-reviewed research"
        subtitle="Every compound listed on Laminin Peplab is referenced from established peptide literature. Our research library indexes thousands of published studies from the world's most credible biomedical sources, so you can verify mechanisms, dosing, and outcomes before your work begins."
        titleId="peptide-science-heading"
      />

      <div
        ref={gridRef}
        className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
      >
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              data-revealed={gridRevealed}
              className={`reveal reveal-delay-${idx + 1} group relative flex h-full flex-col rounded-lg border border-carbon-900/10 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-dark/40 hover:shadow-md`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-accent-50 text-accent-dark ring-1 ring-accent-200">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <Heading level={5} className="mb-2 text-carbon-900">
                {p.title}
              </Heading>
              <Text
                variant="small"
                weight="light"
                className="leading-relaxed text-carbon-700"
              >
                {p.body}
              </Text>
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-lg border border-carbon-900/10 bg-neutral-50 px-6 py-6 sm:px-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-3">
          <Label className="text-carbon-600">
            Indexed sources include
          </Label>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {sources.map((s, i) => (
              <span
                key={s}
                className="flex items-center text-xs font-medium tracking-wider text-carbon-700"
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="mr-6 h-1 w-1 rounded-full bg-carbon-300"
                  />
                )}
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link to="/research" className={AQUA_CTA}>
          Explore the research library
        </Link>
      </div>
    </Section>
  );
}
