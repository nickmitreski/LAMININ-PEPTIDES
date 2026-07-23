import type { ReactNode } from 'react';
import { Heading, Text } from './Typography';

/* ── Info tile ────────────────────────────────────────────── */

export interface InfoTileData {
  icon: ReactNode;
  label: string;
  value: string;
}

function InfoTile({ icon, label, value }: InfoTileData) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-carbon-900/10 bg-platinum px-4 py-4">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-dark ring-1 ring-accent-200">
        {icon}
      </span>
      <div>
        <Text variant="caption" muted className="uppercase tracking-wide">
          {label}
        </Text>
        <Text variant="small" weight="medium" className="mt-1">
          {value}
        </Text>
      </div>
    </div>
  );
}

/* ── Page hero ────────────────────────────────────────────── */

interface PageHeroProps {
  title: string;
  subtitle: string;
  tiles: InfoTileData[];
  className?: string;
}

/**
 * Reusable page header: aqua banner with title + subtitle, followed by
 * 3 compact info tiles. Matches the Peptide Science / Research Library
 * pattern so every key page has the same structure and sizing.
 */
export default function PageHero({
  title,
  subtitle,
  tiles,
  className = '',
}: PageHeroProps) {
  return (
    <div
      className={`mx-auto max-w-6xl rounded-xl border border-carbon-900/10 bg-white/95 px-6 py-10 shadow-sm sm:px-10 sm:py-12 ${className}`}
    >
      <div className="mx-auto mb-6 w-full max-w-6xl rounded-xl border border-carbon-900/20 bg-accent px-5 py-7 sm:px-8 sm:py-8">
        <Heading level={2} className="!font-bold">
          {title}
        </Heading>
        <Text variant="body" className="mt-3 max-w-4xl text-carbon-900">
          {subtitle}
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <InfoTile key={tile.label} {...tile} />
        ))}
      </div>
    </div>
  );
}
