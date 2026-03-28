interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function Container({
  children,
  className = '',
  size = 'xl'
}: ContainerProps) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    /** Default site rail — between 2xl screen (1536px) and full HD content width */
    xl: 'max-w-[1600px]',
    full: 'max-w-full',
  };

  return (
    <div
      className={`${sizes[size]} mx-auto px-3.5 sm:px-5 md:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}
