import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Mail, Phone, MapPin, Package, DollarSign, CreditCard, Download, Beaker, ExternalLink, Clock, Send } from 'lucide-react';
import type { OrderReferenceRow, OrderStatusHistoryRow, PaymentTrackingRow } from '../../services/supabaseService';
import { Heading, Text } from '../ui/Typography';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { formatPrice } from '../../lib/formatCurrency';

interface OrderDetailsModalProps {
  order: OrderReferenceRow;
  paymentTracking?: PaymentTrackingRow | null;
  /** Optional timeline of status changes — only rendered when non-empty. */
  statusHistory?: OrderStatusHistoryRow[];
  onPaymentAction?: (
    action: 'mark_paid' | 'archive' | 'cancel' | 'refund' | 'resend_email',
    trackingId: string,
    reason?: string
  ) => void;
  onClose: () => void;
}

/** Default reconstitution presets per peptide strength (mg) */
function defaultReconstitution(name: string, strengthMg: number) {
  // Skip ancillaries (BAC water, acetic acid)
  const lower = name.toLowerCase();
  if (lower.includes('water') || lower.includes('acetic') || lower.includes('glutathione') || lower.includes('nad')) {
    return null;
  }
  // Standard: 1ml BAC water per 5mg peptide, round to nearest 0.5
  const bacWaterMl = Math.max(0.5, Math.round((strengthMg / 5) * 2) / 2);
  const concentrationMcg = (strengthMg * 1000) / bacWaterMl; // mcg per ml
  return {
    bacWaterMl,
    concentrationMcg: Math.round(concentrationMcg),
    strengthMg,
  };
}

function parseStrengthMg(name: string): number {
  const match = name.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  return match ? parseFloat(match[1]) : 10;
}

function exportReconstitutionCsv(
  orderRef: string,
  customerName: string,
  items: Array<{ name: string; qty: number; strengthMg: number; bacWaterMl: number; concentrationMcg: number }>
) {
  const headers = ['Product', 'Quantity', 'Strength (mg)', 'BAC Water (ml)', 'Concentration (mcg/ml)'];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((item) =>
    [item.name, item.qty, item.strengthMg, item.bacWaterMl, item.concentrationMcg]
      .map(escape)
      .join(',')
  );
  const csv = [
    `Reconstitution Guide — ${orderRef}`,
    `Customer: ${customerName}`,
    '',
    headers.join(','),
    ...rows,
    '',
    'Note: These are recommended starting values. Adjust based on research protocol requirements.',
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reconstitution-${orderRef}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function OrderDetailsModal({ order, paymentTracking, statusHistory, onPaymentAction, onClose }: OrderDetailsModalProps) {
  const [showReconstitution, setShowReconstitution] = useState(false);
  const [cancelMode, setCancelMode] = useState<null | 'cancel' | 'refund'>(null);
  const [cancelReason, setCancelReason] = useState('');

  const peptideItems = Array.isArray(order.peptide_items)
    ? order.peptide_items
    : [];

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
          <Heading level={4} className="truncate">Order details</Heading>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              to={`/admin/orders/${encodeURIComponent(order.peptide_order_id)}`}
              target="_blank"
              rel="noopener"
              className="hidden items-center gap-1 rounded-sm px-2 py-1.5 text-xs text-carbon-600 hover:bg-grey/30 hover:text-carbon-900 sm:inline-flex"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Permalink
            </Link>
            <button
              onClick={onClose}
              className="rounded-sm p-2 text-neutral-500 hover:bg-grey/30 hover:text-carbon-900 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide bg-warning-muted text-warning-text border-warning-border">
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
                    name?: string;
                    cfg_code?: string;
                    id?: string;
                    quantity?: number | string;
                    line_total?: number;
                    unit_price?: number;
                    price?: number;
                    /** Set by the server when the canonical lookup missed and
                     *  the client's price is the only signal we have. */
                    client_price?: number | string;
                  };
                  const displayName =
                    item.peptide_display_name || item.name || item.cfg_code || item.id || '—';
                  const code = item.cfg_code || item.id || '—';
                  const qty = Number(item.quantity ?? 0) || 0;
                  // Server-side recompute stamps price=0 when the lookup misses
                  // (e.g. cart item id didn't match a cfg_code). Fall back to
                  // client_price so legacy orders still show the customer-visible
                  // total rather than a confusing $0.
                  const serverPrice = Number(item.unit_price ?? item.price ?? 0) || 0;
                  const clientPrice = Number(item.client_price ?? 0) || 0;
                  const unit = serverPrice > 0 ? serverPrice : clientPrice;
                  const lineTotal = Number(item.line_total ?? unit * qty) || 0;
                  return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-sm border border-carbon-900/10 p-3"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <Text variant="small" weight="medium" className="mb-1 break-words">
                        {displayName}
                      </Text>
                      <Text variant="caption" muted>
                        Code: {code} • Qty: {qty}
                      </Text>
                    </div>
                    <div className="text-right shrink-0">
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

          {/* Discount Section */}
          {order.discount_code && (
            <Card padding="lg" className="bg-success-light border border-success-border">
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
                  <span className="font-medium">{formatPrice(paymentTracking.total_amount)} {paymentTracking.currency}</span>
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
                        className="inline-flex items-center gap-1.5 rounded-sm bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success-dark"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        Mark as Paid
                      </button>
                    )}
                    {paymentTracking.customer_email && (
                      <button
                        type="button"
                        onClick={() => onPaymentAction('resend_email', paymentTracking.id)}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-carbon-900/20 bg-white px-3 py-1.5 text-xs font-medium text-carbon-900 hover:bg-grey/30"
                        title={`Resend instructions to ${paymentTracking.customer_email}`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Resend instructions
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setCancelMode('cancel'); setCancelReason(''); }}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-error-border bg-white px-3 py-1.5 text-xs font-medium text-error hover:bg-error-light"
                    >
                      Cancel order
                    </button>
                    {paymentTracking.payment_status === 'payment_received' && (
                      <button
                        type="button"
                        onClick={() => { setCancelMode('refund'); setCancelReason(''); }}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-warning-border bg-white px-3 py-1.5 text-xs font-medium text-warning-text hover:bg-warning-light"
                      >
                        Refund &amp; cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Status History Section */}
        {statusHistory && statusHistory.length > 0 && (
          <Card padding="lg">
            <Heading level={5} className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Status history ({statusHistory.length})
            </Heading>
            <ol className="space-y-3">
              {statusHistory.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-l-2 border-carbon-900/10 pl-3"
                >
                  <div className="min-w-0">
                    <Text variant="small" weight="medium" className="break-words">
                      {h.from_status ? `${h.from_status} → ` : ''}{h.to_status}
                    </Text>
                    {h.note && (
                      <Text variant="caption" muted className="mt-0.5 break-words">
                        {h.note}
                      </Text>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <Text variant="caption" muted>
                      {new Date(h.created_at).toLocaleString('en-AU', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {h.actor && h.actor !== 'system' && (
                      <Text variant="caption" muted className="block font-mono text-[0.65rem]">
                        {h.actor.slice(0, 8)}
                      </Text>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Reconstitution Guide Section */}
        {peptideItems.length > 0 && (
          <div className="px-6 pb-4">
            <button
              type="button"
              onClick={() => setShowReconstitution(!showReconstitution)}
              className="inline-flex items-center gap-2 rounded-sm border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-medium text-accent-800 transition-colors hover:bg-accent-100 w-full justify-center"
            >
              <Beaker className="h-4 w-4" />
              {showReconstitution ? 'Hide' : 'Show'} Reconstitution Guide
            </button>

            {showReconstitution && (() => {
              const reconItems = peptideItems
                .map((rawItem: Record<string, unknown>) => {
                  const item = rawItem as {
                    peptide_display_name?: string;
                    name?: string;
                    cfg_code?: string;
                    quantity?: number | string;
                  };
                  const name = (item.peptide_display_name || item.name || item.cfg_code || 'Unknown') as string;
                  const strengthMg = parseStrengthMg(name);
                  const recon = defaultReconstitution(name, strengthMg);
                  if (!recon) return null;
                  return {
                    name,
                    qty: Number(item.quantity) || 1,
                    strengthMg: recon.strengthMg,
                    bacWaterMl: recon.bacWaterMl,
                    concentrationMcg: recon.concentrationMcg,
                  };
                })
                .filter(Boolean) as Array<{
                  name: string;
                  qty: number;
                  strengthMg: number;
                  bacWaterMl: number;
                  concentrationMcg: number;
                }>;

              if (reconItems.length === 0) return null;

              return (
                <div className="mt-3 rounded-lg border border-accent-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Text variant="small" weight="medium" className="text-accent-900">
                      Recommended reconstitution
                    </Text>
                    <button
                      type="button"
                      onClick={() =>
                        exportReconstitutionCsv(
                          order.peptide_order_id,
                          order.customer_name ?? 'Customer',
                          reconItems
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-sm bg-carbon-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-carbon-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-carbon-200 text-left text-xs text-carbon-500">
                          <th className="pb-2 pr-4">Product</th>
                          <th className="pb-2 pr-4">Qty</th>
                          <th className="pb-2 pr-4">Strength</th>
                          <th className="pb-2 pr-4">BAC Water</th>
                          <th className="pb-2">Concentration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-carbon-100 last:border-0">
                            <td className="py-2 pr-4 font-medium">{item.name}</td>
                            <td className="py-2 pr-4">{item.qty}</td>
                            <td className="py-2 pr-4">{item.strengthMg}mg</td>
                            <td className="py-2 pr-4">{item.bacWaterMl}ml</td>
                            <td className="py-2">{item.concentrationMcg} mcg/ml</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Text variant="caption" className="mt-3 text-carbon-500">
                    These are recommended starting values. Adjust based on research protocol requirements.
                  </Text>
                </div>
              );
            })()}
          </div>
        )}

        </div>

        <div className="shrink-0 border-t border-carbon-900/10 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
    </Modal>

    {/* Cancel / refund confirm sub-modal */}
    {cancelMode && onPaymentAction && paymentTracking && (
      <Modal
        open={true}
        onClose={() => setCancelMode(null)}
        aria-label={cancelMode === 'refund' ? 'Confirm refund' : 'Confirm cancellation'}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="border-b border-carbon-200 px-5 py-4">
          <Heading level={4} className="truncate">
            {cancelMode === 'refund' ? 'Refund and cancel' : 'Cancel order'}
          </Heading>
          <Text variant="caption" muted className="mt-1">
            {cancelMode === 'refund'
              ? 'Marks the order cancelled and records refund intent. Refund must still be processed in your payment provider.'
              : 'Marks the order cancelled. Items will not be shipped.'}
          </Text>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <label className="block">
            <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
              Reason (required)
            </Text>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              autoFocus
              placeholder={
                cancelMode === 'refund'
                  ? 'e.g. Customer requested refund within 24h; refund issued via Stripe…'
                  : 'e.g. Out of stock; customer asked to cancel before payment…'
              }
              className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </label>
          <Text variant="caption" muted>
            This reason is appended to the order's internal notes and logged in the audit trail.
          </Text>
        </div>
        <div className="shrink-0 border-t border-carbon-200 bg-carbon-50 px-5 py-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelMode(null)}>
              Back
            </Button>
            <Button
              size="sm"
              disabled={!cancelReason.trim()}
              onClick={() => {
                onPaymentAction(cancelMode, paymentTracking.id, cancelReason.trim());
                setCancelMode(null);
                setCancelReason('');
              }}
              className={
                cancelMode === 'refund'
                  ? 'bg-warning text-white hover:bg-warning-dark'
                  : 'bg-error text-white hover:bg-error-dark'
              }
            >
              {cancelMode === 'refund' ? 'Refund & cancel' : 'Cancel order'}
            </Button>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}
