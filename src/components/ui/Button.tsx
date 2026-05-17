interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'white' | 'outline' | 'ghost' | 'link' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  /** Native tooltip (button) or anchor title. */
  title?: string;
  'aria-label'?: string;
  role?: React.AriaRole;
  'aria-selected'?: boolean;
  /** When set, renders an anchor (e.g. for file download). */
  href?: string;
  /** Suggested filename for `Content-Disposition` when used with `href` to a PDF. */
  download?: string;
  /** Only used when `href` is set (external links). */
  rel?: string;
  target?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  title,
  'aria-label': ariaLabel,
  role,
  'aria-selected': ariaSelected,
  href,
  download,
  rel,
  target,
}: ButtonProps) {
  // `disabled:hover:bg-*` overrides reset the hover background to the base
  // variant colour when the button is disabled, killing the "looks clickable"
  // illusion without changing per-variant CSS.
  const baseStyles = 'btn focus-visible:ring-carbon-900 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-carbon-900 text-white hover:bg-carbon-900/85 active:bg-carbon-900/95 disabled:hover:bg-carbon-900',
    secondary:
      'bg-grey text-carbon-900 hover:bg-grey/70 active:bg-grey/50 disabled:hover:bg-grey',
    white:
      'bg-white text-carbon-900 hover:bg-grey active:bg-grey/80 disabled:hover:bg-white',
    outline:
      'border border-carbon-900/15 text-carbon-900 hover:border-carbon-900 hover:bg-grey active:bg-grey/80 disabled:hover:border-carbon-900/15 disabled:hover:bg-transparent',
    ghost:
      'text-carbon-900 hover:bg-grey active:bg-grey/70 disabled:hover:bg-transparent',
    link:
      'text-carbon-900 hover:text-carbon-900/70 underline-offset-4 hover:underline disabled:hover:text-carbon-900 disabled:hover:no-underline',
    accent:
      'bg-accent text-carbon-900 border border-accent-dark/25 hover:bg-accent-dark active:bg-accent-dark/90 disabled:hover:bg-accent',
    danger:
      'bg-error text-white border border-error-dark/30 hover:bg-error-dark active:bg-error-dark/90 focus-visible:ring-error disabled:hover:bg-error',
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
        title={title}
        rel={rel}
        target={target}
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
      title={title}
      aria-label={ariaLabel}
      role={role}
      aria-selected={ariaSelected}
      className={composed}
    >
      {children}
    </button>
  );
}
