import { Label, Heading, Text } from './Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  dark?: boolean;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  /**
   * Disable the reveal-on-scroll entrance animation. Defaults to enabled and
   * automatically respects `prefers-reduced-motion`.
   */
  disableReveal?: boolean;
}

export default function SectionTitle({
  label,
  title,
  subtitle,
  centered = true,
  dark = false,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  disableReveal = false,
}: SectionTitleProps) {
  const alignment = centered ? 'text-center items-center' : 'text-left items-start';
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();

  const revealAttrs = disableReveal
    ? {}
    : { ref, 'data-revealed': revealed };
  const revealClass = disableReveal ? '' : 'reveal';

  return (
    <div
      {...revealAttrs}
      className={`mb-8 flex flex-col gap-3 md:mb-12 ${alignment} ${revealClass} ${className}`}
    >
      {label && (
        <Label
          inheritColor={dark}
          tone={dark ? 'inverse-muted' : 'muted'}
        >
          {label}
        </Label>
      )}
      <Heading
        level={2}
        className={[dark ? 'text-white' : '', titleClassName].filter(Boolean).join(' ')}
      >
        {title}
      </Heading>
      {subtitle && (
        <Text
          variant="body"
          weight="light"
          tone={dark ? 'inverse-muted' : 'muted'}
          className={['max-w-3xl', centered ? 'mx-auto' : '', subtitleClassName]
            .filter(Boolean)
            .join(' ')}
        >
          {subtitle}
        </Text>
      )}
    </div>
  );
}
