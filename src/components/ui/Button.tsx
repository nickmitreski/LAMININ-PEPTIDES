interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'white' | 'outline' | 'ghost' | 'link' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  'aria-label'?: string;
  role?: React.AriaRole;
  'aria-selected'?: boolean;
  /** When set, renders an anchor (e.g. for file download). */
  href?: string;
  /** Suggested filename for `Content-Disposition` when used with `href` to a PDF. */
  download?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  role,
  'aria-selected': ariaSelected,
  href,
  download,
}: ButtonProps) {
  const baseStyles = 'btn focus-visible:ring-carbon-900';

  const variants = {
    primary: 'bg-carbon-900 text-white hover:bg-carbon-900/85 active:bg-carbon-900/95',
    secondary: 'bg-grey text-carbon-900 hover:bg-grey/70 active:bg-grey/50',
    white: 'bg-white text-carbon-900 hover:bg-grey active:bg-grey/80',
    outline: 'border border-carbon-900/15 text-carbon-900 hover:border-carbon-900 hover:bg-grey active:bg-grey/80',
    ghost: 'text-carbon-900 hover:bg-grey active:bg-grey/70',
    link: 'text-carbon-900 hover:text-carbon-900/70 underline-offset-4 hover:underline',
    accent:
      'bg-accent text-carbon-900 border border-accent-dark/25 hover:bg-accent-dark active:bg-accent-dark/90',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-sm',
    md: 'px-6 py-2.5 text-sm rounded-sm',
    lg: 'px-8 py-3 text-sm rounded-sm',
  };

  const composed = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        download={download}
        aria-label={ariaLabel}
        className={composed}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      role={role}
      aria-selected={ariaSelected}
      className={composed}
    >
      {children}
    </button>
  );
}
