import { Link } from 'react-router-dom';
import { allPeptides, type Peptide } from '../../data/peptides';
import { getProductSlug } from '../../data/productContent';
import { Text } from '../ui/Typography';

interface SuggestedPeptidesProps {
  currentPeptide: Peptide;
  maxSuggestions?: number;
}

/**
 * Displays suggested related peptides based on shared library filters (categories).
 * Shows as clickable chips above the product dropdown menu.
 */
export default function SuggestedPeptides({
  currentPeptide,
  maxSuggestions = 3,
}: SuggestedPeptidesProps) {
  // Find peptides that share at least one category with the current peptide
  const relatedPeptides = allPeptides
    .filter((peptide) => {
      // Exclude current peptide
      if (peptide.id === currentPeptide.id) return false;

      // Exclude liquid ancillaries
      if (peptide.purity === 'N/A') return false;

      // Check if this peptide shares any categories with current peptide
      return peptide.libraryFilters.some((filter) =>
        currentPeptide.libraryFilters.includes(filter)
      );
    })
    .slice(0, maxSuggestions);

  if (relatedPeptides.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 mb-2">
      <Text variant="caption" weight="medium" className="mb-2.5 block text-neutral-600 uppercase tracking-[0.16em]">
        Related compounds
      </Text>
      <div className="flex flex-wrap gap-2">
        {relatedPeptides.map((peptide) => (
          <Link
            key={peptide.id}
            to={`/products/${getProductSlug(peptide.id)}`}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-carbon-900 bg-neutral-100 border border-neutral-200 rounded-sm hover:bg-accent hover:border-accent transition-colors touch-manipulation"
          >
            {peptide.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
