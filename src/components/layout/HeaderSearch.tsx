import { useEffect, useRef, useState, FormEvent, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import SearchField from '../ui/SearchField';
import { Text } from '../ui/Typography';
import { allPeptides, filterPeptidesByName } from '../../data/peptides';
import { getProductSlug } from '../../data/productContent';
import { getDisplayPriceForPeptide } from '../../data/productPricing';

interface HeaderSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HeaderSearch({ isOpen, onClose }: HeaderSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return filterPeptidesByName(trimmed, allPeptides).slice(0, 6);
  }, [query]);

  const runSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/library');
      onClose();
      return;
    }
    const matches = filterPeptidesByName(trimmed, allPeptides);
    if (matches.length === 1) {
      navigate(`/products/${getProductSlug(matches[0].id)}`);
      onClose();
      return;
    }
    navigate(`/library?q=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[110] bg-carbon-900/60 animate-fadeIn"
        onClick={onClose}
        aria-label="Close search"
      />
      <div
        className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[120] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-sm border border-carbon-900/10 bg-white shadow-xl sm:top-[18%] overscroll-contain"
        role="dialog"
        aria-modal="true"
        aria-label="Search compounds"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="-m-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-grey hover:text-carbon-900 touch-manipulation"
              aria-label="Close search"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <SearchField
              ref={inputRef}
              type="search"
              placeholder="Search compounds..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search compounds"
            />
          </div>
          <Text variant="caption" muted className="block text-center leading-snug">
            {query.trim() ? 'Click result or press Enter to view all matches' : 'Press Enter to search — same matching as the library.'}
          </Text>
        </form>

        {searchResults.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto border-t border-carbon-900/10 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {searchResults.map((peptide) => (
                <Link
                  key={peptide.id}
                  to={`/products/${getProductSlug(peptide.id)}`}
                  onClick={onClose}
                  className="group flex flex-col rounded-sm border border-carbon-900/10 bg-neutral-50 p-2 transition-all hover:border-accent hover:shadow-md"
                >
                  <div className="mb-2 aspect-square overflow-hidden rounded bg-white">
                    <img
                      src={peptide.image}
                      alt={peptide.name}
                      loading="lazy"
                      className="h-full w-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <Text variant="caption" className="mb-1 line-clamp-2 text-xs font-medium text-carbon-900">
                    {peptide.name}
                  </Text>
                  <Text variant="caption" muted className="text-[10px]">
                    {getDisplayPriceForPeptide(peptide.id) ?? 'Contact'}
                  </Text>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
