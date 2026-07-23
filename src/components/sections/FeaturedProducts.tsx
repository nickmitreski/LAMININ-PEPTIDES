import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import SectionTitle from '../ui/SectionTitle';
import Button from '../ui/Button';
import { Label, Text } from '../ui/Typography';
import {
  featuredProducts,
  getDisplayPriceForPeptide,
} from '../../data/featuredProducts';
import { getProductSlug } from '../../data/productContent';
import useScrollReveal from '../../hooks/useScrollReveal';
import { useShopImages } from '../../context/ShopImagesContext';
import ShopProductImage from '../ui/ShopProductImage';

export default function FeaturedProducts() {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();
  const { resolveDisplayImage, resolveSaleInfo } = useShopImages();

  return (
    <Section background="white" spacing="xl">
      <SectionTitle
        label="PEPTIDE LIBRARY"
        title="High purity peptides for advanced research applications"
      />

      <div
        ref={ref}
        data-revealed={revealed}
        className="reveal mb-10 grid grid-cols-2 gap-3 sm:mb-12 sm:gap-4 md:grid-cols-4 md:gap-6"
      >
        {featuredProducts.map((product) => {
          const saleInfo = resolveSaleInfo(product.peptideId);
          const priceLabel = getDisplayPriceForPeptide(product.peptideId);
          return (
            <Link
              key={product.peptideId}
              to={`/products/${getProductSlug(product.peptideId)}`}
              className="group flex touch-manipulation flex-col motion-safe:transition-transform motion-safe:duration-300 active:opacity-90 md:hover:-translate-y-1"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-neutral-50 sm:mb-4">
                {saleInfo && (
                  <span className="absolute left-2 top-2 z-10 rounded border border-carbon-900/15 bg-white/95 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-carbon-900 shadow-sm sm:left-3 sm:top-3 sm:text-xs">
                    {saleInfo.saleLabel?.trim() &&
                    !/^sale$/i.test(saleInfo.saleLabel.trim())
                      ? saleInfo.saleLabel
                      : 'Reduced'}
                  </span>
                )}
                <ShopProductImage
                  src={resolveDisplayImage(
                    product.peptideId,
                    undefined,
                    product.image
                  )}
                  alt={product.name}
                  className="relative block h-full w-full"
                  imgClassName="h-full w-full object-contain p-2 transition-transform duration-300 motion-safe:group-hover:scale-105 sm:p-4"
                  width={400}
                  height={400}
                />
              </div>
              <Label
                inheritColor
                className="mb-1 line-clamp-2 text-xs leading-tight text-carbon-900"
              >
                {product.name}
              </Label>
              <Text variant="caption" muted>
                {saleInfo ? (
                  <>
                    <span className="text-carbon-400 line-through">${saleInfo.compareAtPrice.toFixed(0)}</span>
                    {' '}
                    <span className="font-semibold text-accent-700">{priceLabel}</span>
                  </>
                ) : (
                  priceLabel ?? 'Contact for pricing'
                )}
              </Text>
            </Link>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Link to="/library">
          <Button variant="primary" size="md">
            Explore the library
          </Button>
        </Link>
      </div>
    </Section>
  );
}
