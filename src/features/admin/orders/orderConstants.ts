import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Package,
} from 'lucide-react';
import type { OrderCounts, OrderStatus } from '../../../services/orderTypes';

export const ORDERS_PAGE_SIZE = 500;
export const AUTO_REFRESH_INTERVAL_MS = 60_000;

export type StatusFilter = OrderStatus | 'all';
export type SortKey = 'date' | 'total' | 'customer' | 'status';
export type SortDir = 'asc' | 'desc';

export const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: typeof Clock }[] = [
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'viewed_instructions', label: 'Viewed', icon: Eye },
  { value: 'payment_received', label: 'Paid', icon: CheckCircle },
  { value: 'processing', label: 'Processing', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

export const EMPTY_COUNTS: OrderCounts = {
  total: 0,
  pending: 0,
  viewed_instructions: 0,
  payment_received: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
};

export const STATUS_BADGE_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning-muted text-warning-text border-warning-border',
  viewed_instructions: 'bg-blue-100 text-blue-800 border-blue-200',
  payment_received: 'bg-success-muted text-success-text border-success-border',
  processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  cancelled: 'bg-error-muted text-error-text border-error-border',
};

export const STATUS_DOT_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning',
  viewed_instructions: 'bg-blue-600',
  payment_received: 'bg-success',
  processing: 'bg-indigo-600',
  shipped: 'bg-purple-600',
  delivered: 'bg-emerald-700',
  cancelled: 'bg-error',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  viewed_instructions: 'Viewed',
  payment_received: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
