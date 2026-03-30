import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Mail,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { getOrderStatus, type OrderReferenceRow } from '../services/supabaseService';
import { getLocalOrderSnapshot } from '../services/proteinCheckout';
import type { PeptideLinePayload, ProteinLinePayload } from '../services/proteinCheckout';

type UiState =
  | { kind: 'loading' }
  | { kind: 'not_found' }
  | { kind: 'ready'; order: OrderReferenceRow }
  | { kind: 'local_only'; snapshot: NonNullable<ReturnType<typeof getLocalOrderSnapshot>> };

function statusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Awaiting payment at the partner checkout.';
    case 'paid':
      return 'Payment received. Your order is being prepared.';
    case 'processing':
      return 'Your order is being processed.';
    case 'shipped':
      return 'Your order has shipped.';
    case 'delivered':
      return 'Delivered. Thank you for your order.';
    case 'cancelled':
      return 'This order was cancelled.';
    default:
      return 'Status updated.';
  }
}

function deliveryHint(status: string): string {
  if (status === 'shipped' || status === 'delivered') {
    return 'Standard delivery is typically 3–7 business days after dispatch, depending on your location.';
  }
  if (status === 'paid' || status === 'processing') {
    return 'We usually dispatch within 1–2 business days once payment is confirmed.';
  }
  return 'After payment, most orders ship within 1–2 business days.';
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId =
    searchParams.get('order_id') ??
    searchParams.get('order') ??
    '';

  const [ui, setUi] = useState<UiState>({ kind: 'loading' });

  const load = useCallback(async () => {
    if (!orderId.trim()) {
      setUi({ kind: 'not_found' });
      return;
    }

    setUi({ kind: 'loading' });
    const row = await getOrderStatus(orderId.trim());

    if (row) {
      setUi({ kind: 'ready', order: row });
      return;
    }

    const snap = getLocalOrderSnapshot(orderId.trim());
    if (snap) {
      setUi({ kind: 'local_only', snapshot: snap });
      return;
    }

    setUi({ kind: 'not_found' });
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  if (ui.kind === 'loading') {
    return (
      <div className="min-h-screen bg-platinum">
        <Section background="white" spacing="xl">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-accent-dark" />
            <Text variant="body" muted>
              Loading order…
            </Text>
          </div>
        </Section>
      </div>
    );
  }

  if (ui.kind === 'not_found') {
    return (
      <div className="min-h-screen bg-platinum">
        <Section background="white" spacing="xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <AlertCircle className="h-8 w-8 text-neutral-500" />
            </div>
            <Heading level={3} className="mb-3">
              Order not found
            </Heading>
            <Text variant="body" muted className="mb-8 block">
              We could not find that order reference. Check the link or contact
              support with any confirmation details you have.
            </Text>
            <Link to="/library">
              <Button variant="primary" size="md">
                Continue shopping
              </Button>
            </Link>
          </div>
        </Section>
      </div>
    );
  }

  const peptideItems =
    ui.kind === 'ready'
      ? (ui.order.peptide_items as PeptideLinePayload[] | null)
      : ui.snapshot.peptide_items;
  const proteinItems =
    ui.kind === 'ready'
      ? (ui.order.protein_items as ProteinLinePayload[] | null)
      : ui.snapshot.protein_items;

  const status =
    ui.kind === 'ready' ? ui.order.status : 'pending';
  const displayId =
    ui.kind === 'ready' ? ui.order.peptide_order_id : ui.snapshot.peptide_order_id;
  const email =
    ui.kind === 'ready'
      ? ui.order.customer_email ?? ''
      : ui.snapshot.customer.email;
  const total =
    ui.kind === 'ready'
      ? Number(ui.order.total_price ?? 0)
      : ui.snapshot.totals.grand_total;
  const supabaseNote =
    ui.kind === 'local_only' ? (
      <Card padding="md" className="mb-6 border-amber-200 bg-amber-50">
        <Text variant="small" className="text-amber-950">
          Order saved on this device only. Connect Supabase and complete setup to
          sync status across devices.
        </Text>
      </Card>
    ) : null;

  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="xl">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" strokeWidth={2} />
            </div>
            <Heading level={3} className="mb-3">
              Order reference created
            </Heading>
            <Text variant="body" muted className="mx-auto max-w-md">
              {status === 'pending'
                ? 'If you were not redirected, complete payment using the link from your confirmation email or return to checkout.'
                : 'Thank you — your order status is below.'}
            </Text>
          </div>

          {supabaseNote}

          <Card padding="lg" className="mb-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Text variant="small" muted className="mb-1">
                    Order reference
                  </Text>
                  <Text
                    variant="body"
                    weight="medium"
                    className="font-mono text-carbon-900"
                  >
                    {displayId}
                  </Text>
                </div>
                <div className="sm:text-right">
                  <Text variant="small" muted className="mb-1">
                    Status
                  </Text>
                  <Text
                    variant="body"
                    weight="medium"
                    className="uppercase tracking-wide text-carbon-900"
                  >
                    {status}
                  </Text>
                </div>
              </div>

              <div className="rounded-sm border border-carbon-900/10 bg-grey/30 p-4">
                <Text variant="small" className="text-carbon-900">
                  {statusMessage(status)}
                </Text>
                <Text variant="caption" muted className="mt-2 block">
                  {deliveryHint(status)}
                </Text>
              </div>

              <div className="border-t border-carbon-900/10 pt-6">
                <Text variant="small" weight="medium" className="mb-3 text-carbon-900">
                  Line items (research + fulfilment mapping)
                </Text>
                <ul className="space-y-3">
                  {(peptideItems ?? []).map((p, i) => {
                    const mate = (proteinItems ?? [])[i];
                    return (
                      <li
                        key={`${p.cfg_code}-${i}`}
                        className="rounded-sm border border-carbon-900/10 bg-white p-3 text-left"
                      >
                        <Text variant="caption" weight="medium" className="text-carbon-900">
                          {p.peptide_display_name}{' '}
                          <span className="font-normal text-neutral-500">
                            ({p.cfg_code}) × {p.quantity}
                          </span>
                        </Text>
                        {mate ? (
                          <Text variant="caption" muted className="mt-1 block">
                            Fulfilment: {mate.protein_name}
                          </Text>
                        ) : null}
                        <Text variant="caption" muted className="mt-1">
                          ${p.line_total.toFixed(2)}
                        </Text>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex items-center justify-between border-t border-carbon-900/10 pt-4">
                <Text variant="small" weight="medium">
                  Total
                </Text>
                <Text variant="body" weight="medium">
                  ${total.toFixed(2)}
                </Text>
              </div>

              {email ? (
                <div className="flex items-start gap-4 border-t border-carbon-900/10 pt-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                    <Mail className="h-5 w-5 text-accent-dark" />
                  </div>
                  <div>
                    <Text variant="small" weight="medium" className="mb-1 text-carbon-900">
                      Contact
                    </Text>
                    <Text variant="caption" muted>
                      {email}
                    </Text>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-4 border-t border-carbon-900/10 pt-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Package className="h-5 w-5 text-accent-dark" />
                </div>
                <div>
                  <Text variant="small" weight="medium" className="mb-1 text-carbon-900">
                    Support
                  </Text>
                  <Text variant="caption" muted>
                    Questions? Email{' '}
                    <a
                      href="mailto:info@lamininpeplab.com.au"
                      className="font-medium text-carbon-900 underline underline-offset-2"
                    >
                      info@lamininpeplab.com.au
                    </a>
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => load()}
            >
              <RefreshCw className="mr-2 inline-block h-4 w-4" />
              Check order status
            </Button>
            <Link to="/library" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full">
                Continue shopping
              </Button>
            </Link>
            <Link to="/contact" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                Contact support
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
