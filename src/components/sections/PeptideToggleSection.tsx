import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import Card from '../ui/Card';
import { Heading, Label, Text } from '../ui/Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

const AQUA_CTA =
  'btn flex w-full items-center justify-center rounded-sm px-6 py-2.5 text-sm font-medium bg-accent text-carbon-900 border border-carbon-900/10 transition-all duration-200 hover:bg-accent-dark active:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-carbon-900';

type Pillar = {
  id: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  imageAlt?: string;
  cta: { label: string; to: string };
};

const pillars: Pillar[] = [
  {
    id: 'analytical',
    title: 'Analytical verification',
    subtitle:
      'Each compound undergoes analytical verification to confirm purity and research-grade consistency.',
    imageSrc: '/images/coa.png',
    imageAlt:
      'Sample test report and certificate-style documentation from analytical laboratory',
    cta: { label: 'View reports', to: '/coa' },
  },
  {
    id: 'coa',
    title: 'COA transparency',
    subtitle:
      'Certificates of Analysis available for every compound supplied.',
    imageSrc: `/images/extra/${encodeURIComponent('COA transperancy.png')}`,
    imageAlt:
      'Certificates of analysis and transparency documentation for supplied compounds',
    cta: { label: 'View reports', to: '/coa' },
  },
  {
    id: 'purity',
    title: 'Purity assurance guarantee',
    subtitle:
      'Strict quality standards backed by our Purity Assurance Guarantee.',
    imageSrc: '/images/purity.png',
    imageAlt:
      'Laboratory scale measuring a sealed vial for precise quality control',
    cta: { label: 'View guarantee', to: '/guarantee' },
  },
];

export default function PeptideToggleSection() {
  const { ref: headingRef, revealed: headingRevealed } =
    useScrollReveal<HTMLDivElement>();
  const { ref: gridRef, revealed: gridRevealed } =
    useScrollReveal<HTMLDivElement>();

  return (
    <Section background="neutral">
      <div
        ref={headingRef}
        data-revealed={headingRevealed}
        className="reveal mx-auto mb-10 max-w-3xl text-center md:mb-14"
      >
        <Label className="mb-3 inline-block text-accent-dark">
          Quality standards
        </Label>
        <Heading level={2} className="mb-4 text-carbon-900">
          Verified, documented, guaranteed
        </Heading>
        <Text variant="lead" weight="light" className="text-carbon-700">
          Every compound is supported by analytical testing, third-party
          documentation, and our purity assurance guarantee.
        </Text>
      </div>
      <div
        ref={gridRef}
        className="grid grid-cols-1 items-stretch md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {pillars.map((item, idx) => (
          <div
            key={item.id}
            data-revealed={gridRevealed}
            className={`reveal reveal-delay-${idx + 1} flex h-full`}
          >
            <Card padding="lg" hover className="flex h-full w-full flex-col">
              <div
                className={`aspect-[4/3] w-full shrink-0 rounded-lg overflow-hidden border border-carbon-900/10 mb-5 ${
                  item.imageSrc ? 'bg-white' : 'bg-grey'
                }`}
                aria-hidden={!item.imageSrc}
              >
                {item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt={item.imageAlt ?? ''}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain object-center"
                  />
                ) : null}
              </div>

              <Heading level={5} className="mb-3 shrink-0">
                {item.title}
              </Heading>
              <Text variant="small" muted className="leading-relaxed shrink-0">
                {item.subtitle}
              </Text>

              <div className="min-h-2 flex-1" aria-hidden />

              <div className="shrink-0 pt-3">
                <Link to={item.cta.to} className={AQUA_CTA}>
                  {item.cta.label}
                </Link>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}
