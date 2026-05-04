import { ShieldCheck, FlaskConical, FileCheck2, Award } from 'lucide-react';
import Container from '../layout/Container';
import { Label } from '../ui/Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

type Highlight = {
  icon: typeof ShieldCheck;
  titleLines: [string, string];
};

const trustHighlights: Highlight[] = [
  { icon: ShieldCheck, titleLines: ['99%+ PURITY', 'GUARANTEE'] },
  { icon: FlaskConical, titleLines: ['ANALYTICAL', 'VERIFICATION'] },
  { icon: FileCheck2, titleLines: ['CERTIFICATE OF', 'ANALYSIS'] },
  { icon: Award, titleLines: ['LABORATORY', 'GRADE'] },
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
        <div ref={ref} className="relative py-10 md:py-14">
          <div className="grid grid-cols-2 gap-y-10 gap-x-4 lg:grid-cols-4 lg:gap-8">
            {trustHighlights.map(({ icon: Icon, titleLines }, idx) => (
              <div
                key={titleLines.join('-')}
                data-revealed={revealed}
                className={`reveal reveal-delay-${idx} group flex flex-col items-center text-center`}
              >
                <div
                  aria-hidden="true"
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent/20 group-hover:ring-accent/60 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
