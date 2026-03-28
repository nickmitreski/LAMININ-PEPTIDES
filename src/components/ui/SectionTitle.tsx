import { Label, Heading, Text } from './Typography';

interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  dark?: boolean;
  className?: string;
}

export default function SectionTitle({
  label,
  title,
  subtitle,
  centered = true,
  dark = false,
  className = ''
}: SectionTitleProps) {
  const alignment = centered ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`mb-12 flex flex-col gap-3 ${alignment} ${className}`}>
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
        className={dark ? 'text-white' : ''}
      >
        {title}
      </Heading>
      {subtitle && (
        <Text
          variant="body"
          weight="light"
          tone={dark ? 'inverse-muted' : 'muted'}
          className={`max-w-2xl ${centered ? 'mx-auto' : ''}`}
        >
          {subtitle}
        </Text>
      )}
    </div>
  );
}
