import { ReactNode } from 'react';
import Container from './Container';

interface SectionProps {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  background?: 'white' | 'elevated' | 'neutral' | 'dark' | 'accent' | 'none';
  container?: boolean;
  id?: string;
  'aria-labelledby'?: string;
}

export default function Section({
  children,
  className = '',
  spacing = 'md',
  background = 'none',
  container = true,
  id,
  'aria-labelledby': ariaLabelledBy,
}: SectionProps) {
  const spacingClasses = {
    sm: 'py-12 md:py-16',
    md: 'py-16 md:py-20 lg:py-24',
    lg: 'py-20 md:py-24 lg:py-28',
    xl: 'py-20 md:py-28 lg:py-32',
    '2xl': 'py-28 md:py-44 lg:py-56',
    '3xl': 'py-32 md:py-52 lg:py-64',
  };

  const backgroundClasses = {
    white: 'bg-white',                // True white
    elevated: 'bg-white',             // Same as white, semantic name
    neutral: 'bg-neutral-100',        // Grey sections
    dark: 'bg-carbon-900 text-white', // Black sections
    accent: 'bg-accent text-carbon-900', // Aqua sections
    none: '',
  };

  const content = container ? (
    <Container>{children}</Container>
  ) : (
    children
  );

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`
        ${spacingClasses[spacing]}
        ${backgroundClasses[background]}
        ${className}
      `}
    >
      {content}
    </section>
  );
}
