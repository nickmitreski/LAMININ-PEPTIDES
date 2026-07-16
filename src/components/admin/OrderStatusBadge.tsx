import type { OrderStatus } from '../../services/orderTypes';
import { STATUS_BADGE_COLORS, STATUS_DOT_COLORS, STATUS_LABELS } from '../../features/admin/orders/orderConstants';

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${STATUS_BADGE_COLORS[status]}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[status]}`}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
