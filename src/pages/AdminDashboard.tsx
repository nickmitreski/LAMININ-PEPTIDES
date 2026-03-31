import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Package,
  ShoppingCart,
  RefreshCw,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  getAllOrders,
  updateOrderStatus,
  type OrderReferenceRow,
  type OrderStatus,
} from '../services/supabaseService';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: typeof Clock }[] = [
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'paid', label: 'Paid', icon: CheckCircle },
  { value: 'processing', label: 'Processing', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${colors[status]}`}
    >
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderReferenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const db = getAdminSupabase();
      const data = await getAllOrders(100, 0, db);
      setOrders(data);
    } catch (error) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const success = await updateOrderStatus(
        orderId,
        newStatus,
        getAdminSupabase()
      );
      if (success) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        loadOrders();
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.peptide_order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'paid').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  return (
    <div className="min-h-screen bg-platinum">
      {/* Header */}
      <div className="border-b border-carbon-900/10 bg-white">
        <Section spacing="sm">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={2} className="mb-1">
                Admin Dashboard
              </Heading>
              <Text variant="small" muted>
                Welcome back, {user?.name}
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/products')}
              >
                <Package className="mr-2 h-4 w-4" />
                Products
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </Section>
      </div>

      <Section spacing="lg">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card padding="md" className="border-l-4 border-l-accent">
            <Text variant="small" muted className="mb-1">
              Total Orders
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {stats.total}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-yellow-500">
            <Text variant="small" muted className="mb-1">
              Pending
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {stats.pending}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-blue-500">
            <Text variant="small" muted className="mb-1">
              Processing
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {stats.processing}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-purple-500">
            <Text variant="small" muted className="mb-1">
              Shipped
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {stats.shipped}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-green-500">
            <Text variant="small" muted className="mb-1">
              Delivered
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {stats.delivered}
            </Text>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="md" className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by order ID, email, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-sm border border-carbon-900/20 py-2 pl-10 pr-4 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-neutral-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
                className="rounded-sm border border-carbon-900/20 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={loadOrders}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Orders List */}
        <Card padding="none">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-accent-dark" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <Text variant="body" muted>
                No orders found
              </Text>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-carbon-900/10 bg-grey/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-900/10">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-grey/20">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text variant="small" weight="medium" className="font-mono">
                          {order.peptide_order_id}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="small" weight="medium">
                          {order.customer_name || 'N/A'}
                        </Text>
                        <Text variant="caption" muted className="block">
                          {order.customer_email}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text variant="small" weight="medium">
                          ${order.total_price?.toFixed(2) || '0.00'}
                        </Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text variant="small">
                          {new Date(order.created_at).toLocaleDateString()}
                        </Text>
                        <Text variant="caption" muted className="block">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusUpdate(
                              order.peptide_order_id,
                              e.target.value as OrderStatus
                            )
                          }
                          className="rounded-sm border border-carbon-900/20 px-2 py-1 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}
