import { Peptide, allPeptides } from '../../data/peptides';
import PeptideCard from '../peptides/PeptideCard';
import { Heading } from '../ui/Typography';

interface SuggestedPeptidesProps {
  currentPeptide: Peptide;
  maxSuggestions?: number;
}

export default function SuggestedPeptides({ currentPeptide, maxSuggestions = 4 }: SuggestedPeptidesProps) {
  // Find peptides with similar categories/filters
  const suggestedPeptides = allPeptides
    .filter((p) => {
      // Don't suggest the current peptide
      if (p.id === currentPeptide.id) return false;

      // Check if it shares any library filters with current peptide
      return p.libraryFilters.some((filter) =>
        currentPeptide.libraryFilters.includes(filter)
      );
    })
    .slice(0, maxSuggestions);

  if (suggestedPeptides.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Heading level={4} className="mb-4 text-center text-carbon-900 md:mb-5">
        You may also be interested in
      </Heading>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {suggestedPeptides.map((peptide) => (
          <PeptideCard key={peptide.id} peptide={peptide} />
        ))}
      </div>
    </div>
  );
}
