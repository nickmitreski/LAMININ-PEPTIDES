import { CreditCard, DollarSign, Send } from 'lucide-react';
import type { PaymentTrackingRow } from '../../services/supabaseService';
import { formatPrice } from '../../lib/formatCurrency';

type PaymentAction = 'mark_paid' | 'archive' | 'cancel' | 'refund' | 'resend_email';

type Props = {
  paymentTracking: PaymentTrackingRow;
  onPaymentAction?: (action: PaymentAction, trackingId: string, reason?: string) => void;
  onCancelClick: () => void;
  onRefundClick: () => void;
};

export default function OrderDetailsPaymentSection({
  paymentTracking,
  onPaymentAction,
  onCancelClick,
  onRefundClick,
}: Props) {
  return (
    <div className="mt-6 rounded-lg border border-carbon-900/10 bg-grey/20 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-carbon-900">
        <CreditCard className="h-4 w-4" />
        Payment tracking
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-carbon-600">Status</span>
          <span className="font-medium">
            {paymentTracking.payment_status === 'payment_received' ? (
              <span className="text-success-dark">Paid</span>
            ) : paymentTracking.payment_status === 'viewed_instructions' ? (
              <span className="text-blue-700">Viewed instructions</span>
            ) : (
              <span className="text-warning-dark">Pending</span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-carbon-600">Amount</span>
          <span className="font-medium">
            {formatPrice(paymentTracking.total_amount)} {paymentTracking.currency}
          </span>
        </div>
        {paymentTracking.payment_viewed_at && (
          <div className="flex justify-between">
            <span className="text-carbon-600">Instructions viewed</span>
            <span>{new Date(paymentTracking.payment_viewed_at).toLocaleString()}</span>
          </div>
        )}
        {paymentTracking.payment_completed_at && (
          <div className="flex justify-between">
            <span className="text-carbon-600">Payment received</span>
            <span>{new Date(paymentTracking.payment_completed_at).toLocaleString()}</span>
          </div>
        )}
        {paymentTracking.admin_notes && (
          <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
            <strong>Notes:</strong> {paymentTracking.admin_notes}
          </div>
        )}
        {onPaymentAction && paymentTracking.payment_status !== 'cancelled' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {paymentTracking.payment_status !== 'payment_received' && (
              <button
                type="button"
                onClick={() => onPaymentAction('mark_paid', paymentTracking.id)}
                className="inline-flex min-h-11 min-w-11 touch-manipulation items-center gap-1.5 rounded-sm bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success-dark"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Mark as paid
              </button>
            )}
            {paymentTracking.customer_email && (
              <button
                type="button"
                onClick={() => onPaymentAction('resend_email', paymentTracking.id)}
                className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-sm border border-carbon-900/20 bg-white px-3 py-1.5 text-xs font-medium text-carbon-900 hover:bg-grey/30"
                title={`Resend instructions to ${paymentTracking.customer_email}`}
              >
                <Send className="h-3.5 w-3.5" />
                Resend instructions
              </button>
            )}
            <button
              type="button"
              onClick={onCancelClick}
              className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-sm border border-error-border bg-white px-3 py-1.5 text-xs font-medium text-error hover:bg-error-light"
            >
              Cancel order
            </button>
            {paymentTracking.payment_status === 'payment_received' && (
              <button
                type="button"
                onClick={onRefundClick}
                className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-sm border border-warning-border bg-white px-3 py-1.5 text-xs font-medium text-warning-text hover:bg-warning-light"
              >
                Refund &amp; cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
