interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'dark' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = ''
}: BadgeProps) {
  const variants = {
    neutral: 'bg-grey text-carbon-900/60 border-carbon-900/10',
    accent: 'bg-accent/10 text-carbon-900 border-accent/20',
    dark: 'bg-carbon-900 text-white border-carbon-900',
    success: 'bg-accent/10 text-carbon-900 border-accent/20',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
