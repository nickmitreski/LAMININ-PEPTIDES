import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Eye,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import { Text } from '../ui/Typography';
import OrderStatusBadge from './OrderStatusBadge';
import { formatPrice } from '../../lib/formatCurrency';
import { STATUS_OPTIONS, type SortDir, type SortKey } from '../../features/admin/orders/orderConstants';
import { formatRelativeTime } from '../../features/admin/orders/orderUtils';
import type { OrderReferenceRow, OrderStatus } from '../../services/orderTypes';

type Props = {
  loading: boolean;
  orders: OrderReferenceRow[];
  searchTerm: string;
  filterStatus: string;
  sortKey: SortKey;
  sortDir: SortDir;
  selectedIds: Set<string>;
  copiedId: string | null;
  allVisibleSelected: boolean;
  onClearFilters: () => void;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string) => void;
  onSelectOrder: (order: OrderReferenceRow) => void;
  onCopyId: (id: string) => void;
  onStatusUpdate: (order: OrderReferenceRow, status: OrderStatus) => void;
  onDeleteOrder: (order: OrderReferenceRow) => void;
  onToggleSort: (key: SortKey) => void;
};

function SortHeader({
  label,
  sortKeyValue,
  sortKey,
  sortDir,
  onToggleSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
}) {
  const active = sortKey === sortKeyValue;
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onToggleSort(sortKeyValue)}
      className={`group inline-flex items-center gap-1.5 th-label transition-colors ${
        active ? 'text-carbon-900' : 'text-carbon-900 hover:text-carbon-900'
      }`}
    >
      {label}
      <Icon
        className={`h-3 w-3 transition-opacity ${
          active ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
        }`}
      />
    </button>
  );
}

export default function AdminOrdersTable({
  loading,
  orders,
  searchTerm,
  filterStatus,
  sortKey,
  sortDir,
  selectedIds,
  copiedId,
  allVisibleSelected,
  onClearFilters,
  onToggleSelectAll,
  onToggleSelectOne,
  onSelectOrder,
  onCopyId,
  onStatusUpdate,
  onDeleteOrder,
  onToggleSort,
}: Props) {
  return (
    <Card padding="none">
      {loading ? (
        <div role="status" aria-busy="true" aria-label="Loading orders">
          <div className="border-b border-carbon-900/10 bg-grey/30 px-6 py-3">
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="divide-y divide-carbon-900/10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6 px-6 py-4">
                <Skeleton className="h-4 w-4" rounded="sm" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 flex-1 max-w-[12rem]" />
                <Skeleton className="hidden h-3 w-32 md:block" />
                <Skeleton className="h-5 w-20" rounded="full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="hidden h-3 w-20 md:block" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
          <Text variant="body" muted className="mb-1">
            No orders found
          </Text>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-accent-700 underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-carbon-900/10 bg-grey/30">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-carbon-300 text-accent focus:ring-accent"
                    aria-label="Select all visible orders"
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="th-label">Order ID</span>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortHeader
                    label="Customer"
                    sortKeyValue="customer"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onToggleSort={onToggleSort}
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="th-label">Contact</span>
                </th>
                <th className="px-6 py-3 text-left">
                  <SortHeader
                    label="Status"
                    sortKeyValue="status"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onToggleSort={onToggleSort}
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <SortHeader
                    label="Total"
                    sortKeyValue="total"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onToggleSort={onToggleSort}
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <SortHeader
                    label="Date"
                    sortKeyValue="date"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onToggleSort={onToggleSort}
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <span className="th-label">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-900/10">
              {orders.map((order) => {
                const isSelected = selectedIds.has(order.id);
                return (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent-50' : 'hover:bg-grey/20'
                    }`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectOne(order.id)}
                        className="h-4 w-4 cursor-pointer rounded border-carbon-300 text-accent focus:ring-accent"
                        aria-label={`Select order ${order.peptide_order_id}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-carbon-900">
                          {order.peptide_order_id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void onCopyId(order.peptide_order_id);
                          }}
                          className="rounded p-1 text-neutral-400 transition-colors hover:bg-grey/40 hover:text-carbon-700"
                          title="Copy order ID"
                        >
                          {copiedId === order.peptide_order_id ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Text variant="small" weight="medium">
                        {order.customer_name || 'N/A'}
                      </Text>
                      <Text variant="caption" muted className="block">
                        {order.customer_city || 'N/A'}, {order.customer_state || 'N/A'}
                      </Text>
                    </td>
                    <td className="px-6 py-4">
                      <Text variant="small" className="block">
                        {order.customer_email}
                      </Text>
                      {order.customer_phone && (
                        <Text variant="caption" muted className="block">
                          {order.customer_phone}
                        </Text>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Text variant="small" weight="medium">
                        {formatPrice(order.total_price ?? 0)}
                      </Text>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        title={new Date(order.created_at).toLocaleString()}
                        className="text-sm text-carbon-700"
                      >
                        {formatRelativeTime(order.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          className="rounded-sm border border-carbon-900/20 p-2 text-carbon-900 transition-colors hover:bg-grey/30 hover:text-carbon-900 min-h-11 min-w-11 touch-manipulation"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/admin/orders/${encodeURIComponent(order.peptide_order_id)}`}
                          target="_blank"
                          rel="noopener"
                          className="hidden items-center rounded-sm border border-carbon-900/20 p-2 text-carbon-900 transition-colors hover:bg-grey/30 hover:text-carbon-900 sm:inline-flex min-h-11 min-w-11 touch-manipulation"
                          title="Open in new tab"
                          aria-label="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            onStatusUpdate(order, e.target.value as OrderStatus)
                          }
                          className="rounded-sm border border-carbon-900/20 px-2 py-1 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 min-h-11"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => onDeleteOrder(order)}
                          className="rounded-sm border border-error-border p-2 text-error transition-colors hover:bg-error-light hover:text-error-dark min-h-11 min-w-11 touch-manipulation"
                          title="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
