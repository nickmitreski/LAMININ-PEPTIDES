import { forwardRef, InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** When false, renders a plain field matching `.input` styling (no overlap issues). */
  showIcon?: boolean;
  wrapperClassName?: string;
}

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    { showIcon = true, className = '', wrapperClassName = '', ...props },
    ref
  ) => (
    <div className={`relative w-full ${wrapperClassName}`}>
      {showIcon && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center text-carbon-900/35"
          aria-hidden
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
        </span>
      )}
      <input
        ref={ref}
        className={`input ${showIcon ? '!pl-11' : ''} ${className}`}
        {...props}
      />
    </div>
  )
);

SearchField.displayName = 'SearchField';

export default SearchField;
