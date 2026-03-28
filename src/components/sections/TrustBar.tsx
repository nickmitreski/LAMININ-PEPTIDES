import Container from '../layout/Container';
import { Label } from '../ui/Typography';

export default function TrustBar() {
  const trustHighlights = [
    { titleLines: ['99%+ PURITY', 'GUARANTEE'] },
    { titleLines: ['ANALYTICAL', 'VERIFICATION'] },
    { titleLines: ['CERTIFICATE OF', 'ANALYSIS'] },
    { titleLines: ['PURITY', 'GUARANTEE'] },
  ];

  return (
    <section className="bg-carbon-900 border-t border-white/5">
      <Container>
        <div className="py-8 md:py-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustHighlights.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="h-14 flex flex-col justify-center">
                  {feature.titleLines.map((line) => (
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
