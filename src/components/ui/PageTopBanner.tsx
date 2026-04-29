import { Heading, Text } from './Typography';

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
  return (
    <div
      className={`mx-auto mb-8 w-full max-w-6xl rounded-xl border border-carbon-900/10 bg-accent/25 px-5 py-7 sm:px-8 sm:py-8 md:mb-10 ${className}`}
    >
      <Heading level={2} className="!font-bold">
        {title}
      </Heading>
      <Text variant="body" className="mt-3 max-w-4xl text-carbon-900/85">
        {subtitle}
      </Text>
    </div>
  );
}
