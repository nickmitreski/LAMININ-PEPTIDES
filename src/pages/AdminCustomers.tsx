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
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  getAllCustomers,
  deleteCustomerAndOrders,
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

export default function AdminCustomers() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading level={1} className="mb-2">
              Customer management
            </Heading>
            <Text className="text-carbon-600">
              Manage your customer database.
            </Text>
          </div>
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
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-carbon-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-carbon-900">
                            {customer.first_name} {customer.last_name}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-carbon-600">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm text-carbon-600">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.city && (
                          <div className="flex items-center gap-1 text-sm text-carbon-600">
                            <MapPin className="w-3 h-3" />
                            {customer.city}
                            {customer.state && `, ${customer.state}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-carbon-900">
                          {customer.total_orders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-carbon-900">
                          {formatPrice(customer.total_spent)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {deleteConfirm === customer.email ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.email)}
                              disabled={deleting}
                              className="flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                              disabled={deleting}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(customer.email)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
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
