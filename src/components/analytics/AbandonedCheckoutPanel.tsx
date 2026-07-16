import { formatPrice } from '../../lib/formatCurrency';
import { Text } from '../ui/Typography';

export type AbandonedSession = {
  sessionId: string;
  cartTotal: number;
  cartItemCount: number;
  durationMs: number;
  lastAt: string;
};

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

type Props = {
  sessions: AbandonedSession[];
};

export default function AbandonedCheckoutPanel({ sessions }: Props) {
  if (!sessions.length) {
    return <Text variant="small" muted>No abandoned checkout sessions in this period.</Text>;
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <div
          key={s.sessionId}
          className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-carbon-200 bg-white px-3 py-2"
        >
          <div className="min-w-0">
            <Text variant="small" weight="medium" className="truncate font-mono text-xs">
              {s.sessionId.slice(0, 12)}…
            </Text>
            <Text variant="caption" muted>
              {s.cartItemCount} item{s.cartItemCount === 1 ? '' : 's'} • {formatDuration(s.durationMs)} on checkout
            </Text>
          </div>
          <div className="shrink-0 text-right">
            <Text variant="small" weight="medium">
              {formatPrice(s.cartTotal)}
            </Text>
            <Text variant="caption" muted>
              {new Date(s.lastAt).toLocaleString('en-AU', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}
