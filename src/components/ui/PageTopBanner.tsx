import { Heading, Text } from './Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

interface PageTopBannerProps {
  title: string;
  subtitle: string;
  className?: string;
}

export default function PageTopBanner({
  title,
  subtitle,
  className = '',
}: PageTopBannerProps) {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={`reveal mx-auto mb-8 w-full max-w-6xl rounded-xl border border-carbon-900/20 bg-accent px-5 py-7 sm:px-8 sm:py-8 md:mb-10 ${className}`}
    >
      <Heading level={2} className="!font-bold">
        {title}
      </Heading>
      <Text variant="body" className="mt-3 max-w-4xl text-carbon-900">
        {subtitle}
      </Text>
    </div>
  );
}
