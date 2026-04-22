import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import { Heading, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { CheckCircle2, Clock, Eye, Package, RefreshCw, Trash2, Archive } from 'lucide-react';

interface PaymentTracking {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_viewed_at: string | null;
  created_at: string;
  admin_notes: string | null;
  cart_items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export default function AdminPaymentTracking() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [payments, setPayments] = useState<PaymentTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      const { data, error } = await supabase
        .from('payment_tracking')
        .select('*')
        .in('payment_status', ['pending', 'viewed_instructions', 'payment_received'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const markAsPaid = async (id: string) => {
    try {
      setProcessingId(id);
      if (!supabase) {
        alert('Supabase client not initialized');
        return;
      }
      const { error } = await supabase.rpc('mark_payment_received', {
        p_tracking_id: id,
        p_admin_email: 'admin@laminin.com', // TODO: Get from auth context
        p_notes: null,
      });

      if (error) throw error;
      await fetchPayments();
    } catch (err) {
      console.error('Error marking as paid:', err);
      alert('Failed to mark as paid: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const archivePayment = async (id: string) => {
    if (!confirm('Archive this completed payment? It will be moved to the payment records archive.')) {
      return;
    }

    try {
      setProcessingId(id);
      if (!supabase) {
        alert('Supabase client not initialized');
        return;
      }
      const { error } = await supabase.rpc('archive_payment', {
        p_tracking_id: id,
        p_admin_email: 'admin@laminin.com', // TODO: Get from auth context
      });

      if (error) throw error;
      await fetchPayments();
    } catch (err) {
      console.error('Error archiving payment:', err);
      alert('Failed to archive: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Delete this payment tracking record? This cannot be undone.')) {
      return;
    }

    try {
      setProcessingId(id);
      if (!supabase) {
        alert('Supabase client not initialized');
        return;
      }
      const { error } = await supabase.rpc('admin_delete_payment_tracking', {
        p_tracking_id: id,
      });

      if (error) throw error;
      await fetchPayments();
    } catch (err) {
      console.error('Error deleting payment:', err);
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'payment_received') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Paid
        </span>
      );
    }
    if (status === 'viewed_instructions') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
          <Eye className="h-3.5 w-3.5" />
          Viewed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
        <Clock className="h-3.5 w-3.5" />
        Pending
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const pendingCount = payments.filter(p => p.payment_status === 'pending' || p.payment_status === 'viewed_instructions').length;
  const paidCount = payments.filter(p => p.payment_status === 'payment_received').length;
  const totalPending = payments
    .filter(p => p.payment_status === 'pending' || p.payment_status === 'viewed_instructions')
    .reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {/* Header */}
        <div className="mb-6">
          <Heading level={1} className="mb-2">
            Payment Tracking
          </Heading>
          <Text className="text-carbon-600">
            Manage manual bank transfer payments
          </Text>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card padding="md" className="border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="caption" muted className="mb-1">
                  Pending Payments
                </Text>
                <Heading level={4}>{pendingCount}</Heading>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </Card>

          <Card padding="md" className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="caption" muted className="mb-1">
                  Received (Not Archived)
                </Text>
                <Heading level={4}>{paidCount}</Heading>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card padding="md" className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="caption" muted className="mb-1">
                  Total Pending Value
                </Text>
                <Heading level={4}>{formatCurrency(totalPending, 'AUD')}</Heading>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <Text variant="small" muted>
            {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            disabled={loading}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Payments List */}
        {loading ? (
          <Card padding="lg">
            <Text muted className="text-center">
              Loading payments...
            </Text>
          </Card>
        ) : payments.length === 0 ? (
          <Card padding="lg">
            <Text muted className="text-center">
              No pending payments found.
            </Text>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} padding="lg" className="transition-shadow hover:shadow-md">
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Heading level={5} className="break-all">
                          {payment.order_reference}
                        </Heading>
                        {getStatusBadge(payment.payment_status)}
                      </div>
                      <div className="space-y-1">
                        <Text variant="caption" className="block">
                          <strong className="font-semibold">Customer:</strong> {payment.customer_name}
                        </Text>
                        {payment.customer_email && (
                          <Text variant="caption" className="block">
                            <strong className="font-semibold">Email:</strong>{' '}
                            <a
                              href={`mailto:${payment.customer_email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {payment.customer_email}
                            </a>
                          </Text>
                        )}
                        <Text variant="caption" className="block">
                          <strong className="font-semibold">Phone:</strong>{' '}
                          <a
                            href={`tel:${payment.customer_phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {payment.customer_phone}
                          </a>
                        </Text>
                      </div>
                    </div>

                    <div className="text-right">
                      <Text variant="small" weight="semibold" className="mb-1 block text-lg">
                        {formatCurrency(payment.total_amount, payment.currency)}
                      </Text>
                      <Text variant="caption" muted className="block">
                        {formatDate(payment.created_at)}
                      </Text>
                      {payment.payment_viewed_at && (
                        <Text variant="caption" muted className="mt-1 block">
                          Viewed: {formatDate(payment.payment_viewed_at)}
                        </Text>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === payment.id ? null : payment.id)}
                    className="w-full text-left"
                  >
                    <Text variant="caption" className="text-blue-600 hover:underline">
                      {expandedId === payment.id ? 'Hide' : 'Show'} items ({payment.cart_items.length})
                    </Text>
                  </button>

                  {expandedId === payment.id && (
                    <div className="rounded-sm border border-carbon-900/10 bg-neutral-50 p-3">
                      <div className="space-y-2">
                        {payment.cart_items.map((item, idx) => (
                          <div key={idx} className="flex justify-between gap-3 text-sm">
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(item.price * item.quantity, payment.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {payment.admin_notes && (
                    <div className="rounded-sm border border-blue-200 bg-blue-50 p-3">
                      <Text variant="caption" className="text-blue-900">
                        <strong>Admin notes:</strong> {payment.admin_notes}
                      </Text>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-carbon-900/10 pt-4">
                    {payment.payment_status !== 'payment_received' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => markAsPaid(payment.id)}
                        disabled={processingId === payment.id}
                        className="inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark as Paid
                      </Button>
                    )}

                    {payment.payment_status === 'payment_received' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => archivePayment(payment.id)}
                        disabled={processingId === payment.id}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePayment(payment.id)}
                      disabled={processingId === payment.id}
                      className="inline-flex items-center gap-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
