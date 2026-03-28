import { ReactNode } from 'react';

interface IconTileProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  tone?: 'muted' | 'light';
}

export default function IconTile({
  children,
  className = '',
  size = 'md',
  tone = 'muted',
}: IconTileProps) {
  const sizeClass = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';
  const toneClass = tone === 'light'
    ? 'bg-white border-carbon-900/10'
    : 'bg-grey border-carbon-900/10';

  return (
    <div
      className={`${sizeClass} ${toneClass} rounded-xl border flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}
