import type { ReactNode } from 'react';
import { Heading, Text } from '../ui/Typography';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-carbon-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-800">
            {eyebrow}
          </p>
        ) : null}
        <Heading level={1} className="mb-2 text-carbon-950">
          {title}
        </Heading>
        <Text className="max-w-2xl text-carbon-600">{description}</Text>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
