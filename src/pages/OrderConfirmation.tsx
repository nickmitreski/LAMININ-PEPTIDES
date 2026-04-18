import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';

const BANK_BSB = '013402';
const BANK_ACCOUNT = '807892935';
const BANK_NAME = 'MJCA Group';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('ref') || '';
  const paymentStatus = searchParams.get('status') || 'pending_payment';

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
              Invalid Order Reference
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
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" strokeWidth={2} />
            </div>
            <Heading level={3} className="mb-3 text-2xl sm:text-3xl">
              Order Received!
            </Heading>
            <Text
              variant="body"
              muted
              className="mx-auto max-w-md text-base leading-relaxed sm:text-sm"
            >
              Thank you for your order. Please complete payment using the bank transfer details below.
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
            <div className="rounded-sm bg-amber-50 border border-amber-200 p-4">
              <Text variant="small" weight="medium" className="mb-2 text-amber-900">
                Payment Required
              </Text>
              <Text variant="caption" className="text-amber-800">
                Your order is reserved pending payment. Please complete the bank transfer using the details below.
              </Text>
            </div>
          </Card>

          {/* Bank Transfer Details */}
          <Card padding="lg" className="mb-6 border-2 border-carbon-900">
            <Heading level={5} className="mb-4 text-carbon-900">
              Bank Transfer Details
            </Heading>

            <div className="space-y-4">
              {/* BSB */}
              <div>
                <Text variant="small" muted className="mb-2">
                  BSB
                </Text>
                <div className="flex items-center justify-between gap-4 rounded-sm border border-carbon-900/20 bg-neutral-50 px-4 py-3">
                  <Text variant="body" weight="medium" className="font-mono text-carbon-900">
                    {BANK_BSB}
                  </Text>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(BANK_BSB, 'bsb')}
                    className="flex items-center gap-2 rounded-sm bg-white px-3 py-1.5 text-sm font-medium text-carbon-900 transition-colors hover:bg-neutral-100 touch-manipulation border border-carbon-900/20"
                    aria-label="Copy BSB"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedField === 'bsb' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div>
                <Text variant="small" muted className="mb-2">
                  Account Number
                </Text>
                <div className="flex items-center justify-between gap-4 rounded-sm border border-carbon-900/20 bg-neutral-50 px-4 py-3">
                  <Text variant="body" weight="medium" className="font-mono text-carbon-900">
                    {BANK_ACCOUNT}
                  </Text>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(BANK_ACCOUNT, 'account')}
                    className="flex items-center gap-2 rounded-sm bg-white px-3 py-1.5 text-sm font-medium text-carbon-900 transition-colors hover:bg-neutral-100 touch-manipulation border border-carbon-900/20"
                    aria-label="Copy account number"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedField === 'account' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div>
                <Text variant="small" muted className="mb-2">
                  Account Name
                </Text>
                <div className="rounded-sm border border-carbon-900/20 bg-neutral-50 px-4 py-3">
                  <Text variant="body" weight="medium" className="text-carbon-900">
                    {BANK_NAME}
                  </Text>
                </div>
              </div>

              {/* Payment Reference */}
              <div>
                <Text variant="small" muted className="mb-2">
                  Payment Reference (Required)
                </Text>
                <div className="flex items-center justify-between gap-4 rounded-sm border-2 border-red-600 bg-red-50 px-4 py-3">
                  <Text variant="body" weight="medium" className="font-mono text-carbon-900">
                    {orderRef}
                  </Text>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderRef, 'ref2')}
                    className="flex items-center gap-2 rounded-sm bg-white px-3 py-1.5 text-sm font-medium text-carbon-900 transition-colors hover:bg-neutral-100 touch-manipulation border border-carbon-900/20"
                    aria-label="Copy payment reference"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedField === 'ref2' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <Text variant="caption" className="mt-2 block text-red-900">
                  ⚠️ IMPORTANT: You must include your order reference in the payment description so we can match your payment to your order.
                </Text>
              </div>
            </div>
          </Card>

          {/* Important Instructions */}
          <Card padding="lg" className="mb-6 bg-blue-50 border border-blue-200">
            <Heading level={5} className="mb-3 text-carbon-900">
              Important Payment Instructions
            </Heading>
            <ul className="space-y-2 text-sm text-carbon-900">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <Text variant="caption" className="text-carbon-900">
                  Use the exact bank details above to make your transfer
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <Text variant="caption" className="text-carbon-900">
                  Include your order reference <strong className="font-mono">{orderRef}</strong> in the payment description
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <Text variant="caption" className="text-carbon-900">
                  Orders are processed and dispatched the next business day after payment is received
                </Text>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <Text variant="caption" className="text-carbon-900">
                  You will receive a confirmation email once we verify your payment
                </Text>
              </li>
            </ul>
          </Card>

          {/* Contact Support */}
          <Card padding="lg" className="mb-8">
            <Heading level={5} className="mb-4 text-carbon-900">
              Need Help?
            </Heading>
            <Text variant="body" className="mb-4 text-carbon-900">
              For any enquiries about your order or payment, please contact us:
            </Text>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Mail className="h-5 w-5 text-accent-dark" />
                </div>
                <div>
                  <Text variant="small" weight="medium" className="text-carbon-900">
                    Email
                  </Text>
                  <a
                    href="mailto:info@lamininpeptab.com.au"
                    className="text-sm font-medium text-carbon-900 underline underline-offset-2 hover:opacity-80"
                  >
                    info@lamininpeptab.com.au
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Phone className="h-5 w-5 text-accent-dark" />
                </div>
                <div>
                  <Text variant="small" weight="medium" className="text-carbon-900">
                    Phone
                  </Text>
                  <a
                    href="tel:+61412345678"
                    className="text-sm font-medium text-carbon-900 underline underline-offset-2 hover:opacity-80"
                  >
                    +61 4 1234 5678
                  </a>
                </div>
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
