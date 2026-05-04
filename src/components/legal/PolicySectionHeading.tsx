import type { ReactNode } from 'react';
import { Heading } from '../ui/Typography';

/** Teal bar + white bold title — used on policy pages (e.g. Guarantee, Shipping). */
export default function PolicySectionHeading({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 rounded-sm border border-white/25 bg-accent-dark px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex-shrink-0 text-white/80 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <Heading level={4} className="!mb-0 !font-bold !text-white">
          {children}
        </Heading>
      </div>
    </div>
  );
}
