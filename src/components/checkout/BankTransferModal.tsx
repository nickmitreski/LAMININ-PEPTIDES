import { useEffect, useRef } from 'react';
import { Copy, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';

interface BankTransferModalProps {
  open: boolean;
  orderReference: string;
  totalAmount: number;
  currency?: string;
  onClose: () => void;
}

/**
 * Bank Transfer Payment Instructions Modal
 * Shows payment details after customer places order
 */
export default function BankTransferModal({
  open,
  orderReference,
  totalAmount,
  currency = 'AUD',
  onClose,
}: BankTransferModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => modalRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!open) return null;

  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(totalAmount);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-carbon-900/60 px-4 pb-safe pt-4 sm:items-center sm:px-6 sm:pb-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-transfer-title"
        aria-describedby="bank-transfer-desc"
        tabIndex={-1}
        className="max-h-[min(90vh,48rem)] w-full max-w-lg overflow-y-auto rounded-sm border border-carbon-900/15 bg-white p-6 shadow-xl outline-none sm:p-8"
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <Heading level={4} className="mb-2">
              Payment Instructions
            </Heading>
            <Text variant="small" muted>
              Complete your order by transferring to the account below
            </Text>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-carbon-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Reference */}
        <div className="mb-6 rounded-sm border-2 border-accent/30 bg-accent/10 px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-600">
            Your Order Reference
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="break-all font-mono text-base font-semibold text-carbon-900 sm:text-sm">
              {orderReference}
            </p>
            <button
              type="button"
              onClick={() => copyToClipboard(orderReference, 'reference')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-carbon-900 transition-colors hover:bg-white/80"
              aria-label="Copy reference"
            >
              {copiedField === 'reference' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-neutral-700">
            <strong className="font-semibold">Important:</strong> Use this reference when making
            your payment
          </p>
        </div>

        {/* Amount to Pay */}
        <div className="mb-6 rounded-sm border border-carbon-900/10 bg-platinum/50 px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-600">
            Amount to Pay
          </p>
          <p className="text-2xl font-bold text-carbon-900 sm:text-xl">{formattedAmount}</p>
        </div>

        {/* Bank Details */}
        <div className="mb-6 space-y-3">
          <Heading level={5} className="mb-3">
            Bank Account Details
          </Heading>

          {/* BSB */}
          <div className="flex items-center justify-between gap-3 rounded-sm border border-carbon-900/10 bg-white px-4 py-3">
            <div className="flex-1">
              <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-neutral-600">
                BSB
              </p>
              <p className="font-mono text-base font-semibold text-carbon-900 sm:text-sm">
                013402
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('013402', 'bsb')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-carbon-900 transition-colors hover:bg-neutral-50"
              aria-label="Copy BSB"
            >
              {copiedField === 'bsb' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Account Number */}
          <div className="flex items-center justify-between gap-3 rounded-sm border border-carbon-900/10 bg-white px-4 py-3">
            <div className="flex-1">
              <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-neutral-600">
                Account Number
              </p>
              <p className="font-mono text-base font-semibold text-carbon-900 sm:text-sm">
                807892935
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('807892935', 'account')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-carbon-900 transition-colors hover:bg-neutral-50"
              aria-label="Copy account number"
            >
              {copiedField === 'account' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Business Name */}
          <div className="flex items-center justify-between gap-3 rounded-sm border border-carbon-900/10 bg-white px-4 py-3">
            <div className="flex-1">
              <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-neutral-600">
                Account Name
              </p>
              <p className="text-base font-semibold text-carbon-900 sm:text-sm">MJCA Group</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('MJCA Group', 'name')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-carbon-900 transition-colors hover:bg-neutral-50"
              aria-label="Copy account name"
            >
              {copiedField === 'name' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Reference Requirement Notice */}
        <div className="mb-6 rounded-sm border-2 border-red-200 bg-red-50 px-4 py-3">
          <p className="mb-2 text-sm font-semibold text-red-900">Reference Requirement</p>
          <p className="text-sm leading-relaxed text-red-950">
            When completing payment, include your{' '}
            <strong className="font-semibold">invoice reference number only</strong> as the payment
            reference.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-red-900">
            No additional information is to be included. Payments submitted without the correct
            reference may result in delays.
          </p>
        </div>

        {/* Processing Info */}
        <div className="mb-6 rounded-sm border border-carbon-900/10 bg-platinum/50 px-4 py-3">
          <p className="mb-2 text-sm font-semibold text-carbon-900">Processing</p>
          <p className="text-sm leading-relaxed text-neutral-700">
            Orders are processed once payment has been received and confirmed. We will notify you
            when your order is being prepared for shipment.
          </p>
        </div>

        {/* Close Button */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="min-h-12 w-full touch-manipulation"
          onClick={onClose}
        >
          I understand
        </Button>

        {/* Footer Note */}
        <p className="mt-4 text-center text-xs text-neutral-500">
          Questions? Contact us at{' '}
          <a
            href="mailto:support@lamininpeptides.com"
            className="font-medium text-carbon-900 underline underline-offset-2 hover:opacity-90"
          >
            support@lamininpeptides.com
          </a>
        </p>
      </div>
    </div>
  );
}
