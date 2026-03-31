import { useEffect, useRef, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import SearchField from '../ui/SearchField';
import Button from '../ui/Button';
import { Text } from '../ui/Typography';
import { allPeptides, filterPeptidesByName } from '../../data/peptides';
import { getProductSlug } from '../../data/productContent';

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
        className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[120] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-sm border border-carbon-900/10 bg-white p-4 shadow-xl sm:top-[18%] overscroll-contain"
        role="dialog"
        aria-modal="true"
        aria-labelledby="header-search-title"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <span id="header-search-title" className="text-sm font-medium text-carbon-900">
              Search catalogue
            </span>
            <button
              type="button"
              onClick={onClose}
              className="-m-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-grey hover:text-carbon-900 touch-manipulation"
              aria-label="Close search"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <SearchField
            ref={inputRef}
            type="search"
            placeholder="Search compounds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search compounds"
          />
          <Text variant="caption" muted className="block leading-snug">
            Uses the same name matching as the library. If only one compound
            matches, you go straight to its product page.
          </Text>
          <Button type="submit" variant="primary" size="md" className="w-full">
            Search
          </Button>
        </form>
      </div>
    </>
  );
}
