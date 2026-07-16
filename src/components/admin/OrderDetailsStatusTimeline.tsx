import { Clock } from 'lucide-react';
import type { OrderStatusHistoryRow } from '../../services/supabaseService';
import type { PaymentEventRow } from '../../services/orderTypes';
import { Heading, Text } from '../ui/Typography';
import Card from '../ui/Card';

export type TimelineEntry = {
  id: string;
  label: string;
  note?: string | null;
  actor?: string | null;
  createdAt: string;
  kind: 'status' | 'payment';
};

function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mergeTimeline(
  statusHistory: OrderStatusHistoryRow[],
  paymentEvents: PaymentEventRow[]
): TimelineEntry[] {
  const statusEntries: TimelineEntry[] = statusHistory.map((h) => ({
    id: h.id,
    label: h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status,
    note: h.note,
    actor: h.actor,
    createdAt: h.created_at,
    kind: 'status',
  }));

  const paymentEntries: TimelineEntry[] = paymentEvents.map((e) => ({
    id: e.id,
    label: formatEventType(e.event_type),
    note:
      e.payload && typeof e.payload === 'object' && 'order_reference' in (e.payload as object)
        ? `Ref: ${String((e.payload as Record<string, unknown>).order_reference)}`
        : null,
    actor: 'system',
    createdAt: e.created_at,
    kind: 'payment',
  }));

  return [...statusEntries, ...paymentEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

type Props = {
  entries: TimelineEntry[];
};

export default function OrderDetailsStatusTimeline({ entries }: Props) {
  if (!entries.length) return null;

  return (
    <Card padding="lg">
      <Heading level={5} className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-accent" />
        Order timeline ({entries.length})
      </Heading>
      <ol className="space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-baseline justify-between gap-2 border-l-2 border-carbon-900/10 pl-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Text variant="small" weight="medium" className="break-words">
                  {entry.label}
                </Text>
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${
                    entry.kind === 'payment'
                      ? 'bg-accent-50 text-accent-800'
                      : 'bg-carbon-100 text-carbon-600'
                  }`}
                >
                  {entry.kind}
                </span>
              </div>
              {entry.note && (
                <Text variant="caption" muted className="mt-0.5 break-words">
                  {entry.note}
                </Text>
              )}
            </div>
            <div className="shrink-0 text-right">
              <Text variant="caption" muted>
                {new Date(entry.createdAt).toLocaleString('en-AU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {entry.actor && entry.actor !== 'system' && (
                <Text variant="caption" muted className="block font-mono text-[0.65rem]">
                  {entry.actor.slice(0, 8)}
                </Text>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
