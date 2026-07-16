import type { OrderReferenceRow } from '../../../services/orderTypes';
import type { SortDir, SortKey, StatusFilter } from './orderConstants';

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function exportOrdersCsv(orders: OrderReferenceRow[]) {
  const headers = [
    'Order ID',
    'Status',
    'Customer Name',
    'Email',
    'Phone',
    'City',
    'State',
    'Postcode',
    'Total',
    'Created At',
  ];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = orders.map((o) =>
    [
      o.peptide_order_id,
      o.status,
      o.customer_name ?? '',
      o.customer_email ?? '',
      o.customer_phone ?? '',
      o.customer_city ?? '',
      o.customer_state ?? '',
      o.customer_postcode ?? '',
      o.total_price?.toFixed(2) ?? '',
      o.created_at,
    ]
      .map(escape)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function filterAndSortOrders(
  orders: OrderReferenceRow[],
  searchTerm: string,
  filterStatus: StatusFilter,
  sortKey: SortKey,
  sortDir: SortDir
): OrderReferenceRow[] {
  const term = searchTerm.trim().toLowerCase();
  const filtered = orders.filter((order) => {
    const cartMatches =
      Array.isArray(order.cart_items) &&
      order.cart_items.some((it) => {
        const item = it as { name?: unknown; id?: unknown };
        const n = typeof item.name === 'string' ? item.name.toLowerCase() : '';
        const i = typeof item.id === 'string' ? item.id.toLowerCase() : '';
        return n.includes(term) || i.includes(term);
      });
    const matchesSearch =
      !term ||
      order.peptide_order_id.toLowerCase().includes(term) ||
      order.customer_email?.toLowerCase().includes(term) ||
      order.customer_name?.toLowerCase().includes(term) ||
      order.customer_phone?.toLowerCase().includes(term) ||
      order.customer_city?.toLowerCase().includes(term) ||
      cartMatches;

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const dir = sortDir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'total':
        return ((a.total_price ?? 0) - (b.total_price ?? 0)) * dir;
      case 'customer':
        return (
          (a.customer_name || a.customer_email || '').localeCompare(
            b.customer_name || b.customer_email || ''
          ) * dir
        );
      case 'status':
        return a.status.localeCompare(b.status) * dir;
      case 'date':
      default:
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    }
  });
}
