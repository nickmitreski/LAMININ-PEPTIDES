import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { Label, Text } from '../ui/Typography';
import { Peptide } from '../../data/peptides';
import { getProductSlug } from '../../data/productContent';
import { getDisplayPriceForPeptide, getNumericPriceForVariantOrPeptide } from '../../data/productPricing';
import { ArrowRight, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

interface PeptideCardProps {
  peptide: Peptide;
}

const addToCartClass =
  'btn inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-[0.65rem] font-semibold uppercase leading-tight tracking-wide bg-accent text-carbon-900 border border-carbon-900/15 shadow-sm transition-all duration-200 hover:bg-accent-dark active:scale-[0.99] active:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-carbon-900 sm:min-h-0 sm:px-4 sm:text-xs';

export default function PeptideCard({ peptide }: PeptideCardProps) {
  const title = peptide.name.toUpperCase();
  const productPath = `/products/${getProductSlug(peptide.id)}`;
  const priceLabel = getDisplayPriceForPeptide(peptide.id);
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    const price = getNumericPriceForVariantOrPeptide(peptide.id);
    if (!price) {
      showToast('Price not available for this product', 'error');
      return;
    }

    addItem(
      {
        peptideId: peptide.id,
        name: peptide.name,
        price,
        image: peptide.image,
      },
      1
    );
    showToast(`${peptide.name} added to cart`, 'success');
  };

  return (
    <div className="group flex h-full flex-col motion-safe:transition-transform motion-safe:duration-300 md:hover:-translate-y-1">
      <Link to={productPath} className="block touch-manipulation active:opacity-90">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-neutral-50 sm:mb-4">
          <img
            src={peptide.image}
            alt={`${peptide.name} — laboratory vial`}
            loading="lazy"
            className="h-full w-full object-contain p-2 transition-transform duration-300 motion-safe:group-hover:scale-105 sm:p-4"
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
        <button
          type="button"
          onClick={handleAddToCart}
          className={addToCartClass}
          aria-label={`Add ${peptide.name} to cart`}
        >
          <ShoppingCart className="h-4 w-4" strokeWidth={2} aria-hidden />
          Add to cart
        </button>
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
