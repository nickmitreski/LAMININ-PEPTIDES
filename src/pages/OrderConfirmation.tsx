import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Copy, Mail, Search } from 'lucide-react';
import { useState } from 'react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatPaymentDeadlineLocal,
  PAYMENT_DEADLINE_HOURS,
} from '../lib/shippingPolicy';

export default function OrderConfirmation() {
  useDocumentTitle(
    'Order Confirmation',
    'Your order has been received. Bank transfer payment instructions have been emailed to you.'
  );
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('ref') || '';
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  if (!orderRef) {
    return (
      <div className="min-h-screen bg-platinum">
        <Section background="white" spacing="xl">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-0">
            <Heading level={3} className="mb-4">
              Invalid order reference
            </Heading>
            <Text variant="body" muted className="mb-8 block">
              No order reference was provided. Please check your confirmation email or contact support.
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

  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="xl">
        <div className="mx-auto max-w-2xl px-4 sm:px-0">
          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-success-muted">
              <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={2} />
            </div>
            <Heading level={3} className="mb-3 text-2xl sm:text-3xl">
              Order received
            </Heading>
            <Text
              variant="body"
              muted
              className="mx-auto max-w-md text-base leading-relaxed sm:text-sm"
            >
              Thank you for your order. You will receive an email with payment instructions shortly.
            </Text>
          </div>

          {/* Order Reference Card */}
          <Card padding="lg" className="mb-6">
            <div className="mb-4 border-b border-carbon-900/10 pb-4">
              <Text variant="small" muted className="mb-2">
                Your order reference
              </Text>
              <div className="flex items-center justify-between gap-4">
                <Text
                  variant="body"
                  weight="semibold"
                  className="font-mono text-lg text-carbon-900 sm:text-base"
                >
                  {orderRef}
                </Text>
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderRef, 'ref')}
                  className="flex items-center gap-2 rounded-sm bg-neutral-100 px-3 py-2 text-sm font-medium text-carbon-900 transition-colors hover:bg-neutral-200 touch-manipulation"
                  aria-label="Copy order reference"
                >
                  <Copy className="h-4 w-4" />
                  {copiedField === 'ref' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Payment Status */}
            <div className="rounded-sm bg-warning-light border border-warning-border p-4">
              <Text variant="small" weight="medium" className="mb-2 text-warning-text">
                Payment required
              </Text>
              <Text variant="caption" className="text-warning-text">
                Your order is reserved pending payment. Please check your email for payment instructions.
              </Text>
            </div>

            {/* Deadline */}
            <div className="mt-3 rounded-sm border border-carbon-900/10 bg-white p-4">
              <div className="mb-1 flex items-center gap-2 text-carbon-900">
                <Clock className="h-4 w-4 text-accent" />
                <Text variant="small" weight="medium">
                  Please complete payment within {PAYMENT_DEADLINE_HOURS} hours
                </Text>
              </div>
              <Text variant="caption" muted>
                Due by <strong className="text-carbon-900">{formatPaymentDeadlineLocal()}</strong>.{' '}
                If you need more time, just reply to your confirmation email and we'll hold your order.
              </Text>
            </div>
          </Card>

          {/* Email Notification */}
          <Card padding="lg" className="mb-6 border-2 border-info-border bg-info-light">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-info-muted">
                <Mail className="h-6 w-6 text-info" />
              </div>
              <div>
                <Heading level={5} className="mb-2 text-info-text">
                  Check your email
                </Heading>
                <Text variant="body" className="text-info-text leading-relaxed">
                  We've sent payment instructions to your email address. Please follow the instructions in the email to complete your payment.
                </Text>
                <Text variant="caption" className="mt-2 block text-info-dark">
                  Don't forget to include your order reference <strong className="font-mono">{orderRef}</strong> when making your payment.
                </Text>
              </div>
            </div>
          </Card>

          {/* Important Instructions */}
          <Card padding="lg" className="mb-6">
            <Heading level={5} className="mb-3 text-carbon-900">
              What happens next
            </Heading>
            <ul className="space-y-2 text-sm text-carbon-900">
              <li className="flex items-start gap-2">
                <span className="font-bold text-info">1.</span>
                <Text variant="caption" className="text-carbon-900">
                  Check your email for payment instructions
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-info">2.</span>
                <Text variant="caption" className="text-carbon-900">
                  Complete your payment using your order reference <strong className="font-mono">{orderRef}</strong>
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-info">3.</span>
                <Text variant="caption" className="text-carbon-900">
                  Orders are processed and dispatched the next business day after payment is received
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-info">4.</span>
                <Text variant="caption" className="text-carbon-900">
                  You will receive a confirmation email once we verify your payment
                </Text>
              </li>
            </ul>
          </Card>

          {/* Contact Support */}
          <Card padding="lg" className="mb-8">
            <Heading level={5} className="mb-4 text-carbon-900">
              Need help?
            </Heading>
            <Text variant="body" className="mb-4 text-carbon-900">
              For any enquiries about your order or payment, please email us:
            </Text>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                <Mail className="h-5 w-5 text-accent-dark" />
              </div>
              <div>
                <Text variant="small" weight="medium" className="text-carbon-900">
                  Email
                </Text>
                <a
                  href="mailto:info@lamininpeplab.com.au"
                  className="text-sm font-medium text-carbon-900 underline underline-offset-2 hover:opacity-80"
                >
                  info@lamininpeplab.com.au
                </a>
              </div>
            </div>

            <Text variant="caption" muted className="mt-4 block border-t border-carbon-900/10 pt-4">
              Please have your order reference ready when contacting us.
            </Text>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/library" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="min-h-12 w-full touch-manipulation sm:min-h-0"
              >
                Continue shopping
              </Button>
            </Link>
            <Link
              to={`/order-status?ref=${encodeURIComponent(orderRef)}`}
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                size="md"
                className="min-h-12 w-full touch-manipulation sm:min-h-0"
              >
                <Search className="mr-2 h-4 w-4" />
                Track order
              </Button>
            </Link>
            <Link to="/contact" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="min-h-12 w-full touch-manipulation sm:min-h-0"
              >
                Contact support
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
