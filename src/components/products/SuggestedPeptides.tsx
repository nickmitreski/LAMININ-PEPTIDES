import { Link } from 'react-router-dom';
import { allPeptides, type Peptide } from '../../data/peptides';
import { getProductSlug } from '../../data/productContent';

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
  maxSuggestions = 4,
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
    <div className="mt-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {relatedPeptides.map((peptide) => (
          <Link
            key={peptide.id}
            to={`/products/${getProductSlug(peptide.id)}`}
            className="group flex min-w-[132px] items-center gap-2 rounded-sm border border-carbon-900/15 bg-white px-2 py-2 transition-colors hover:border-accent hover:bg-accent/20"
          >
            <img
              src={peptide.image}
              alt={peptide.name}
              loading="lazy"
              decoding="async"
              className="h-10 w-10 rounded-sm object-cover"
            />
            <span className="line-clamp-2 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-carbon-900">
              {peptide.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
