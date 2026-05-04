import { useEffect, useRef, useState } from 'react';
import { Copy, CheckCircle2, X, Mail } from 'lucide-react';
import Modal from '../ui/Modal';
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
 * Order Confirmation Modal
 * Shows order reference and email notification after customer places order
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

  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(totalAmount);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="bank-transfer-title"
      backdropClassName="items-end sm:items-center px-4 pb-safe pt-4 sm:px-6 sm:pb-6 bg-carbon-900/60"
      className="max-h-[min(90vh,48rem)] w-full max-w-lg overflow-y-auto rounded-sm border border-carbon-900/15 bg-white p-6 shadow-xl outline-none sm:p-8"
    >
      <div ref={modalRef} tabIndex={-1}>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex-1">
            <Heading level={4} className="mb-2">
              Order Confirmed
            </Heading>
            <Text variant="small" muted>
              Your order has been received
            </Text>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-carbon-900 transition-colors hover:bg-neutral-100 hover:text-carbon-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Reference */}
        <div className="mb-6 rounded-sm border-2 border-accent/30 bg-accent/10 px-4 py-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-carbon-900">
            Your Order Reference
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="break-all font-mono text-lg font-bold text-carbon-900 sm:text-base">
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
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-carbon-900">
            Amount to Pay
          </p>
          <p className="text-2xl font-bold text-carbon-900 sm:text-xl">{formattedAmount}</p>
        </div>

        {/* Email Notification */}
        <div className="mb-6 rounded-sm border border-blue-200 bg-blue-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Check your email</p>
              <p className="text-sm leading-relaxed text-blue-800">
                You will receive an email with payment instructions shortly. Please follow the instructions in the email to complete your payment.
              </p>
            </div>
          </div>
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
            href="mailto:info@lamininpeplab.com.au"
            className="font-medium text-carbon-900 underline underline-offset-2 hover:opacity-90"
          >
            info@lamininpeplab.com.au
          </a>
        </p>
      </div>
    </Modal>
  );
}
