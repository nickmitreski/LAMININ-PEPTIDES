import type { PaymentEventRow } from '../../../services/orderTypes';
import type { OrderStatusHistoryRow } from '../../../services/supabaseService';

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
