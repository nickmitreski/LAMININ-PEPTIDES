import { X, Mail, Phone, MapPin, Package, DollarSign, CreditCard } from 'lucide-react';
import type { OrderReferenceRow, PaymentTrackingRow } from '../../services/supabaseService';
import { Heading, Text } from '../ui/Typography';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { formatPrice } from '../../lib/formatCurrency';

interface OrderDetailsModalProps {
  order: OrderReferenceRow;
  paymentTracking?: PaymentTrackingRow | null;
  onPaymentAction?: (action: 'mark_paid' | 'archive', trackingId: string) => void;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, paymentTracking, onPaymentAction, onClose }: OrderDetailsModalProps) {
  const peptideItems = Array.isArray(order.peptide_items)
    ? order.peptide_items
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-sm bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-carbon-900/10 bg-white px-6 py-4">
          <Heading level={4}>Order details</Heading>
          <button
            onClick={onClose}
            className="rounded-sm p-2 text-neutral-500 hover:bg-grey/30 hover:text-carbon-900 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <Card padding="md" className="border-l-4 border-l-accent">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Text variant="caption" muted className="mb-1 uppercase">
                  Order ID
                </Text>
                <Text variant="small" weight="medium" className="font-mono">
                  {order.peptide_order_id}
                </Text>
              </div>
              <div>
                <Text variant="caption" muted className="mb-1 uppercase">
                  Status
                </Text>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide bg-yellow-100 text-yellow-800 border-yellow-200">
                  {order.status}
                </span>
              </div>
              <div>
                <Text variant="caption" muted className="mb-1 uppercase">
                  Total
                </Text>
                <Text variant="small" weight="semibold" className="text-lg">
                  {formatPrice(order.total_price ?? 0)}
                </Text>
              </div>
              <div>
                <Text variant="caption" muted className="mb-1 uppercase">
                  Date
                </Text>
                <Text variant="small">
                  {new Date(order.created_at).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Customer Information */}
            <Card padding="lg">
              <Heading level={5} className="mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent" />
                Customer information
              </Heading>
              <div className="space-y-3">
                <div>
                  <Text variant="caption" muted className="mb-1">
                    Name
                  </Text>
                  <Text variant="small" weight="medium">
                    {order.customer_first_name} {order.customer_last_name}
                  </Text>
                </div>
                {order.customer_email && (
                  <div>
                    <Text variant="caption" muted className="mb-1">
                      Email
                    </Text>
                    <a
                      href={`mailto:${order.customer_email}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {order.customer_email}
                    </a>
                  </div>
                )}
                {order.customer_phone && (
                  <div>
                    <Text variant="caption" muted className="mb-1">
                      Phone
                    </Text>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="text-sm text-accent hover:underline flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      {order.customer_phone}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Shipping Address */}
            <Card padding="lg">
              <Heading level={5} className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Shipping address
              </Heading>
              <div className="space-y-1">
                {order.customer_address && (
                  <Text variant="small">{order.customer_address}</Text>
                )}
                {order.customer_city && order.customer_state && (
                  <Text variant="small">
                    {order.customer_city}, {order.customer_state} {order.customer_postcode}
                  </Text>
                )}
                {order.customer_country && (
                  <Text variant="small" weight="medium">
                    {order.customer_country}
                  </Text>
                )}
                {!order.customer_address && (
                  <Text variant="small" muted>
                    No shipping address provided
                  </Text>
                )}
              </div>
            </Card>
          </div>

          {/* Order Items */}
          <Card padding="lg">
            <Heading level={5} className="mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Order items ({peptideItems.length})
            </Heading>
            <div className="space-y-3">
              {peptideItems.length > 0 ? (
                peptideItems.map((rawItem: Record<string, unknown>, idx: number) => {
                  const item = rawItem as {
                    peptide_display_name?: string;
                    cfg_code?: string;
                    quantity?: number | string;
                    line_total?: number;
                    unit_price?: number;
                  };
                  return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-sm border border-carbon-900/10 p-3"
                  >
                    <div className="flex-1">
                      <Text variant="small" weight="medium" className="mb-1">
                        {item.peptide_display_name || item.cfg_code || '—'}
                      </Text>
                      <Text variant="caption" muted>
                        Code: {item.cfg_code ?? '—'} • Qty: {item.quantity ?? 0}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text variant="small" weight="medium">
                        {formatPrice(item.line_total ?? 0)}
                      </Text>
                      <Text variant="caption" muted>
                        {formatPrice(item.unit_price ?? 0)} each
                      </Text>
                    </div>
                  </div>
                  );
                })
              ) : (
                <Text variant="small" muted>
                  No items in this order
                </Text>
              )}
            </div>
          </Card>

          {/* Discount Section */}
          {order.discount_code && (
            <Card padding="lg" className="bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="small" weight="medium" className="text-green-800">
                    Discount applied
                  </Text>
                  <Text variant="caption" className="mt-1 font-mono text-green-700">
                    {order.discount_code}
                  </Text>
                </div>
                {order.discount_amount != null && order.discount_amount > 0 && (
                  <Text variant="small" weight="semibold" className="text-green-800">
                    -{formatPrice(order.discount_amount)}
                  </Text>
                )}
              </div>
            </Card>
          )}

          {/* Notes Section */}
          {order.notes && (
            <Card padding="lg" className="bg-grey/20">
              <Heading level={5} className="mb-2">
                Internal notes
              </Heading>
              <Text variant="small" className="whitespace-pre-wrap">
                {order.notes}
              </Text>
            </Card>
          )}

          {/* Payment Tracking Section */}
          {paymentTracking && (
            <div className="mt-6 rounded-lg border border-carbon-900/10 bg-grey/20 p-4">
              <h4 className="mb-3 text-sm font-semibold text-carbon-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Tracking
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-carbon-600">Status</span>
                  <span className="font-medium">
                    {paymentTracking.payment_status === 'payment_received' ? (
                      <span className="text-green-700">Paid</span>
                    ) : paymentTracking.payment_status === 'viewed_instructions' ? (
                      <span className="text-blue-700">Viewed instructions</span>
                    ) : (
                      <span className="text-amber-700">Pending</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-carbon-600">Amount</span>
                  <span className="font-medium">${paymentTracking.total_amount.toFixed(2)} {paymentTracking.currency}</span>
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
                {paymentTracking.payment_status !== 'payment_received' && onPaymentAction && (
                  <button
                    type="button"
                    onClick={() => onPaymentAction('mark_paid', paymentTracking.id)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-carbon-900/10 bg-white px-6 py-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
