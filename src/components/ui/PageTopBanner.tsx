import type { ReactNode } from 'react';
import { Heading, Text } from './Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

interface PageTopBannerProps {
  title: string;
  subtitle: string;
  /** Small uppercase label rendered above the title (e.g. "COMPOUND LIBRARY"). */
  eyebrow?: string;
  /** Optional icon rendered inside the eyebrow pill. */
  icon?: ReactNode;
  className?: string;
}

export default function PageTopBanner({
  title,
  subtitle,
  eyebrow,
  icon,
  className = '',
}: PageTopBannerProps) {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={`reveal mx-auto mb-8 w-full max-w-6xl rounded-xl border border-carbon-900/20 bg-accent px-5 py-7 sm:px-8 sm:py-8 md:mb-10 ${className}`}
    >
      {eyebrow && (
        <span className="reveal-delay-1 mb-4 inline-flex items-center gap-2 rounded-full border border-carbon-900/20 bg-white/55 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-carbon-900/80 backdrop-blur-sm">
          {icon && <span className="flex-shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
          {eyebrow}
        </span>
      )}
      <Heading level={2} className="!font-bold">
        {title}
      </Heading>
      <Text variant="body" className="mt-3 max-w-4xl text-carbon-900">
        {subtitle}
      </Text>
    </div>
  );
}
