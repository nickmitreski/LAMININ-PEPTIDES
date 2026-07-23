import { Link } from 'react-router-dom';
import { ShieldCheck, FileCheck2, Award } from 'lucide-react';
import Container from '../layout/Container';
import { Label } from '../ui/Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

type Highlight = {
  icon: typeof ShieldCheck;
  titleLines: [string, string];
  to: string;
};

const trustHighlights: Highlight[] = [
  { icon: ShieldCheck, titleLines: ['99%+ PURITY', 'GUARANTEE'], to: '/guarantee' },
  { icon: FileCheck2, titleLines: ['CERTIFICATE OF', 'ANALYSIS'], to: '/coa' },
  { icon: Award, titleLines: ['LABORATORY', 'GRADE'], to: '/library' },
];

export default function TrustBar() {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-carbon-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent"
      />
      <Container>
        <div
          ref={ref}
          data-revealed={revealed}
          className="reveal relative py-10 md:py-14"
        >
          <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-8">
            {trustHighlights.map(({ icon: Icon, titleLines, to }) => (
              <Link
                key={titleLines.join('-')}
                to={to}
                className="group flex flex-col items-center text-center touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-carbon-900"
              >
                <div
                  aria-hidden="true"
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30 transition-colors duration-300 group-hover:bg-accent/20 group-hover:ring-accent/60"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col justify-center">
                  {titleLines.map((line) => (
                    <Label
                      key={line}
                      inheritColor
                      className="block leading-snug text-white/90 md:text-sm"
                    >
                      {line}
                    </Label>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
