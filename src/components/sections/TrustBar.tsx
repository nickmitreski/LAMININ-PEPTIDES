import { ShieldCheck, FlaskConical, FileCheck2, Award } from 'lucide-react';
import Container from '../layout/Container';
import { Label } from '../ui/Typography';

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
  return (
    <section className="bg-carbon-900 border-t border-white/5">
      <Container>
        <div className="py-8 md:py-10">
          <div className="grid grid-cols-2 gap-y-8 gap-x-4 lg:grid-cols-4 lg:gap-8">
            {trustHighlights.map(({ icon: Icon, titleLines }) => (
              <div
                key={titleLines.join('-')}
                className="flex flex-col items-center text-center"
              >
                <div
                  aria-hidden="true"
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-accent/30"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col justify-center">
                  {titleLines.map((line) => (
                    <Label
                      key={line}
                      inheritColor
                      className="text-white/90 block md:text-sm leading-snug"
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
