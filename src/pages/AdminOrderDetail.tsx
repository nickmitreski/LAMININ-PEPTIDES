import { useCallback, useEffect, useState } from 'react';
import usePaymentTrackingRealtime from '../hooks/usePaymentTrackingRealtime';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AdminNavigation from '../components/admin/AdminNavigation';
import OrderDetailsModal from '../components/admin/OrderDetailsModal';
import Section from '../components/layout/Section';
import { Heading, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  cancelOrder,
  getOrderById,
  getOrderByReference,
  getOrderStatusHistory,
  updateOrderStatus,
  type OrderReferenceRow,
  type OrderStatus,
  type OrderStatusHistoryRow,
} from '../services/supabaseService';
import { resendOrderInstructionsEmail } from '../services/emailService';
import { getAdminSupabase } from '../lib/supabaseAdminClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Dedicated admin order detail page — `/admin/orders/:id`.
 *
 * `:id` accepts either the payment_tracking UUID or the human order reference
 * (LM-XXXXXX). Reuses OrderDetailsModal for the body so there's one source of
 * truth for how an order is displayed. Closing navigates back to the dashboard.
 */
export default function AdminOrderDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();
  useDocumentTitle(`Order ${id}`, 'Order detail');

  const [order, setOrder] = useState<OrderReferenceRow | null>(null);
  const [history, setHistory] = useState<OrderStatusHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      const client = getAdminSupabase();
      const looksLikeUuid = UUID_RE.test(id);
      const result = looksLikeUuid
        ? await getOrderById(id, client)
        : await getOrderByReference(id, client);
      if (!result) {
        setError('Order not found.');
        setOrder(null);
        setHistory([]);
      } else {
        setOrder(result);
        const rows = await getOrderStatusHistory(result.id, client);
        setHistory(rows);
      }
      if (!opts?.silent) setLoading(false);
    },
    [id]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await loadOrder();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOrder]);

  // Realtime: if the current order changes underneath us (e.g. another tab
  // marks it paid), refresh silently. Scoped to the loaded row so we don't
  // get woken up by every order in the schema. When the order isn't loaded
  // yet, the hook stays disabled.
  usePaymentTrackingRealtime(
    useCallback(() => loadOrder({ silent: true }), [loadOrder]),
    { rowId: order?.id, enabled: !!order }
  );

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleClose = () => {
    // Prefer back navigation when there's history; fall back to dashboard.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handlePaymentAction = async (
    action: 'mark_paid' | 'archive' | 'cancel' | 'refund' | 'resend_email',
    trackingId: string,
    reason?: string
  ) => {
    if (!order) return;
    const client = getAdminSupabase();

    if (action === 'resend_email') {
      if (!order.customer_email) {
        showToast('No customer email on this order.', 'error');
        return;
      }
      const r = await resendOrderInstructionsEmail({
        trackingId,
        orderReference: order.peptide_order_id,
        customerEmail: order.customer_email,
        customerName: order.customer_name ?? 'Customer',
        customerPhone: order.customer_phone ?? undefined,
        totalAmount: order.total_price ?? 0,
        currency: order.currency ?? 'AUD',
      });
      if (r.success) {
        showToast(`Instructions resent to ${order.customer_email}`, 'success');
      } else {
        showToast(r.error ?? 'Could not resend email.', 'error');
      }
      // Refresh status history so the audit row appears (it's in admin_audit_log,
      // not order_status_history, but a refresh is cheap and consistent).
      const rows = await getOrderStatusHistory(order.id, client);
      setHistory(rows);
      return;
    }

    if (action === 'cancel' || action === 'refund') {
      if (!reason || !reason.trim()) {
        showToast('A reason is required.', 'error', 3000);
        return;
      }
      const result = await cancelOrder(
        order.id,
        { reason, refunded: action === 'refund' },
        client
      );
      if (!result.success) {
        showToast(result.error ?? 'Could not cancel order.', 'error', 3500);
        return;
      }
      showToast(
        action === 'refund' ? 'Order refunded and cancelled.' : 'Order cancelled.',
        'success',
        2500
      );
    } else {
      const next: OrderStatus = action === 'mark_paid' ? 'payment_received' : 'cancelled';
      const ok = await updateOrderStatus(order.peptide_order_id, next, client);
      if (!ok) {
        showToast('Could not update order — try again.', 'error', 3000);
        return;
      }
      showToast(action === 'mark_paid' ? 'Marked as paid.' : 'Order archived.', 'success', 2500);
    }

    // Refresh order + history after the action.
    const refreshed = await getOrderById(order.id, client);
    setOrder(refreshed);
    if (refreshed) {
      const rows = await getOrderStatusHistory(refreshed.id, client);
      setHistory(rows);
    }
  };

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
            <Text className="ml-3 text-carbon-600">Loading order…</Text>
          </div>
        )}
        {!loading && error && (
          <div className="mx-auto max-w-md py-12 text-center">
            <Heading level={3} className="mb-2">Order not found</Heading>
            <Text muted className="mb-6">
              We couldn't find an order with reference{' '}
              <code className="font-mono">{id}</code>.
            </Text>
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
              Back to orders
            </Button>
          </div>
        )}
      </Section>

      {!loading && order && (
        <OrderDetailsModal
          order={order}
          paymentTracking={{
            id: order.id,
            order_reference: order.peptide_order_id,
            customer_email: order.customer_email ?? '',
            customer_name: order.customer_name ?? '',
            customer_phone: order.customer_phone ?? '',
            customer_address: null,
            cart_items: order.cart_items ?? [],
            subtotal: order.subtotal ?? 0,
            shipping: order.shipping ?? 0,
            tax: order.tax ?? 0,
            total_amount: order.total_price ?? 0,
            currency: order.currency ?? 'AUD',
            payment_status: order.payment_status,
            payment_viewed_at: order.payment_viewed_at,
            payment_completed_at: order.payment_completed_at,
            admin_notes: order.notes,
            created_at: order.created_at,
            updated_at: order.updated_at,
          }}
          statusHistory={history}
          onPaymentAction={handlePaymentAction}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
