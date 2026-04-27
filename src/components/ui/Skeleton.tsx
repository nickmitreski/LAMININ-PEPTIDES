import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional rounded variant. Defaults to subtle 2px radius matching the design system. */
  rounded?: 'sm' | 'md' | 'full';
}

/**
 * Skeleton placeholder. Use to reserve layout space and convey loading state
 * for content that has a known structure (table rows, cards, hero blocks).
 *
 * Animation respects `prefers-reduced-motion` via the `animate-pulse` utility,
 * which is paused when reduced motion is requested by the OS.
 */
export default function Skeleton({
  className = '',
  rounded = 'sm',
  ...rest
}: SkeletonProps) {
  const radius =
    rounded === 'full' ? 'rounded-full' : rounded === 'md' ? 'rounded-md' : 'rounded-sm';
  return (
    <div
      role="status"
      aria-hidden="true"
      className={`animate-pulse bg-neutral-200/70 ${radius} ${className}`}
      {...rest}
    />
  );
}
