import { X, Mail, Phone, MapPin, Package, Calendar, DollarSign } from 'lucide-react';
import type { OrderReferenceRow } from '../../services/supabaseService';
import { Heading, Text } from '../ui/Typography';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface OrderDetailsModalProps {
  order: OrderReferenceRow;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const peptideItems = Array.isArray(order.peptide_items)
    ? order.peptide_items
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-sm bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-carbon-900/10 bg-white px-6 py-4">
          <Heading level={4}>Order Details</Heading>
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
                  ${order.total_price?.toFixed(2) || '0.00'}
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
                Customer Information
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
                Shipping Address
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
              Order Items ({peptideItems.length})
            </Heading>
            <div className="space-y-3">
              {peptideItems.length > 0 ? (
                peptideItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-sm border border-carbon-900/10 p-3"
                  >
                    <div className="flex-1">
                      <Text variant="small" weight="medium" className="mb-1">
                        {item.peptide_display_name || item.cfg_code}
                      </Text>
                      <Text variant="caption" muted>
                        Code: {item.cfg_code} • Qty: {item.quantity}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text variant="small" weight="medium">
                        ${item.line_total?.toFixed(2) || '0.00'}
                      </Text>
                      <Text variant="caption" muted>
                        ${item.unit_price?.toFixed(2)} each
                      </Text>
                    </div>
                  </div>
                ))
              ) : (
                <Text variant="small" muted>
                  No items in this order
                </Text>
              )}
            </div>
          </Card>

          {/* Notes Section */}
          {order.notes && (
            <Card padding="lg" className="bg-grey/20">
              <Heading level={5} className="mb-2">
                Internal Notes
              </Heading>
              <Text variant="small" className="whitespace-pre-wrap">
                {order.notes}
              </Text>
            </Card>
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
