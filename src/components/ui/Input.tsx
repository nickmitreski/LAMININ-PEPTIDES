import { forwardRef, InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    const helperId = helperText && id ? `${id}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label != null && label !== '' && (
          <label
            htmlFor={id}
            className="mb-2 block text-xs font-medium tracking-wide text-carbon-900"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`input ${error ? 'border-error focus:ring-error focus:border-error' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-xs text-error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-carbon-900/50">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
