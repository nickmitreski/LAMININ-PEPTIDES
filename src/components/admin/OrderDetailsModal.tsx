import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Mail, Phone, MapPin, Package, ExternalLink } from 'lucide-react';
import type { OrderReferenceRow, OrderStatusHistoryRow, PaymentTrackingRow } from '../../services/supabaseService';
import { Heading, Text } from '../ui/Typography';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { formatPrice } from '../../lib/formatCurrency';
import OrderDetailsPaymentSection from './OrderDetailsPaymentSection';
import OrderDetailsStatusTimeline, { mergeTimeline } from './OrderDetailsStatusTimeline';
import OrderCancelConfirmModal from './OrderCancelConfirmModal';
import OrderDetailsReconstitution from './OrderDetailsReconstitution';
import type { PaymentEventRow } from '../../services/orderTypes';

interface OrderDetailsModalProps {
  order: OrderReferenceRow;
  paymentTracking?: PaymentTrackingRow | null;
  statusHistory?: OrderStatusHistoryRow[];
  paymentEvents?: PaymentEventRow[];
  onPaymentAction?: (
    action: 'mark_paid' | 'archive' | 'cancel' | 'refund' | 'resend_email',
    trackingId: string,
    reason?: string
  ) => void;
  onClose: () => void;
}

export default function OrderDetailsModal({
  order,
  paymentTracking,
  statusHistory,
  paymentEvents,
  onPaymentAction,
  onClose,
}: OrderDetailsModalProps) {
  const [showReconstitution, setShowReconstitution] = useState(false);
  const [cancelMode, setCancelMode] = useState<null | 'cancel' | 'refund'>(null);

  const peptideItems = Array.isArray(order.peptide_items) ? order.peptide_items : [];

  const timeline = useMemo(
    () => mergeTimeline(statusHistory ?? [], paymentEvents ?? []),
    [statusHistory, paymentEvents]
  );

  return (
    <>
      <Modal
        open={true}
        onClose={onClose}
        aria-label="Order details"
        backdropClassName="bg-carbon-900/50 sm:p-4"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded-sm bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-carbon-900/10 bg-white px-4 py-4 sm:px-6">
          <Heading level={4} className="truncate">
            Order details
          </Heading>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              to={`/admin/orders/${encodeURIComponent(order.peptide_order_id)}`}
              target="_blank"
              rel="noopener"
              className="hidden min-h-11 items-center gap-1 rounded-sm px-2 py-1.5 text-xs text-carbon-600 hover:bg-grey/30 hover:text-carbon-900 sm:inline-flex"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Permalink
            </Link>
            <button
              onClick={onClose}
              className="min-h-11 min-w-11 touch-manipulation rounded-sm p-2 text-neutral-500 transition-colors hover:bg-grey/30 hover:text-carbon-900"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
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
                <span className="inline-flex items-center rounded-full border border-warning-border bg-warning-muted px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-warning-text">
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
                      className="flex items-center gap-2 text-sm text-accent hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {order.customer_phone}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            <Card padding="lg">
              <Heading level={5} className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Shipping address
              </Heading>
              <div className="space-y-1">
                {order.customer_address && <Text variant="small">{order.customer_address}</Text>}
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
                    name?: string;
                    cfg_code?: string;
                    id?: string;
                    quantity?: number | string;
                    line_total?: number;
                    unit_price?: number;
                    price?: number;
                    client_price?: number | string;
                  };
                  const displayName =
                    item.peptide_display_name || item.name || item.cfg_code || item.id || '—';
                  const code = item.cfg_code || item.id || '—';
                  const qty = Number(item.quantity ?? 0) || 0;
                  const serverPrice = Number(item.unit_price ?? item.price ?? 0) || 0;
                  const clientPrice = Number(item.client_price ?? 0) || 0;
                  const unit = serverPrice > 0 ? serverPrice : clientPrice;
                  const lineTotal = Number(item.line_total ?? unit * qty) || 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-sm border border-carbon-900/10 p-3"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <Text variant="small" weight="medium" className="mb-1 break-words">
                          {displayName}
                        </Text>
                        <Text variant="caption" muted>
                          Code: {code} • Qty: {qty}
                        </Text>
                      </div>
                      <div className="shrink-0 text-right">
                        <Text variant="small" weight="medium">
                          {formatPrice(lineTotal)}
                        </Text>
                        <Text variant="caption" muted>
                          {formatPrice(unit)} each
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

          {order.discount_code && (
            <Card padding="lg" className="border border-success-border bg-success-light">
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="small" weight="medium" className="text-success-text">
                    Discount applied
                  </Text>
                  <Text variant="caption" className="mt-1 font-mono text-success-dark">
                    {order.discount_code}
                  </Text>
                </div>
                {order.discount_amount != null && order.discount_amount > 0 && (
                  <Text variant="small" weight="semibold" className="text-success-text">
                    -{formatPrice(order.discount_amount)}
                  </Text>
                )}
              </div>
            </Card>
          )}

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

          {paymentTracking && (
            <OrderDetailsPaymentSection
              paymentTracking={paymentTracking}
              onPaymentAction={onPaymentAction}
              onCancelClick={() => setCancelMode('cancel')}
              onRefundClick={() => setCancelMode('refund')}
            />
          )}

          <OrderDetailsStatusTimeline entries={timeline} />

          <OrderDetailsReconstitution
            orderRef={order.peptide_order_id}
            customerName={order.customer_name ?? 'Customer'}
            peptideItems={peptideItems as Array<Record<string, unknown>>}
            expanded={showReconstitution}
            onToggle={() => setShowReconstitution((v) => !v)}
          />
        </div>

        <div className="shrink-0 border-t border-carbon-900/10 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {cancelMode && onPaymentAction && paymentTracking && (
        <OrderCancelConfirmModal
          mode={cancelMode}
          onClose={() => setCancelMode(null)}
          onConfirm={(reason) => {
            onPaymentAction(cancelMode, paymentTracking.id, reason);
            setCancelMode(null);
          }}
        />
      )}
    </>
  );
}
