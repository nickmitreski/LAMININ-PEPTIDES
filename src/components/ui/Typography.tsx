import { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

interface HeadingProps extends TypographyProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
}

export function Heading({
  children,
  level = 1,
  className = '',
  as,
  id,
}: HeadingProps) {
  const Component = (as || `h${level}`) as keyof JSX.IntrinsicElements;

  const styles = {
    1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold uppercase leading-[1.25] tracking-[0.12em] sm:tracking-[0.18em] md:tracking-[0.22em] lg:tracking-[0.26em]',
    2: 'text-lg md:text-xl lg:text-2xl font-bold uppercase leading-[1.25] tracking-[0.12em] sm:tracking-[0.16em] md:tracking-[0.20em]',
    3: 'text-base md:text-lg font-bold uppercase leading-[1.25] tracking-[0.12em] sm:tracking-[0.14em]',
    4: 'text-sm md:text-base font-bold uppercase leading-[1.25] tracking-[0.10em] sm:tracking-[0.12em]',
    5: 'text-sm md:text-base font-bold uppercase leading-[1.25] tracking-[0.08em]',
    6: 'text-xs font-bold uppercase leading-[1.25] tracking-[0.08em]',
  };

  return (
    <Component id={id} className={`${styles[level]} ${className}`}>
      {children}
    </Component>
  );
}

interface TextProps extends TypographyProps {
  variant?: 'body' | 'lead' | 'small' | 'caption';
  weight?: 'light' | 'normal' | 'medium' | 'semibold';
  muted?: boolean;
  tone?: 'default' | 'muted' | 'inverse' | 'inverse-muted';
}

export function Text({
  children,
  variant = 'body',
  weight = 'normal',
  muted = false,
  tone = 'default',
  className = '',
  as = 'p'
}: TextProps) {
  const Component = as as keyof JSX.IntrinsicElements;

  const variants = {
    lead: 'text-lg md:text-xl leading-relaxed',
    body: 'text-base leading-relaxed',
    small: 'text-sm',
    caption: 'text-xs',
  };

  const weights = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
  };

  const tones = {
    default: '',
    muted: 'text-neutral-500',
    inverse: 'text-white',
    'inverse-muted': 'text-white/50',
  };

  const colorClass = muted ? tones.muted : tones[tone];

  return (
    <Component
      className={`${variants[variant]} ${weights[weight]} ${colorClass} ${className}`}
    >
      {children}
    </Component>
  );
}

interface LabelProps extends TypographyProps {
  uppercase?: boolean;
  muted?: boolean;
  inheritColor?: boolean;
  tone?: 'default' | 'muted' | 'inverse' | 'inverse-muted';
}

export function Label({
  children,
  uppercase = true,
  muted = false,
  inheritColor = false,
  tone = 'default',
  className = '',
  as = 'span'
}: LabelProps) {
  const Component = as as keyof JSX.IntrinsicElements;
  const tones = {
    default: 'text-neutral-500',
    muted: 'text-neutral-400',
    inverse: 'text-white',
    'inverse-muted': 'text-white/40',
  };
  const colorClass = inheritColor ? '' : (muted ? tones.muted : tones[tone]);
  const transformClass = uppercase ? 'uppercase' : '';

  return (
    <Component
      className={`text-xs font-medium tracking-widest ${transformClass} ${colorClass} ${className}`}
    >
      {children}
    </Component>
  );
}
