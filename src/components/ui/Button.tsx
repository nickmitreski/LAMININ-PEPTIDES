interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'white' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  'aria-label'?: string;
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
}: ButtonProps) {
  const baseStyles = 'btn focus-visible:ring-carbon-900';

  const variants = {
    primary: 'bg-carbon-900 text-white hover:bg-carbon-900/85 active:bg-carbon-900/95',
    secondary: 'bg-grey text-carbon-900 hover:bg-grey/70 active:bg-grey/50',
    white: 'bg-white text-carbon-900 hover:bg-grey active:bg-grey/80',
    outline: 'border border-carbon-900/15 text-carbon-900 hover:border-carbon-900 hover:bg-grey active:bg-grey/80',
    ghost: 'text-carbon-900 hover:bg-grey active:bg-grey/70',
    link: 'text-carbon-900 hover:text-carbon-900/70 underline-offset-4 hover:underline',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-sm',
    md: 'px-6 py-2.5 text-sm rounded-sm',
    lg: 'px-8 py-3 text-sm rounded-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
