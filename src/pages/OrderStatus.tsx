import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Mail, Package, Search, XCircle } from 'lucide-react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { lookupOrderStatus, type OrderStatusLookupResult } from '../services/bankTransferPayment';
import {
  formatPaymentDeadlineLocal,
  PAYMENT_DEADLINE_HOURS,
} from '../lib/shippingPolicy';

interface DisplayState {
  status: 'awaiting_payment' | 'received' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'unknown';
  label: string;
  description: string;
  icon: typeof Clock;
  tone: 'warning' | 'info' | 'success' | 'error';
}

function statusDisplay(paymentStatus: string): DisplayState {
  switch (paymentStatus) {
    case 'pending':
    case 'viewed_instructions':
      return {
        status: 'awaiting_payment',
        label: 'Awaiting payment',
        description:
          "We're waiting for your bank transfer to arrive. As soon as it does, we'll mark your order paid and start preparing it.",
        icon: Clock,
        tone: 'warning',
      };
    case 'payment_received':
      return {
        status: 'received',
        label: 'Payment received',
        description:
          "Your payment has been received. We'll dispatch your order on the next business day.",
        icon: CheckCircle2,
        tone: 'success',
      };
    case 'processing':
      return {
        status: 'processing',
        label: 'Being prepared',
        description: 'Your order is being prepared for dispatch.',
        icon: Package,
        tone: 'info',
      };
    case 'shipped':
      return {
        status: 'shipped',
        label: 'Shipped',
        description: 'Your order is on its way. Tracking details will be sent separately if available.',
        icon: Package,
        tone: 'success',
      };
    case 'delivered':
      return {
        status: 'delivered',
        label: 'Delivered',
        description: 'Your order has been delivered. Thanks for your purchase.',
        icon: CheckCircle2,
        tone: 'success',
      };
    case 'cancelled':
      return {
        status: 'cancelled',
        label: 'Cancelled',
        description:
          "This order has been cancelled. If you weren't expecting this, please contact us.",
        icon: XCircle,
        tone: 'error',
      };
    default:
      return {
        status: 'unknown',
        label: paymentStatus,
        description: 'Please contact us for the latest status of your order.',
        icon: Clock,
        tone: 'info',
      };
  }
}

const TONE_CLASSES: Record<DisplayState['tone'], { card: string; text: string; iconBg: string }> = {
  warning: {
    card: 'border-warning-border bg-warning-light',
    text: 'text-warning-text',
    iconBg: 'bg-warning-muted text-warning',
  },
  info: {
    card: 'border-info-border bg-info-light',
    text: 'text-info-text',
    iconBg: 'bg-info-muted text-info',
  },
  success: {
    card: 'border-success-border bg-success-light',
    text: 'text-success-text',
    iconBg: 'bg-success-muted text-success',
  },
  error: {
    card: 'border-error-border bg-error-light',
    text: 'text-error-text',
    iconBg: 'bg-error-muted text-error',
  },
};

export default function OrderStatus() {
  useDocumentTitle(
    'Order status',
    'Look up the status of your bank-transfer order by reference and email.'
  );
  const [params, setParams] = useSearchParams();
  const [orderRef, setOrderRef] = useState(params.get('ref') ?? '');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OrderStatusLookupResult | null>(null);

  // Auto-run lookup if both query params are present (e.g. linked from email).
  useEffect(() => {
    const r = params.get('ref');
    const e = params.get('email');
    if (r && e && !result) {
      void runLookup(r, e);
    }
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runLookup = async (ref: string, em: string) => {
    setSubmitting(true);
    const r = await lookupOrderStatus(ref, em);
    setResult(r);
    setSubmitting(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    // Persist into URL so a refresh keeps state, but never leak the email
    // farther than necessary — keep it as a query param, not a path segment.
    const next = new URLSearchParams();
    if (orderRef.trim()) next.set('ref', orderRef.trim());
    if (email.trim()) next.set('email', email.trim());
    setParams(next, { replace: true });
    await runLookup(orderRef, email);
  };

  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="xl">
        <div className="mx-auto max-w-2xl px-4 sm:px-0">
          <div className="mb-8 text-center">
            <Heading level={3} className="mb-3 text-2xl sm:text-3xl">
              Order status
            </Heading>
            <Text variant="body" muted className="mx-auto max-w-md">
              Enter your order reference and the email you used at checkout. No account needed.
            </Text>
          </div>

          <Card padding="lg" className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                  Order reference
                </Text>
                <input
                  type="text"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  placeholder="LM-XXXXXX"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className="w-full rounded-sm border border-carbon-200 px-3 py-2.5 font-mono text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  required
                />
              </label>
              <label className="block">
                <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                  Email used at checkout
                </Text>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full rounded-sm border border-carbon-200 px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  required
                />
              </label>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting || !orderRef.trim() || !email.trim()}
                className="flex w-full items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                {submitting ? 'Looking up…' : 'Check status'}
              </Button>
            </form>
          </Card>

          {result && !result.success && (
            <Card padding="lg" className="mb-6 border-warning-border bg-warning-light">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <Text weight="medium" className="text-warning-text">
                    {result.error ?? "We couldn't find an order matching those details."}
                  </Text>
                  <Text variant="caption" className="mt-1 text-warning-text">
                    Double-check the reference (it starts with <strong className="font-mono">LM-</strong>) and the email
                    you used at checkout. Still stuck?{' '}
                    <Link to="/contact" className="font-medium underline">
                      Contact us
                    </Link>{' '}
                    and we'll dig it up.
                  </Text>
                </div>
              </div>
            </Card>
          )}

          {result?.success && result.order && (
            <ResultCard order={result.order} />
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link to="/library" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                Continue shopping
              </Button>
            </Link>
            <a
              href="mailto:info@lamininpeplab.com.au"
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-carbon-200 px-4 py-2 text-sm font-medium text-carbon-900 hover:bg-carbon-50 sm:w-auto"
            >
              <Mail className="h-4 w-4" />
              Email support
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}

function ResultCard({ order }: { order: NonNullable<OrderStatusLookupResult['order']> }) {
  const display = statusDisplay(order.paymentStatus);
  const tone = TONE_CLASSES[display.tone];
  const Icon = display.icon;
  const placedAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
  const deadline =
    display.status === 'awaiting_payment'
      ? formatPaymentDeadlineLocal(order.createdAt)
      : null;
  const moneyFmt = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: order.currency || 'AUD',
  });

  return (
    <Card padding="lg" className={`mb-6 border-2 ${tone.card}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <Text variant="caption" muted className={`mb-1 uppercase tracking-wide ${tone.text}`}>
            Status
          </Text>
          <Heading level={4} className={`mb-2 ${tone.text}`}>
            {display.label}
          </Heading>
          <Text variant="body" className={`leading-relaxed ${tone.text}`}>
            {display.description}
          </Text>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-carbon-900/10 pt-4 sm:grid-cols-3">
        <div>
          <Text variant="caption" muted className="uppercase tracking-wide">Order ref</Text>
          <Text variant="small" weight="medium" className="font-mono">{order.orderReference}</Text>
        </div>
        <div>
          <Text variant="caption" muted className="uppercase tracking-wide">Total</Text>
          <Text variant="small" weight="medium">{moneyFmt.format(order.totalAmount)}</Text>
        </div>
        <div>
          <Text variant="caption" muted className="uppercase tracking-wide">Placed</Text>
          <Text variant="small">{placedAt}</Text>
        </div>
      </div>

      {deadline && (
        <div className="mt-4 rounded-sm border border-carbon-900/10 bg-white p-4">
          <div className="mb-1 flex items-center gap-2 text-carbon-900">
            <Clock className="h-4 w-4 text-accent" />
            <Text variant="small" weight="medium">
              Please complete payment within {PAYMENT_DEADLINE_HOURS} hours of order placement
            </Text>
          </div>
          <Text variant="caption" muted>
            Due by <strong className="text-carbon-900">{deadline}</strong>. Need more time?{' '}
            <a href="mailto:info@lamininpeplab.com.au" className="underline">
              Email us
            </a>{' '}
            and we'll hold your order.
          </Text>
        </div>
      )}
    </Card>
  );
}
