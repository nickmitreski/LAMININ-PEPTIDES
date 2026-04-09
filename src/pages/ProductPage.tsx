import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Section from '../components/layout/Section';
import Container from '../components/layout/Container';
import ProductHeroVisual from '../components/products/ProductHeroVisual';
import ProductQuantityStepper from '../components/products/ProductQuantityStepper';
import ProductPageAccordion, {
  ProductOverviewBody,
} from '../components/products/ProductPageAccordion';
import ProductDescriptionModal from '../components/products/ProductDescriptionModal';
import Button from '../components/ui/Button';
import { Heading, Label, Text } from '../components/ui/Typography';
import {
  allPeptides,
  getPeptideDisplayImage,
  isLiquidAncillaryPeptide,
} from '../data/peptides';
import {
  getPeptideIdFromSlug,
  getProductCopy,
  getProductHeadline,
} from '../data/productContent';
import { coaPdfFilenameForPeptide, coaPdfPublicUrl } from '../data/coaPdfs';
import {
  getDisplayPriceForPeptide,
  getDisplayPriceForVariant,
  getNumericPriceForVariantOrPeptide,
  getVariants,
} from '../data/productPricing';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ProductStructuredData } from '../components/seo/StructuredData';
import SuggestedPeptides from '../components/products/SuggestedPeptides';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, isInCart } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [accordionOpenId, setAccordionOpenId] = useState<string | null>(null);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);

  const peptideId = slug ? getPeptideIdFromSlug(slug) : undefined;
  const peptide = peptideId
    ? allPeptides.find((p) => p.id === peptideId)
    : undefined;
  const copy = peptideId ? getProductCopy(peptideId) : undefined;

  useEffect(() => {
    if (!peptideId) {
      setSelectedVariantId(undefined);
      return;
    }
    const v = getVariants(peptideId);
    setSelectedVariantId(v?.[0]?.id);
  }, [peptideId]);

  useEffect(() => {
    if (!copy) return;
    const prevTitle = document.title;
    document.title = copy.metaTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const prevDesc = meta.getAttribute('content') ?? '';
    meta.setAttribute('content', copy.metaDescription);
    return () => {
      document.title = prevTitle;
      meta?.setAttribute('content', prevDesc);
    };
  }, [copy]);

  if (!slug || !peptide || !copy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <Heading level={4} className="mb-4">
          Product not found
        </Heading>
        <Text variant="small" muted className="mb-6 text-center max-w-md">
          This compound page does not exist or the link may be incorrect.
        </Text>
        <Link to="/library">
          <Button variant="primary" size="md">
            Browse library
          </Button>
        </Link>
      </div>
    );
  }

  const variants = getVariants(peptide.id);
  const effectiveVariantId = variants?.length
    ? (selectedVariantId ?? variants[0].id)
    : undefined;
  const selectedVariant = variants?.find((v) => v.id === effectiveVariantId);

  const priceLine = variants?.length && effectiveVariantId
    ? getDisplayPriceForVariant(peptide.id, effectiveVariantId)
    : getDisplayPriceForPeptide(peptide.id);

  const coaFile = coaPdfFilenameForPeptide(
    peptide.id,
    variants?.length ? effectiveVariantId : undefined
  );
  const headline = getProductHeadline(peptide.id, peptide.name);
  const liquidAncillary = isLiquidAncillaryPeptide(peptide.id);
  const price = getNumericPriceForVariantOrPeptide(
    peptide.id,
    variants?.length ? effectiveVariantId : undefined
  );
  const displayImage = getPeptideDisplayImage(
    peptide.id,
    variants?.length ? effectiveVariantId : undefined,
    peptide.image
  );
  const heroAltName = selectedVariant
    ? `${peptide.name} ${selectedVariant.label}`
    : peptide.name;
  const productPath = `/products/${slug}`;

  const goBack = () => {
    navigate(-1);
  };

  const handleAddToCart = () => {
    if (!peptide) return;
    const price = getNumericPriceForVariantOrPeptide(
      peptide.id,
      variants?.length ? effectiveVariantId : undefined
    );
    if (price === null) return;

    const cartName = selectedVariant
      ? `${peptide.name} (${selectedVariant.label})`
      : peptide.name;

    addItem(
      {
        peptideId: peptide.id,
        variantId: selectedVariant ? effectiveVariantId : undefined,
        name: cartName,
        price,
        image: displayImage,
        purity: peptide.purity,
      },
      quantity
    );

    // Show success notification
    showToast(`${cartName} added to cart successfully!`, 'success', 3000);

    // Reset quantity
    setQuantity(1);
  };

  return (
    <div className="min-h-screen bg-platinum pb-20">
      <ProductStructuredData
        name={headline}
        description={copy.paragraphs[0] || ''}
        image={displayImage}
        price={price !== null ? price : undefined}
        purity={peptide.purity}
        category={peptide.category}
        sku={peptide.id}
        url={productPath}
      />
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+5.25rem)] z-40 border-b border-carbon-900/10 bg-white/95 backdrop-blur-sm md:top-24">
        <Container>
          <div className="flex min-h-12 items-center py-1 md:h-16 md:py-0">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-sm px-3 py-2 text-sm font-bold uppercase tracking-[0.2em] text-carbon-900 transition-colors hover:bg-grey touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
              Back
            </button>
          </div>
        </Container>
      </div>

      <main id="main-product">
        <Section background="white" spacing="lg" className="!pt-6 md:!pt-10">
          <div className="mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-x-14 lg:gap-y-0 xl:gap-x-20">
            <ProductHeroVisual
              imageSrc={displayImage}
              productName={heroAltName}
            />

            <div className="flex min-w-0 w-full max-w-xl flex-col lg:justify-self-start">
              <Label tone="muted" className="mb-3 block tracking-[0.2em]">
                {peptide.category}
              </Label>
              <h1 className="text-2xl font-bold uppercase leading-[1.15] tracking-[0.06em] text-carbon-900 sm:text-3xl md:text-4xl md:tracking-[0.07em]">
                {headline}
              </h1>

              {variants && variants.length > 0 && (
                <div className="mt-4 max-w-xs">
                  <Label
                    tone="muted"
                    className="mb-2 block text-[0.65rem] tracking-[0.18em] sm:text-xs"
                  >
                    STRENGTH
                  </Label>
                  <select
                    id="product-variant"
                    className="min-h-11 w-full rounded-sm border border-carbon-900/20 bg-white px-3 py-2.5 text-base font-medium text-carbon-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900 focus-visible:ring-offset-2 md:min-h-0 md:text-sm"
                    value={effectiveVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    aria-label="Select product strength"
                  >
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} — ${v.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-2">
                {priceLine ? (
                  <Text
                    as="span"
                    variant="lead"
                    weight="medium"
                    className="text-carbon-900"
                  >
                    {priceLine}
                  </Text>
                ) : (
                  <Text variant="small" muted>
                    Contact for current pricing
                  </Text>
                )}
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => setDescriptionModalOpen(true)}
                  className="uppercase tracking-[0.14em]"
                >
                  Description
                </Button>
              </div>

              <div className="mt-8 flex flex-col gap-5">
                <ProductQuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                />

                <Button
                  variant="primary"
                  size="lg"
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 uppercase tracking-button md:py-4"
                >
                  {isInCart(
                    peptide.id,
                    variants?.length ? effectiveVariantId : undefined
                  )
                    ? 'Add More to Cart'
                    : 'Add to Cart'}
                </Button>

                <Text variant="small" className="leading-relaxed text-neutral-600">
                  Each batch is analytically verified for purity and identity.
                  Certificates of Analysis available.
                </Text>
              </div>
            </div>
          </div>

          {/* Suggested Peptides - Above Accordion */}
          <div className="mx-auto mt-10 w-full max-w-6xl md:mt-12">
            <SuggestedPeptides currentPeptide={peptide} maxSuggestions={4} />
          </div>

          <div className="mx-auto mt-8 w-full max-w-6xl border-t border-carbon-900/10 pt-8 md:mt-10 md:pt-10">
            <ProductPageAccordion
              openId={accordionOpenId}
              onOpenIdChange={setAccordionOpenId}
              sections={[
                {
                  id: 'overview',
                  title: 'OVERVIEW',
                  content:
                    copy.paragraphs.length > 0 ? (
                      <ProductOverviewBody paragraphs={copy.paragraphs} />
                    ) : (
                      <Text variant="body" className="text-neutral-600">
                        Product description coming soon.
                      </Text>
                    ),
                },
                {
                  id: 'specifications',
                  title: 'SPECIFICATIONS',
                  content: (
                    <div className="space-y-3">
                      <Text variant="body" className="text-neutral-600">
                        <strong className="text-carbon-900">Compound:</strong>{' '}
                        {peptide.name}
                      </Text>
                      {selectedVariant && (
                        <Text variant="body" className="text-neutral-600">
                          <strong className="text-carbon-900">Strength:</strong>{' '}
                          {selectedVariant.label}
                        </Text>
                      )}
                      <Text variant="body" className="text-neutral-600">
                        <strong className="text-carbon-900">Appearance:</strong>{' '}
                        {liquidAncillary
                          ? 'Liquid'
                          : 'Lyophilised powder (research grade), unless otherwise stated for ancillary products.'}
                      </Text>
                      <Text variant="body" className="text-neutral-600">
                        <strong className="text-carbon-900">Purity (stated):</strong>{' '}
                        {liquidAncillary ? 'N/A' : peptide.purity}
                      </Text>
                      <Text variant="body" muted className="text-sm italic">
                        Extended specification tables and lot-specific data may
                        be added here as they become available.
                      </Text>
                    </div>
                  ),
                },
                {
                  id: 'analytical',
                  title: 'ANALYTICAL VERIFICATION',
                  content: (
                    <div className="space-y-4">
                      <Text variant="body" className="text-neutral-600">
                        We provide batch-oriented Certificates of Analysis where
                        available to support identity and purity claims.
                      </Text>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Link to="/coa">
                          <Button variant="outline" size="md">
                            View all COAs
                          </Button>
                        </Link>
                        {coaFile && (
                          <Button
                            variant="accent"
                            size="md"
                            href={coaPdfPublicUrl(coaFile)}
                            download={coaFile}
                          >
                            Download COA (PDF)
                          </Button>
                        )}
                      </div>
                      {!coaFile && (
                        <Text variant="small" muted>
                          A downloadable PDF for this line is not yet linked;
                          check the COA directory or contact us for the batch you
                          hold.
                        </Text>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'storage',
                  title: 'STORAGE & HANDLING',
                  content: (
                    <div className="space-y-3">
                      {liquidAncillary ? (
                        <Text variant="body" className="text-neutral-600">
                          Store sealed liquid ancillaries in line with the label
                          and standard laboratory practice: cool, dry, and
                          protected from light unless otherwise directed.
                        </Text>
                      ) : (
                        <>
                          <Text variant="body" className="text-neutral-600">
                            Store in line with standard laboratory practice: cool,
                            dry, and protected from light where applicable. Many
                            lyophilised peptides are held refrigerated prior to
                            reconstitution.
                          </Text>
                          <Text variant="body" className="text-neutral-600">
                            After reconstitution, follow your institution’s SOPs
                            and relevant literature for stability and handling.
                          </Text>
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'research-notice',
                  title: 'RESEARCH USE NOTICE',
                  content: (
                    <Text variant="body" className="text-neutral-600 leading-relaxed">
                      All materials are supplied strictly for{' '}
                      <strong className="font-medium text-carbon-900">
                        laboratory research use only
                      </strong>
                      . They are not intended for human consumption, medical
                      use, or therapeutic application. Purchasers acknowledge use
                      exclusively within a qualified research environment.
                    </Text>
                  ),
                },
              ]}
            />
          </div>
        </Section>
      </main>

      <ProductDescriptionModal
        open={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
        productTitle={peptide.name}
        paragraphs={copy.paragraphs}
      />
    </div>
  );
}
