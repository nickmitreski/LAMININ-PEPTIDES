import { useMemo, useState } from 'react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import PageTopBanner from '../components/ui/PageTopBanner';
import Button from '../components/ui/Button';
import { Heading, Label, Text } from '../components/ui/Typography';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useShopImages } from '../context/ShopImagesContext';
import useScrollReveal from '../hooks/useScrollReveal';
import { PEPTIDE_ID_TO_CFG, PRODUCT_MAPPINGS } from '../data/productMappings';
import { getVariants } from '../data/productPricing';

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

type CalculatorProductOption = {
  id: string;
  label: string;
  vialStrengthMg: number | null;
};

function parseMgFromText(value: string): number | null {
  const normalized = value.toLowerCase().replace(/\s+/g, ' ');
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*mg\b/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function ReconstitutionCalculator() {
  useDocumentTitle(
    'Reconstitution Calculator',
    'Peptide reconstitution calculator for research workflows. Convert vial strength and diluent volume into concentration, mL draw amount, and U-100 insulin units.'
  );

  const [desiredDoseMg, setDesiredDoseMg] = useState('0.5');
  const [vialStrengthMg, setVialStrengthMg] = useState('10');
  const [diluentMl, setDiluentMl] = useState('2');
  const { allProducts, isProductActive } = useShopImages();

  const productOptions = useMemo(() => {
    const options: CalculatorProductOption[] = [];

    for (const product of allProducts) {
      if (!isProductActive(product.id)) continue;
      if (
        product.id === 'bacteriostatic-water' ||
        product.id === 'acetic-acid-water'
      ) {
        continue;
      }

      const variants = getVariants(product.id);
      if (variants?.length) {
        for (const variant of variants) {
          options.push({
            id: `${product.id}:${variant.id}`,
            label: `${product.name} (${variant.label})`,
            vialStrengthMg: parseMgFromText(variant.label),
          });
        }
        continue;
      }

      const cfg = PEPTIDE_ID_TO_CFG[product.id];
      const mappedName = cfg ? PRODUCT_MAPPINGS[cfg]?.peptideName : null;
      options.push({
        id: product.id,
        label: product.name,
        vialStrengthMg: parseMgFromText(mappedName ?? product.name),
      });
    }

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [allProducts, isProductActive]);

  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const selectedProduct = useMemo(
    () => productOptions.find((option) => option.id === selectedProductId) ?? null,
    [productOptions, selectedProductId]
  );

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

  const { ref: gridRef, revealed: gridRevealed } = useScrollReveal<HTMLDivElement>();

  const applyProductStrength = (nextProductId: string) => {
    setSelectedProductId(nextProductId);
    const option = productOptions.find((item) => item.id === nextProductId);
    if (option?.vialStrengthMg) {
      setVialStrengthMg(String(option.vialStrengthMg));
    }
  };

  return (
    <div className="min-h-screen">
      <Section background="white" spacing="lg">
        <PageTopBanner
          title="Reconstitution calculator"
          subtitle="Select your Laminin compound, set your target dose, then calculate concentration, draw volume, and U-100 units using bacteriostatic water."
        />

        <div ref={gridRef} data-revealed={gridRevealed} className="reveal mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card padding="lg" className="border border-carbon-900/20 shadow-sm">
            <Heading level={4} className="mb-5 !font-bold">
              Calculator inputs
            </Heading>

            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Select product</Label>
                <select
                  value={selectedProductId}
                  onChange={(e) => applyProductStrength(e.target.value)}
                  className="min-h-11 w-full rounded-sm border border-carbon-900/30 bg-white px-3 text-base md:text-sm"
                >
                  <option value="">Choose a Laminin product</option>
                  {productOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Text variant="caption" className="mt-2 block text-carbon-900/75">
                  {selectedProduct?.vialStrengthMg
                    ? `Detected vial strength: ${selectedProduct.vialStrengthMg} mg`
                    : 'If no strength is detected, enter vial strength manually below.'}
                </Text>
              </div>

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
                          ? 'border-carbon-900/35 bg-accent text-carbon-900'
                          : 'border-carbon-900/30 bg-white text-carbon-900'
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
                  className="min-h-11 w-full rounded-sm border border-carbon-900/30 px-3 text-base md:text-sm"
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
                          ? 'border-carbon-900/35 bg-accent text-carbon-900'
                          : 'border-carbon-900/30 bg-white text-carbon-900'
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
                  className="min-h-11 w-full rounded-sm border border-carbon-900/30 px-3 text-base md:text-sm"
                />
              </div>

              <div>
                <Label className="mb-2 block">Total bacteriostatic water volume (mL)</Label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {diluentPresetsMl.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDiluentMl(String(v))}
                      className={`min-h-11 rounded-sm border px-3 text-sm font-medium touch-manipulation ${
                        diluentMl === String(v)
                          ? 'border-carbon-900/35 bg-accent text-carbon-900'
                          : 'border-carbon-900/30 bg-white text-carbon-900'
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
                  className="min-h-11 w-full rounded-sm border border-carbon-900/30 px-3 text-base md:text-sm"
                />
                <Text variant="caption" className="mt-2 block text-carbon-900/75">
                  Laminin bacteriostatic water is supplied as 3 mL vials; most
                  workflows use 1-3 mL total diluent.
                </Text>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setSelectedProductId('');
                  setDesiredDoseMg('0.5');
                  setVialStrengthMg('10');
                  setDiluentMl('2');
                }}
              >
                Reset
              </Button>
            </div>
          </Card>

          <Card
            padding="lg"
            className="border border-carbon-900/20 bg-platinum shadow-sm"
          >
            <Heading level={4} className="mb-5 !font-bold">
              Results
            </Heading>

            {result ? (
              <div className="space-y-4">
                <div className="rounded-sm border border-carbon-900/20 bg-white px-4 py-3">
                  <Text variant="caption" muted className="uppercase tracking-[0.14em]">
                    Concentration
                  </Text>
                  <Text variant="lead" className="mt-1 text-carbon-900">
                    {formatUnits(result.concentrationMgPerMl)} mg/mL
                  </Text>
                </div>

                <div className="rounded-sm border border-carbon-900/20 bg-white px-4 py-3">
                  <Text variant="caption" muted className="uppercase tracking-[0.14em]">
                    Approx. mcg per 0.1 mL
                  </Text>
                  <Text variant="lead" className="mt-1 text-carbon-900">
                    {formatUnits(result.concentrationMcgPerTenthMl)} mcg
                  </Text>
                </div>

                <div className="rounded-sm border border-carbon-900/20 bg-white px-4 py-3">
                  <Text variant="caption" muted className="uppercase tracking-[0.14em]">
                    Draw volume
                  </Text>
                  <Text variant="lead" className="mt-1 text-carbon-900">
                    {formatUnits(result.drawMl)} mL
                  </Text>
                </div>

                <div className="rounded-sm border border-carbon-900/20 bg-white px-4 py-3">
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
