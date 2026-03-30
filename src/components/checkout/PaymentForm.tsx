import { Lock, Loader2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Text } from '../ui/Typography';

export type CheckoutPaymentPhase = 'idle' | 'redirecting' | 'error';

interface PaymentFormProps {
  phase: CheckoutPaymentPhase;
  errorMessage?: string | null;
  onRetry?: () => void;
  submitLabel?: string;
}

/**
 * Secure redirect checkout UI (no card collection). Submit is triggered by the parent form.
 */
export default function PaymentForm({
  phase,
  errorMessage,
  onRetry,
  submitLabel = 'Proceed to secure payment',
}: PaymentFormProps) {
  const redirecting = phase === 'redirecting';
  const errored = phase === 'error';

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent-dark" />
        <div>
          <Text variant="small" weight="medium" className="mb-1 text-carbon-900">
            Secure payment (redirect)
          </Text>
          <Text variant="caption" muted className="leading-relaxed">
            You will be redirected to our partner store to complete payment. Your
            order reference is saved so you can track status after checkout.
          </Text>
        </div>
      </div>

      {redirecting && (
        <div
          className="flex items-center gap-3 rounded-sm border border-carbon-900/15 bg-white p-4"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-accent-dark" />
          <Text variant="small" weight="medium" className="text-carbon-900">
            Redirecting to secure payment…
          </Text>
        </div>
      )}

      {errored && errorMessage && (
        <div className="flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1 space-y-2">
            <Text variant="small" className="text-red-900">
              {errorMessage}
            </Text>
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={redirecting}
        className="w-full"
      >
        {redirecting ? (
          <>
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            <Lock className="mr-2 inline-block h-4 w-4" />
            {submitLabel}
          </>
        )}
      </Button>

      <Text variant="caption" muted className="block text-center">
        No card details are collected on this site. Payment is completed on the
        secure partner checkout.
      </Text>
    </div>
  );
}
