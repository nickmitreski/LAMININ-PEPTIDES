import { useMemo, useState } from 'react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import PageTopBanner from '../components/ui/PageTopBanner';
import Button from '../components/ui/Button';
import { Heading, Label, Text } from '../components/ui/Typography';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const dosePresetsMg = [0.1, 0.25, 0.5, 1, 2, 2.5, 5, 7.5, 10, 12.5, 15];
const vialPresetsMg = [1, 5, 10, 15, 20, 50];
const diluentPresetsMl = [0.5, 1, 1.5, 2, 2.5, 3];

const formatUnits = (value: number) => {
  if (!Number.isFinite(value)) return '—';
  if (value < 0) return '—';
  if (value >= 1000) return value.toFixed(0);
  if (value >= 100) return value.toFixed(1);
  return value.toFixed(2);
};

export default function ReconstitutionCalculator() {
  useDocumentTitle(
    'Reconstitution Calculator',
    'Peptide reconstitution calculator for research workflows. Convert vial strength and diluent volume into concentration, mL draw amount, and U-100 insulin units.'
  );

  const [desiredDoseMg, setDesiredDoseMg] = useState('0.5');
  const [vialStrengthMg, setVialStrengthMg] = useState('10');
  const [diluentMl, setDiluentMl] = useState('2');

  const result = useMemo(() => {
    const dose = Number(desiredDoseMg);
    const vial = Number(vialStrengthMg);
    const diluent = Number(diluentMl);

    if (!(dose > 0) || !(vial > 0) || !(diluent > 0)) {
      return null;
    }

    const concentrationMgPerMl = vial / diluent;
    const concentrationMcgPerTenthMl = concentrationMgPerMl * 100; // mg/mL -> mcg per 0.1mL
    const drawMl = dose / concentrationMgPerMl;
    const drawUnits = drawMl * 100; // U-100 insulin syringe

    return {
      concentrationMgPerMl,
      concentrationMcgPerTenthMl,
      drawMl,
      drawUnits,
    };
  }, [desiredDoseMg, vialStrengthMg, diluentMl]);

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageTopBanner
          title="Reconstitution calculator"
          subtitle="Math tool for research preparation. Enter your vial strength, target dose, and total diluent to calculate concentration and syringe draw volume."
        />

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card padding="lg">
            <Heading level={4} className="mb-5">
              Calculator inputs
            </Heading>

            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Desired dose (mg)</Label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {dosePresetsMg.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDesiredDoseMg(String(v))}
                      className={`min-h-11 rounded-sm border px-3 text-sm font-medium touch-manipulation ${
                        desiredDoseMg === String(v)
                          ? 'border-accent bg-accent/25 text-carbon-900'
                          : 'border-carbon-900/20 bg-white text-carbon-900'
                      }`}
                    >
                      {v} mg
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={desiredDoseMg}
                  onChange={(e) => setDesiredDoseMg(e.target.value)}
                  className="min-h-11 w-full rounded-sm border border-carbon-900/20 px-3 text-base md:text-sm"
                />
              </div>

              <div>
                <Label className="mb-2 block">Vial strength (mg)</Label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {vialPresetsMg.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVialStrengthMg(String(v))}
                      className={`min-h-11 rounded-sm border px-3 text-sm font-medium touch-manipulation ${
                        vialStrengthMg === String(v)
                          ? 'border-accent bg-accent/25 text-carbon-900'
                          : 'border-carbon-900/20 bg-white text-carbon-900'
                      }`}
                    >
                      {v} mg
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={vialStrengthMg}
                  onChange={(e) => setVialStrengthMg(e.target.value)}
                  className="min-h-11 w-full rounded-sm border border-carbon-900/20 px-3 text-base md:text-sm"
                />
              </div>

              <div>
                <Label className="mb-2 block">Total diluent volume (mL)</Label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {diluentPresetsMl.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDiluentMl(String(v))}
                      className={`min-h-11 rounded-sm border px-3 text-sm font-medium touch-manipulation ${
                        diluentMl === String(v)
                          ? 'border-accent bg-accent/25 text-carbon-900'
                          : 'border-carbon-900/20 bg-white text-carbon-900'
                      }`}
                    >
                      {v} mL
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={diluentMl}
                  onChange={(e) => setDiluentMl(e.target.value)}
                  className="min-h-11 w-full rounded-sm border border-carbon-900/20 px-3 text-base md:text-sm"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setDesiredDoseMg('0.5');
                  setVialStrengthMg('10');
                  setDiluentMl('2');
                }}
              >
                Reset
              </Button>
            </div>
          </Card>

          <Card padding="lg" className="bg-platinum">
            <Heading level={4} className="mb-5">
              Results
            </Heading>

            {result ? (
              <div className="space-y-4">
                <div className="rounded-sm border border-carbon-900/10 bg-white px-4 py-3">
                  <Text variant="caption" muted className="uppercase tracking-[0.14em]">
                    Concentration
                  </Text>
                  <Text variant="lead" className="mt-1 text-carbon-900">
                    {formatUnits(result.concentrationMgPerMl)} mg/mL
                  </Text>
                </div>

                <div className="rounded-sm border border-carbon-900/10 bg-white px-4 py-3">
                  <Text variant="caption" muted className="uppercase tracking-[0.14em]">
                    Approx. mcg per 0.1 mL
                  </Text>
                  <Text variant="lead" className="mt-1 text-carbon-900">
                    {formatUnits(result.concentrationMcgPerTenthMl)} mcg
                  </Text>
                </div>

                <div className="rounded-sm border border-carbon-900/10 bg-white px-4 py-3">
                  <Text variant="caption" muted className="uppercase tracking-[0.14em]">
                    Draw volume
                  </Text>
                  <Text variant="lead" className="mt-1 text-carbon-900">
                    {formatUnits(result.drawMl)} mL
                  </Text>
                </div>

                <div className="rounded-sm border border-carbon-900/10 bg-white px-4 py-3">
                  <Text variant="caption" muted className="uppercase tracking-[0.14em]">
                    U-100 syringe
                  </Text>
                  <Text variant="lead" className="mt-1 text-carbon-900">
                    {formatUnits(result.drawUnits)} units
                  </Text>
                </div>

                <Text variant="small" className="pt-2 text-carbon-900/80">
                  Math tool only. For laboratory research handling and preparation workflows.
                </Text>
              </div>
            ) : (
              <Text variant="small" className="text-carbon-900/75">
                Enter all values above to generate your calculation.
              </Text>
            )}
          </Card>
        </div>

        <Text
          variant="caption"
          className="mx-auto mt-6 block max-w-6xl text-center text-carbon-900/65"
        >
          Math tool only. Laboratory research preparation aid; not dosing advice.
        </Text>
      </Section>
    </div>
  );
}
