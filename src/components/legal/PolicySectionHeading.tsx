import type { ReactNode } from 'react';
import { Heading } from '../ui/Typography';

/** Teal bar + white bold title — used on policy pages (e.g. Guarantee, Shipping). */
export default function PolicySectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 rounded-sm border border-white/25 bg-accent-dark px-4 py-3.5 shadow-sm">
      <Heading level={4} className="!mb-0 !font-bold !text-white">
        {children}
      </Heading>
    </div>
  );
}
