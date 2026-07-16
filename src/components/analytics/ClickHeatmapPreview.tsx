import { useMemo } from 'react';

export type HeatmapPoint = {
  x: number;
  y: number;
  vw: number;
  vh: number;
};

type Props = {
  points: HeatmapPoint[];
  className?: string;
};

const GRID = 24;

function bucketKey(leftPct: number, topPct: number): string {
  const gx = Math.min(GRID - 1, Math.floor((leftPct / 100) * GRID));
  const gy = Math.min(GRID - 1, Math.floor((topPct / 100) * GRID));
  return `${gx}:${gy}`;
}

function heatColor(intensity: number): string {
  const t = Math.min(1, intensity);
  const r = Math.round(255 * t);
  const g = Math.round(200 * (1 - t));
  const b = Math.round(80 * (1 - t));
  const alpha = 0.25 + t * 0.55;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Click-density heatmap. Normalises coords to a phone aspect box and buckets
 * overlapping clicks for a clearer density read.
 */
export default function ClickHeatmapPreview({ points, className = '' }: Props) {
  const buckets = useMemo(() => {
    if (!points.length) return [];
    const refW = points[0]?.vw || 390;
    const refH = points[0]?.vh || 844;
    const map = new Map<string, { left: number; top: number; count: number }>();

    for (const p of points.slice(0, 800)) {
      const left = Math.min(100, Math.max(0, (p.x / refW) * 100));
      const top = Math.min(100, Math.max(0, (p.y / refH) * 100));
      const key = bucketKey(left, top);
      const cell = map.get(key);
      if (cell) {
        cell.count += 1;
      } else {
        const gx = Math.floor((left / 100) * GRID);
        const gy = Math.floor((top / 100) * GRID);
        map.set(key, {
          left: ((gx + 0.5) / GRID) * 100,
          top: ((gy + 0.5) / GRID) * 100,
          count: 1,
        });
      }
    }

    const max = Math.max(...[...map.values()].map((v) => v.count), 1);
    return [...map.values()].map((b) => ({
      ...b,
      intensity: b.count / max,
      size: 12 + b.count * 4,
    }));
  }, [points]);

  if (!buckets.length) {
    return (
      <p className="text-sm text-carbon-500">No click coordinates yet for this period.</p>
    );
  }

  return (
    <div
      className={`relative aspect-[9/16] w-full max-w-xs overflow-hidden rounded-sm border border-carbon-200 bg-gradient-to-b from-carbon-50 to-white ${className}`}
      aria-label="Click heatmap"
    >
      {buckets.map((dot, i) => (
        <span
          key={i}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[1px]"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: dot.size,
            height: dot.size,
            backgroundColor: heatColor(dot.intensity),
          }}
        />
      ))}
      <div className="absolute bottom-2 left-2 rounded-sm bg-white/90 px-2 py-1 text-xs text-carbon-600">
        {points.length} clicks • {buckets.length} zones
      </div>
    </div>
  );
}
