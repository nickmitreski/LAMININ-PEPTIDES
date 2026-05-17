import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import usePersistedState from '../hooks/usePersistedState';
import usePaymentTrackingRealtime from '../hooks/usePaymentTrackingRealtime';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  RefreshCw,
  Search,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Trash2,
  AlertTriangle,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { resendOrderInstructionsEmail } from '../services/emailService';
import {
  cancelOrder,
  getAllOrders,
  getOrderCounts,
  getRecentEmailFailures,
  markPaymentReceived,
  updateOrderStatus,
  deleteOrder,
  type OrderCounts,
  type OrderReferenceRow,
  type OrderStatus,
} from '../services/supabaseService';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';
import OrderDetailsModal from '../components/admin/OrderDetailsModal';
import AdminNavigation from '../components/admin/AdminNavigation';
import { formatPrice } from '../lib/formatCurrency';

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: typeof Clock }[] = [
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'viewed_instructions', label: 'Viewed', icon: Eye },
  { value: 'payment_received', label: 'Paid', icon: CheckCircle },
  { value: 'processing', label: 'Processing', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

type StatusFilter = OrderStatus | 'all';
type SortKey = 'date' | 'total' | 'customer' | 'status';
type SortDir = 'asc' | 'desc';

const ORDERS_PAGE_SIZE = 500;
const AUTO_REFRESH_INTERVAL_MS = 60_000;

const EMPTY_COUNTS: OrderCounts = {
  total: 0,
  pending: 0,
  viewed_instructions: 0,
  payment_received: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
};

// Each status pairs colour + a leading dot tone so paid/delivered (both green)
// remain visually distinct.
const STATUS_BADGE_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning-muted text-warning-text border-warning-border',
  viewed_instructions: 'bg-blue-100 text-blue-800 border-blue-200',
  payment_received: 'bg-success-muted text-success-text border-success-border',
  processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  cancelled: 'bg-error-muted text-error-text border-error-border',
};

const STATUS_DOT_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning',
  viewed_instructions: 'bg-blue-600',
  payment_received: 'bg-success',
  processing: 'bg-indigo-600',
  shipped: 'bg-purple-600',
  delivered: 'bg-emerald-700',
  cancelled: 'bg-error',
};

/** Human-readable labels for status values */
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  viewed_instructions: 'Viewed',
  payment_received: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function StatusBadge({ status }: { status: OrderStatus }) {
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

/** Friendly relative time, falls back to localized date for older entries. */
function formatRelativeTime(iso: string): string {
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

/** Convert orders to CSV and trigger a browser download. */
function exportOrdersCsv(orders: OrderReferenceRow[]) {
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

export default function AdminDashboard() {
  useDocumentTitle("Orders Dashboard", "Manage orders, payments, and shipments.");
  const navigate = useNavigate();
  const { logout, user: adminUser, authReady } = useAdminAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderReferenceRow[]>([]);
  const [counts, setCounts] = useState<OrderCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Filter/sort preferences persist across reloads so admins don't lose context.
  const [filterStatus, setFilterStatus] = usePersistedState<StatusFilter>(
    'admin.orders.filterStatus',
    'all'
  );
  const [sortKey, setSortKey] = usePersistedState<SortKey>('admin.orders.sortKey', 'date');
  const [sortDir, setSortDir] = usePersistedState<SortDir>('admin.orders.sortDir', 'desc');
  const [selectedOrder, setSelectedOrder] = useState<OrderReferenceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderReferenceRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkMarkPaidOpen, setBulkMarkPaidOpen] = useState(false);
  const [bulkMarking, setBulkMarking] = useState(false);
  const [emailFailureCount, setEmailFailureCount] = useState<number>(0);
  // Banner can be dismissed for the rest of the session.
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  // Payment data is now embedded in order rows (from payment_tracking table)
  const isMountedRef = useRef(true);

  const loadOrders = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const db = getAdminSupabase();
        const [data, freshCounts] = await Promise.all([
          getAllOrders(ORDERS_PAGE_SIZE, page * ORDERS_PAGE_SIZE, db),
          getOrderCounts(db),
        ]);
        if (!isMountedRef.current) return;
        setOrders(data);
        setCounts(freshCounts);
      } catch {
        if (isMountedRef.current && !silent) {
          showToast('Failed to load orders', 'error');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [showToast, page]
  );

  useEffect(() => {
    isMountedRef.current = true;
    if (authReady) {
      void loadOrders();
      // Side fetch — count recent email failures so we can surface a banner.
      void (async () => {
        const { count } = await getRecentEmailFailures(72, getAdminSupabase());
        if (isMountedRef.current) setEmailFailureCount(count);
      })();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [loadOrders, authReady]);

  // Realtime subscription: payment_tracking table-wide.
  usePaymentTrackingRealtime(
    useCallback(() => loadOrders({ silent: true }), [loadOrders]),
    { pollIntervalMs: AUTO_REFRESH_INTERVAL_MS, enabled: authReady }
  );

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleStatusUpdate = async (order: OrderReferenceRow, newStatus: OrderStatus) => {
    try {
      const db = getAdminSupabase();
      if (!db) {
        showToast('Supabase not configured', 'error');
        return;
      }

      // Conflict detection: re-fetch the row to check if another admin changed it
      const { data: freshRow, error: fetchErr } = await db
        .from('payment_tracking')
        .select('updated_at, payment_status')
        .eq('id', order.id)
        .single();

      if (fetchErr || !freshRow) {
        showToast('Could not verify order state. Please refresh.', 'error');
        return;
      }

      if (freshRow.updated_at !== order.updated_at) {
        showToast(
          `This order was modified by another admin (status is now "${freshRow.payment_status}"). Refreshing…`,
          'error',
          5000
        );
        void loadOrders({ silent: true });
        return;
      }

      // "Paid" must go through mark_payment_received + notify-payment-received (SMS).
      if (newStatus === 'payment_received') {
        const m = await markPaymentReceived(order.id, adminUser?.email ?? 'admin', null, db);
        if (!m.success) {
          showToast(m.error ?? 'Failed to mark payment received', 'error');
          return;
        }
        if (m.notifySmsError) {
          showToast(`Payment saved. SMS not sent: ${m.notifySmsError}`, 'error');
        } else if (m.notifySmsSkipped && m.notifySmsSkipReason === 'no_phone') {
          showToast('Marked paid. No customer phone — SMS skipped.', 'success');
        } else {
          showToast('Order marked paid. Confirmation SMS sent.', 'success');
        }
        void loadOrders({ silent: true });
        return;
      }

      const success = await updateOrderStatus(order.peptide_order_id, newStatus, db);
      if (success) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        void loadOrders({ silent: true });
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteOrder(deleteTarget.id, getAdminSupabase());
      if (result.success) {
        showToast(`Deleted order ${deleteTarget.peptide_order_id}`, 'success');
        setDeleteTarget(null);
        if (selectedOrder?.id === deleteTarget.id) setSelectedOrder(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        void loadOrders({ silent: true });
      } else {
        showToast(result.error || 'Failed to delete order', 'error');
      }
    } catch {
      showToast('An error occurred while deleting the order', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    const db = getAdminSupabase();
    const ids = Array.from(selectedIds);
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const r = await deleteOrder(id, db);
        if (r.success) success += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }
    setIsDeleting(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    if (failed === 0) {
      showToast(`Deleted ${success} order${success === 1 ? '' : 's'}`, 'success');
    } else if (success === 0) {
      showToast(`Failed to delete ${failed} order${failed === 1 ? '' : 's'}`, 'error');
    } else {
      showToast(
        `Deleted ${success}, ${failed} failed. Try again or check logs.`,
        'error'
      );
    }
    void loadOrders({ silent: true });
  };

  const handleBulkMarkPaidConfirm = async () => {
    if (selectedIds.size === 0) return;
    setBulkMarking(true);
    const db = getAdminSupabase();
    // Resolve ids → order objects from current page so we can skip already-paid
    // rows and skip cancelled ones. Cuts down on confusing toasts.
    const candidates = orders.filter(
      (o) => selectedIds.has(o.id) && o.payment_status !== 'payment_received' && o.payment_status !== 'cancelled'
    );
    const adminEmail = adminUser?.email ?? 'admin';
    let success = 0;
    let failed = 0;
    const skipped = selectedIds.size - candidates.length;
    for (const order of candidates) {
      try {
        const r = await markPaymentReceived(order.id, adminEmail, null, db);
        if (r.success) success += 1; else failed += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkMarking(false);
    setBulkMarkPaidOpen(false);
    setSelectedIds(new Set());
    const parts: string[] = [];
    if (success > 0) parts.push(`${success} marked paid`);
    if (skipped > 0) parts.push(`${skipped} skipped`);
    if (failed > 0) parts.push(`${failed} failed`);
    const summary = parts.join(', ') || 'No changes';
    showToast(summary, failed > 0 ? 'error' : 'success', 4000);
    void loadOrders({ silent: true });
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1500);
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'asc');
    }
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (!term) {
        // skip search check
      }
      // Search across order ref, customer fields, AND product names inside the cart.
      // The cart-item match lets operators answer "who ordered BPC-157 this week?"
      // without leaving the dashboard.
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
    const sorted = [...filtered].sort((a, b) => {
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
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            dir
          );
      }
    });
    return sorted;
  }, [orders, searchTerm, filterStatus, sortKey, sortDir]);

  // Reset selection when the visible filtered list changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(filteredOrders.map((o) => o.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [filteredOrders]);

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedIds.has(o.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const TABS: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: counts.total },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'viewed_instructions', label: 'Viewed', count: counts.viewed_instructions },
    { value: 'payment_received', label: 'Paid', count: counts.payment_received },
    { value: 'processing', label: 'Processing', count: counts.processing },
    { value: 'shipped', label: 'Shipped', count: counts.shipped },
    { value: 'delivered', label: 'Delivered', count: counts.delivered },
    { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  const SortHeader = ({
    label,
    sortKeyValue,
  }: {
    label: string;
    sortKeyValue: SortKey;
  }) => {
    const active = sortKey === sortKeyValue;
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKeyValue)}
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
  };

  const totalPages = Math.max(1, Math.ceil(counts.total / ORDERS_PAGE_SIZE));
  const hasMore = page + 1 < totalPages;
  const selectedCount = selectedIds.size;

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Heading level={1} className="mb-1">
              Orders
            </Heading>
            <Text className="text-carbon-600">
              Manage customer orders, fulfilment, and status updates.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {refreshing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-accent-700">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Refreshing…
              </span>
            )}
            <span className="text-xs text-carbon-600">
              Page <strong>{page + 1}</strong> of{' '}
              <strong>{totalPages}</strong>{' '}
              ({counts.total} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportOrdersCsv(filteredOrders)}
              disabled={filteredOrders.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadOrders()}
              disabled={loading || refreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Recent email failures banner — surfaces silent send errors */}
        {emailFailureCount > 0 && !emailBannerDismissed && (
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-sm border border-warning-border bg-warning-light px-4 py-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <Text variant="small" weight="medium" className="text-warning-text">
                  {emailFailureCount} email{emailFailureCount === 1 ? '' : 's'} failed to send in the last 72 hours
                </Text>
                <Text variant="caption" className="text-warning-text">
                  Customers on those orders may not have received payment instructions.{' '}
                  <Link to="/admin/emails" className="font-medium underline">
                    Review and resend
                  </Link>
                </Text>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEmailBannerDismissed(true)}
              className="text-xs text-warning-text hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status tabs (Shopify-style) */}
        <div className="mb-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div
            role="tablist"
            aria-label="Order status filter"
            className="flex min-w-max gap-1 border-b border-carbon-900/10"
          >
            {TABS.map((tab) => {
              const active = filterStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-accent-600 text-accent-700'
                      : 'border-transparent text-carbon-600 hover:border-carbon-300 hover:text-carbon-900'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      active
                        ? 'bg-accent-100 text-accent-800'
                        : 'bg-carbon-100 text-carbon-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <Card padding="md" className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by order ref (LM-…), email, name, phone, city, or product name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-sm border border-carbon-900/20 py-2 pl-10 pr-4 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </Card>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-accent-200 bg-accent-50 px-4 py-2.5">
            <Text variant="small" weight="medium" className="text-accent-800">
              {selectedCount} selected
            </Text>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear selection
              </Button>
              <button
                type="button"
                onClick={() => setBulkMarkPaidOpen(true)}
                disabled={bulkMarking}
                className="inline-flex items-center gap-2 rounded-sm bg-success px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-success-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                {bulkMarking ? 'Marking…' : 'Mark selected paid'}
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-2 rounded-sm bg-error px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-error-dark"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected
              </button>
            </div>
          </div>
        )}

        {/* Orders table */}
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
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <Text variant="body" muted className="mb-1">
                No orders found
              </Text>
              {(searchTerm || filterStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
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
                        onChange={toggleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded border-carbon-300 text-accent focus:ring-accent"
                        aria-label="Select all visible orders"
                      />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="th-label">
                        Order ID
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <SortHeader label="Customer" sortKeyValue="customer" />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="th-label">
                        Contact
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <SortHeader label="Status" sortKeyValue="status" />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <SortHeader label="Total" sortKeyValue="total" />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <SortHeader label="Date" sortKeyValue="date" />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="th-label">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-900/10">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedIds.has(order.id);
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-accent-50' : 'hover:bg-grey/20'
                        }`}
                      >
                        <td
                          className="px-4 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(order.id)}
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
                                void handleCopyId(order.peptide_order_id);
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
                            {order.customer_city || 'N/A'},{' '}
                            {order.customer_state || 'N/A'}
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
                          <StatusBadge status={order.status} />
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
                        <td
                          className="px-6 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="rounded-sm border border-carbon-900/20 p-2 text-carbon-900 transition-colors hover:bg-grey/30 hover:text-carbon-900"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/admin/orders/${encodeURIComponent(order.peptide_order_id)}`}
                              target="_blank"
                              rel="noopener"
                              className="hidden items-center rounded-sm border border-carbon-900/20 p-2 text-carbon-900 transition-colors hover:bg-grey/30 hover:text-carbon-900 sm:inline-flex"
                              title="Open in new tab"
                              aria-label="Open in new tab"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusUpdate(order, e.target.value as OrderStatus)
                              }
                              className="rounded-sm border border-carbon-900/20 px-2 py-1 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setDeleteTarget(order)}
                              className="rounded-sm border border-error-border p-2 text-error transition-colors hover:bg-error-light hover:text-error-dark"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              Previous
            </Button>
            <Text variant="small" muted>
              Page {page + 1} of {totalPages}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || loading}
            >
              Next
            </Button>
          </div>
        )}
      </Section>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          paymentTracking={{
            id: selectedOrder.id,
            order_reference: selectedOrder.peptide_order_id,
            customer_email: selectedOrder.customer_email ?? '',
            customer_name: selectedOrder.customer_name ?? '',
            customer_phone: selectedOrder.customer_phone ?? '',
            customer_address: null,
            cart_items: selectedOrder.cart_items ?? [],
            subtotal: selectedOrder.subtotal ?? 0,
            shipping: selectedOrder.shipping ?? 0,
            tax: selectedOrder.tax ?? 0,
            total_amount: selectedOrder.total_price ?? 0,
            currency: selectedOrder.currency ?? 'AUD',
            payment_status: selectedOrder.payment_status ?? selectedOrder.status,
            payment_viewed_at: selectedOrder.payment_viewed_at ?? null,
            payment_completed_at: selectedOrder.payment_completed_at ?? null,
            admin_notes: selectedOrder.notes,
            created_at: selectedOrder.created_at,
            updated_at: selectedOrder.updated_at,
          }}
          onPaymentAction={async (action, trackingId, reason) => {
            const client = getAdminSupabase();
            if (action === 'resend_email') {
              if (!selectedOrder) return;
              if (!selectedOrder.customer_email) {
                showToast('No customer email on this order.', 'error');
                return;
              }
              const r = await resendOrderInstructionsEmail({
                trackingId,
                orderReference: selectedOrder.peptide_order_id,
                customerEmail: selectedOrder.customer_email,
                customerName: selectedOrder.customer_name ?? 'Customer',
                customerPhone: selectedOrder.customer_phone ?? undefined,
                totalAmount: selectedOrder.total_price ?? 0,
                currency: selectedOrder.currency ?? 'AUD',
              });
              if (r.success) {
                showToast(`Instructions resent to ${selectedOrder.customer_email}`, 'success');
              } else {
                showToast(r.error ?? 'Could not resend email.', 'error');
              }
              return;
            }
            if (action === 'mark_paid') {
              const m = await markPaymentReceived(
                trackingId,
                adminUser?.email ?? 'admin',
                null,
                client
              );
              await loadOrders({ silent: true });
              if (!m.success) {
                showToast(m.error ?? 'Could not mark payment', 'error');
                return;
              }
              if (m.notifySmsError) {
                showToast(`Payment saved. SMS not sent: ${m.notifySmsError}`, 'error');
              } else if (m.notifySmsSkipped && m.notifySmsSkipReason === 'no_phone') {
                showToast('Payment marked as received. No customer phone — SMS skipped.', 'success');
              } else {
                showToast('Payment marked as received. Confirmation SMS sent.', 'success');
              }
              return;
            }

            if (action === 'cancel' || action === 'refund') {
              if (!reason?.trim()) {
                showToast('A reason is required.', 'error');
                return;
              }
              const r = await cancelOrder(
                trackingId,
                { reason, refunded: action === 'refund' },
                client
              );
              if (!r.success) {
                showToast(r.error ?? 'Could not cancel order', 'error');
                return;
              }
              showToast(
                action === 'refund'
                  ? 'Order refunded and cancelled.'
                  : 'Order cancelled.',
                'success'
              );
              await loadOrders({ silent: true });
              setSelectedOrder(null);
            }
          }}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Single delete modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-order-title"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-error-muted">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div>
                <Heading level={3} id="delete-order-title" className="mb-1">
                  Delete this order?
                </Heading>
                <Text variant="small" className="text-carbon-600">
                  This will permanently remove the order and any related notes.
                  This cannot be undone.
                </Text>
              </div>
            </div>

            <div className="mb-6 rounded-sm bg-grey/30 p-3 text-sm">
              <div className="font-mono text-carbon-900">
                {deleteTarget.peptide_order_id}
              </div>
              <div className="text-carbon-600">
                {deleteTarget.customer_name || 'Unknown customer'} •{' '}
                {deleteTarget.customer_email || 'no email'}
              </div>
              <div className="text-carbon-600">
                {formatPrice(deleteTarget.total_price ?? 0)} •{' '}
                {new Date(deleteTarget.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-sm bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete modal */}
      {bulkDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-title"
          onClick={() => !isDeleting && setBulkDeleteOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-error-muted">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div>
                <Heading level={3} id="bulk-delete-title" className="mb-1">
                  Delete {selectedCount} order{selectedCount === 1 ? '' : 's'}?
                </Heading>
                <Text variant="small" className="text-carbon-600">
                  This will permanently remove the selected orders and their
                  notes. This cannot be undone.
                </Text>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => void handleBulkDeleteConfirm()}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-sm bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete {selectedCount}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk mark-paid modal */}
      {bulkMarkPaidOpen && (() => {
        const eligible = orders.filter(
          (o) => selectedIds.has(o.id) && o.payment_status !== 'payment_received' && o.payment_status !== 'cancelled'
        );
        const skipped = selectedCount - eligible.length;
        const totalAmount = eligible.reduce((sum, o) => sum + (o.total_price ?? 0), 0);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-mark-paid-title"
            onClick={() => !bulkMarking && setBulkMarkPaidOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-success-muted">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <Heading level={3} id="bulk-mark-paid-title" className="mb-1">
                    Mark {eligible.length} order{eligible.length === 1 ? '' : 's'} paid?
                  </Heading>
                  <Text variant="small" className="text-carbon-600">
                    Will send the payment-received SMS/email for each one and stamp the audit log.
                    {skipped > 0 ? (
                      <> {skipped} already paid or cancelled will be skipped.</>
                    ) : null}
                  </Text>
                  {totalAmount > 0 && (
                    <Text variant="caption" muted className="mt-2 block">
                      Combined total: <strong>{formatPrice(totalAmount)}</strong>
                    </Text>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkMarkPaidOpen(false)}
                  disabled={bulkMarking}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => void handleBulkMarkPaidConfirm()}
                  disabled={bulkMarking || eligible.length === 0}
                  className="inline-flex items-center justify-center rounded-sm bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkMarking ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Marking…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark {eligible.length} paid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
