import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { allPeptides, type Peptide } from '../../data/peptides';
import { getProductSlug } from '../../data/productContent';
import { getDisplayPriceForPeptide } from '../../data/productPricing';
import ShopProductImage from '../ui/ShopProductImage';
import { Label, Text } from '../ui/Typography';

interface SuggestedPeptidesProps {
  currentPeptide: Peptide;
  maxSuggestions?: number;
}

/**
 * Displays suggested related peptides as small product cards with image,
 * name, category, and price.
 */
export default function SuggestedPeptides({
  currentPeptide,
  maxSuggestions = 4,
}: SuggestedPeptidesProps) {
  const relatedPeptides = allPeptides
    .filter((peptide) => {
      if (peptide.id === currentPeptide.id) return false;
      if (peptide.purity === 'N/A') return false;
      return peptide.libraryFilters.some((filter) =>
        currentPeptide.libraryFilters.includes(filter)
      );
    })
    .slice(0, maxSuggestions);

  if (relatedPeptides.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {relatedPeptides.map((peptide) => {
        const price = getDisplayPriceForPeptide(peptide.id);
        return (
          <Link
            key={peptide.id}
            to={`/products/${getProductSlug(peptide.id)}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-carbon-900/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
          >
            <div className="relative aspect-square bg-neutral-50">
              <ShopProductImage
                src={peptide.image}
                alt={`${peptide.name} — laboratory vial`}
                className="relative block h-full w-full"
                imgClassName="h-full w-full object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-3">
              <Label inheritColor className="mb-1 line-clamp-2 text-[0.6rem] leading-tight text-carbon-900 sm:text-[0.65rem]">
                {peptide.name}
              </Label>
              <Text variant="caption" muted className="mb-2 text-[0.6rem] sm:text-xs">
                {peptide.category} · {peptide.purity}
              </Text>
              <div className="mt-auto flex items-center justify-between">
                {price && (
                  <Text variant="caption" weight="medium" className="text-carbon-900">
                    {price}
                  </Text>
                )}
                <ArrowRight className="h-3 w-3 text-carbon-900/40 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-dark" strokeWidth={2} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
