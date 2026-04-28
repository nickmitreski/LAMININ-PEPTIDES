import { Link, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { Label, Text } from '../ui/Typography';
import { Peptide } from '../../data/peptides';
import { getProductSlug } from '../../data/productContent';
import {
  getDisplayPriceForPeptide,
  getNumericPriceForVariantOrPeptide,
  getVariants,
} from '../../data/productPricing';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useShopImages } from '../../context/ShopImagesContext';
import ShopProductImage from '../ui/ShopProductImage';
import { ArrowRight, Plus, ShoppingCart, Check } from 'lucide-react';

interface PeptideCardProps {
  peptide: Peptide;
}

export default function PeptideCard({ peptide }: PeptideCardProps) {
  const title = peptide.name.toUpperCase();
  const productPath = `/products/${getProductSlug(peptide.id)}`;
  const priceLabel = getDisplayPriceForPeptide(peptide.id);
  const variants = getVariants(peptide.id);
  const hasVariants = !!variants?.length;

  const { resolveDisplayImage } = useShopImages();
  const cardImage = resolveDisplayImage(
    peptide.id,
    hasVariants ? variants?.[0]?.id : undefined,
    peptide.image
  );

  const { addItem, isInCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const inCart = isInCart(peptide.id, hasVariants ? variants?.[0]?.id : undefined);

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasVariants) {
      navigate(productPath);
      return;
    }

    const price = getNumericPriceForVariantOrPeptide(peptide.id);
    if (price === null) {
      navigate(productPath);
      return;
    }

    addItem({
      peptideId: peptide.id,
      name: peptide.name,
      price,
      image: cardImage,
      purity: peptide.purity,
    });
    showToast(`${peptide.name} added to cart`, 'success', 2500);
  };

  return (
    <div className="group flex h-full flex-col motion-safe:transition-transform motion-safe:duration-300 md:hover:-translate-y-1">
      <Link to={productPath} className="block touch-manipulation active:opacity-90">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-neutral-50 sm:mb-4">
          <ShopProductImage
            src={cardImage}
            alt={`${peptide.name} — laboratory vial`}
            className="relative block h-full w-full"
            imgClassName="h-full w-full object-contain p-2 transition-transform duration-300 motion-safe:group-hover:scale-105 sm:p-4"
          />
          <span
            className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-carbon-900 shadow-sm sm:bottom-3 sm:right-3"
            aria-hidden
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>

        <Label
          inheritColor
          className="mb-1 line-clamp-2 text-[0.65rem] leading-tight text-carbon-900 sm:text-xs"
        >
          {title}
        </Label>
      </Link>
      <Text variant="caption" muted className="mb-2 line-clamp-2 text-[0.65rem] leading-snug sm:mb-3 sm:text-xs">
        {peptide.category}
        {peptide.coaVerified ? ' · COA verified' : ''} · {peptide.purity} purity
        {priceLabel ? ` · ${priceLabel}` : ''}
      </Text>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          variant="accent"
          size="sm"
          className="min-h-10 w-full touch-manipulation text-[0.65rem] sm:min-h-0 sm:text-xs gap-2"
          aria-label={hasVariants ? `Choose options for ${peptide.name}` : `Add ${peptide.name} to cart`}
          onClick={handleAdd}
        >
          {inCart && !hasVariants ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
              Added — add another
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden />
              {hasVariants ? 'Choose options' : 'Add to cart'}
            </>
          )}
        </Button>
        <Link to={productPath} className="block touch-manipulation">
          <Button
            variant="outline"
            size="sm"
            className="group/btn min-h-10 w-full touch-manipulation text-[0.65rem] sm:min-h-0 sm:text-xs"
          >
            View details
            <ArrowRight className="ml-2 inline-block h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
