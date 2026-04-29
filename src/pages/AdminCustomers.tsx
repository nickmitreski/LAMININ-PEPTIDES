import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  getAllCustomers,
  getAllOrders,
  deleteCustomerAndOrders,
  type OrderReferenceRow,
} from '../services/supabaseService';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/formatCurrency';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminCustomers() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderReferenceRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const db = getAdminSupabase();
      const data = await getAllCustomers(db);
      setCustomers(data);
    } catch {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadCustomerOrders = useCallback(async (email: string) => {
    setOrdersLoading(true);
    try {
      const db = getAdminSupabase();
      const allOrders = await getAllOrders(500, 0, db);
      const filtered = allOrders.filter(
        (o) => o.customer_email?.toLowerCase() === email.toLowerCase()
      );
      setCustomerOrders(filtered);
    } catch {
      showToast('Failed to load customer orders', 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [showToast]);

  const toggleExpand = (email: string) => {
    if (expandedCustomer === email) {
      setExpandedCustomer(null);
      setCustomerOrders([]);
    } else {
      setExpandedCustomer(email);
      void loadCustomerOrders(email);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleDeleteCustomer = async (email: string) => {
    setDeleting(true);
    try {
      const db = getAdminSupabase();
      const result = await deleteCustomerAndOrders(email, db);

      if (result.success) {
        showToast(
          `Customer deleted: ${result.orders_deleted || 0} orders removed`,
          'success'
        );
        setDeleteConfirm(null);
        await loadCustomers();
      } else {
        showToast(result.error || 'Failed to delete customer', 'error');
      }
    } catch {
      showToast('Failed to delete customer', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.email.toLowerCase().includes(searchLower) ||
      customer.first_name?.toLowerCase().includes(searchLower) ||
      customer.last_name?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.city?.toLowerCase().includes(searchLower)
    );
  });

  const totalRevenue = customers.reduce(
    (sum, c) => sum + (c.total_spent || 0),
    0
  );
  const totalOrders = customers.reduce((sum, c) => sum + c.total_orders, 0);

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <Heading level={1} className="mb-1">
              Customers
            </Heading>
            <Text className="text-carbon-600">
              Customer database with order history. Click a row to expand.
            </Text>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadCustomers()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-100 rounded-sm">
                <Users className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <Text className="text-sm text-carbon-600">
                  Total customers
                </Text>
                <Heading level={3}>{customers.length}</Heading>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-sm">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <Text className="text-sm text-carbon-600">Total orders</Text>
                <Heading level={3}>{totalOrders}</Heading>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-sm">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <Text className="text-sm text-carbon-600">Total revenue</Text>
                <Heading level={3}>{formatPrice(totalRevenue)}</Heading>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </Card>

        {/* Customers Table */}
        <Card className="mt-6 overflow-hidden">
          {loading ? (
            <div role="status" aria-busy="true" aria-label="Loading customers">
              <div className="border-b border-carbon-200 bg-carbon-50 px-6 py-3">
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="divide-y divide-carbon-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-6 px-6 py-4">
                    <Skeleton className="h-9 w-9" rounded="full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="hidden h-3 w-24 md:block" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-carbon-600">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-carbon-50 border-b border-carbon-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-carbon-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-carbon-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-carbon-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-carbon-600 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-carbon-600 uppercase tracking-wider">
                      Total spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-carbon-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-carbon-200">
                  {filteredCustomers.map((customer) => {
                    const isExpanded = expandedCustomer === customer.email;
                    return (
                      <tr key={customer.id} className="group">
                        <td colSpan={6} className="p-0">
                          {/* Main row */}
                          <div
                            className={`flex items-center cursor-pointer transition-colors px-6 py-4 ${isExpanded ? 'bg-accent-50' : 'hover:bg-carbon-50'}`}
                            onClick={() => toggleExpand(customer.email)}
                          >
                            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                              <div className="sm:col-span-1">
                                <span className="font-medium text-carbon-900">
                                  {customer.first_name} {customer.last_name}
                                </span>
                                <div className="flex items-center gap-1 text-sm text-carbon-600">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{customer.email}</span>
                                </div>
                              </div>
                              <div className="sm:col-span-1">
                                {customer.phone && (
                                  <div className="flex items-center gap-1 text-sm text-carbon-600">
                                    <Phone className="w-3 h-3" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                              <div className="sm:col-span-1">
                                {customer.city && (
                                  <div className="flex items-center gap-1 text-sm text-carbon-600">
                                    <MapPin className="w-3 h-3" />
                                    {customer.city}{customer.state && `, ${customer.state}`}
                                  </div>
                                )}
                              </div>
                              <div className="sm:col-span-1">
                                <span className="font-medium text-carbon-900">{customer.total_orders}</span>
                                <span className="text-xs text-carbon-500 ml-1">orders</span>
                              </div>
                              <div className="sm:col-span-1">
                                <span className="font-medium text-carbon-900">{formatPrice(customer.total_spent)}</span>
                              </div>
                              <div className="sm:col-span-1 flex items-center gap-2 justify-end">
                                {deleteConfirm === customer.email ? (
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="danger" size="sm" onClick={() => handleDeleteCustomer(customer.email)} disabled={deleting} className="flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Confirm
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(customer.email)} className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </Button>
                                  </div>
                                )}
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-carbon-400" /> : <ChevronDown className="w-4 h-4 text-carbon-400" />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded order history */}
                          {isExpanded && (
                            <div className="border-t border-carbon-200 bg-grey/20 px-6 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <Text variant="small" weight="semibold" className="uppercase tracking-wider text-carbon-600">
                                  Order history
                                </Text>
                                {customer.last_order_date && (
                                  <Text variant="caption" muted className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Last order: {new Date(customer.last_order_date).toLocaleDateString('en-AU')}
                                  </Text>
                                )}
                              </div>
                              {ordersLoading ? (
                                <div className="space-y-2">
                                  {Array.from({ length: 2 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full" />
                                  ))}
                                </div>
                              ) : customerOrders.length === 0 ? (
                                <Text variant="small" muted>No orders found for this customer.</Text>
                              ) : (
                                <div className="space-y-2">
                                  {customerOrders.map((order) => (
                                    <div
                                      key={order.id}
                                      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-carbon-900/10 bg-white px-4 py-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm font-medium text-carbon-900">{order.peptide_order_id}</span>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-neutral-100 text-neutral-600'}`}>
                                          {order.status}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="font-medium">{formatPrice(order.total_price ?? 0)}</span>
                                        <span className="text-carbon-500">{new Date(order.created_at).toLocaleDateString('en-AU')}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Warning */}
        <Card className="mt-6 p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <Text className="font-medium text-yellow-900 mb-1">
                Important: customer deletion
              </Text>
              <Text className="text-sm text-yellow-800">
                Deleting a customer will permanently remove them and{' '}
                <strong>all their orders</strong> from the database. This action
                cannot be undone. Use with caution.
              </Text>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
