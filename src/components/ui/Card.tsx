interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  as = 'div',
}: CardProps) {
  const Component = as as keyof JSX.IntrinsicElements;

  const variants = {
    default: 'bg-white border border-carbon-900/10',
    bordered: 'bg-white border-2 border-carbon-900/15',
    elevated: 'bg-white shadow-md border border-grey',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const hoverClass = hover
    ? 'hover:border-carbon-900/15 hover:shadow-md transition-all duration-200'
    : '';

  return (
    <Component
      className={`
        ${variants[variant]}
        ${paddings[padding]}
        ${hoverClass}
        rounded-xl
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
