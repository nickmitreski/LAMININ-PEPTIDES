import { useCallback, useEffect, useState } from 'react';
import usePaymentTrackingRealtime from '../hooks/usePaymentTrackingRealtime';
import { useNavigate } from 'react-router-dom';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { markPaymentReceived } from '../services/supabaseService';
import AdminNavigation from '../components/admin/AdminNavigation';
import Section from '../components/layout/Section';
import { Heading, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Clock, Eye, Package, RefreshCw, Trash2, Archive, AlertTriangle } from 'lucide-react';

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
  useDocumentTitle("Payment Tracking", "Monitor payment status and confirmations.");
  const navigate = useNavigate();
  const { logout, user: adminUser } = useAdminAuth();
  const [payments, setPayments] = useState<PaymentTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'archive' | 'delete' } | null>(null);
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const fetchPayments = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const supabase = getAdminSupabase();
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
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  // Live updates so when one admin marks an order paid, the other sees it instantly.
  usePaymentTrackingRealtime(
    useCallback(() => fetchPayments({ silent: true }), [fetchPayments])
  );

  const markAsPaid = async (id: string) => {
    try {
      setProcessingId(id);
      const supabase = getAdminSupabase();
      if (!supabase) {
        showToast('Supabase client not initialized', 'error');
        return;
      }
      const m = await markPaymentReceived(id, adminUser?.email ?? 'admin', null, supabase);
      if (!m.success) {
        throw new Error(m.error ?? 'Unknown error');
      }
      await fetchPayments();
      if (m.notifySmsError) {
        showToast(`Payment saved. SMS not sent: ${m.notifySmsError}`, 'error');
      } else if (m.notifySmsSkipped && m.notifySmsSkipReason === 'no_phone') {
        showToast('Marked paid. No customer phone — SMS skipped.', 'success');
      } else {
        showToast('Payment marked as received.', 'success');
      }
    } catch (err) {
      console.error('Error marking as paid:', err);
      showToast('Failed to mark as paid: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { id, type } = confirmAction;
    try {
      setProcessingId(id);
      const supabase = getAdminSupabase();
      if (!supabase) {
        showToast('Supabase client not initialized', 'error');
        return;
      }
      if (type === 'archive') {
        const { error } = await supabase.rpc('archive_payment', {
          p_tracking_id: id,
          p_admin_email: adminUser?.email ?? 'admin',
        });
        if (error) throw error;
        showToast('Payment archived', 'success');
      } else {
        const { error } = await supabase.rpc('admin_delete_payment_tracking', {
          p_tracking_id: id,
        });
        if (error) throw error;
        showToast('Payment deleted', 'success');
      }
      setConfirmAction(null);
      await fetchPayments();
    } catch (err) {
      console.error(`Error ${confirmAction.type} payment:`, err);
      showToast(`Failed to ${confirmAction.type}: ` + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'payment_received') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-success-muted px-2.5 py-1 text-xs font-medium text-success-text">
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
      <span className="inline-flex items-center gap-1.5 rounded-sm bg-warning-muted px-2.5 py-1 text-xs font-medium text-warning-text">
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
    <div className="admin-page min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {/* Header */}
        <div className="mb-6">
          <Heading level={1} className="mb-2">
            Payment tracking
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
                  Pending payments
                </Text>
                <Heading level={4}>{pendingCount}</Heading>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </Card>

          <Card padding="md" className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="caption" muted className="mb-1">
                  Received (not archived)
                </Text>
                <Heading level={4}>{paidCount}</Heading>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </Card>

          <Card padding="md" className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="caption" muted className="mb-1">
                  Total pending value
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
            onClick={() => fetchPayments()}
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
                        Mark as paid
                      </Button>
                    )}

                    {payment.payment_status === 'payment_received' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setConfirmAction({ id: payment.id, type: 'archive' })}
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
                      onClick={() => setConfirmAction({ id: payment.id, type: 'delete' })}
                      disabled={processingId === payment.id}
                      className="inline-flex items-center gap-1.5 text-error hover:bg-error-light"
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

      {/* Confirm archive/delete modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !processingId && setConfirmAction(null)}
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
                <Heading level={3} className="mb-1">
                  {confirmAction.type === 'archive' ? 'Archive this payment?' : 'Delete this payment?'}
                </Heading>
                <Text variant="small" className="text-carbon-600">
                  {confirmAction.type === 'archive'
                    ? 'This payment will be moved to the archive.'
                    : 'This will permanently remove the payment tracking record. This cannot be undone.'}
                </Text>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction(null)}
                disabled={!!processingId}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => void handleConfirmAction()}
                disabled={!!processingId}
                className="inline-flex items-center justify-center rounded-sm bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingId ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : confirmAction.type === 'archive' ? (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
