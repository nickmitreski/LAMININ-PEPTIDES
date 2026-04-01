import { Lock, Loader2, AlertCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { Text } from '../ui/Typography';

export type CheckoutPaymentPhase = 'idle' | 'redirecting' | 'error';

interface PaymentFormProps {
  phase: CheckoutPaymentPhase;
  errorMessage?: string | null;
  onRetry?: () => void;
  submitLabel?: string;
  /** Partner card checkout disabled — order request only; team follows up via contact details. */
  softLaunch?: boolean;
}

/**
 * Secure redirect checkout UI (no card collection). Submit is triggered by the parent form.
 */
export default function PaymentForm({
  phase,
  errorMessage,
  onRetry,
  submitLabel,
  softLaunch = false,
}: PaymentFormProps) {
  const redirecting = phase === 'redirecting';
  const errored = phase === 'error';
  const defaultSubmit = softLaunch ? 'Submit order request' : 'Proceed to secure payment';
  const resolvedSubmit = submitLabel ?? defaultSubmit;

  return (
    <div className="space-y-4">
      <div
        className={`flex items-start gap-3 rounded-sm border p-4 sm:p-5 ${
          softLaunch
            ? 'border-amber-200/80 bg-amber-50/90'
            : 'border-accent/30 bg-accent/10'
        }`}
      >
        {softLaunch ? (
          <Clock
            className="mt-0.5 h-6 w-6 shrink-0 text-amber-800 sm:h-5 sm:w-5"
            aria-hidden
          />
        ) : (
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-accent-dark sm:h-5 sm:w-5" aria-hidden />
        )}
        <div className="min-w-0">
          <Text
            variant="small"
            weight="medium"
            className={`mb-1.5 text-base sm:text-sm ${softLaunch ? 'text-amber-950' : 'text-carbon-900'}`}
          >
            {softLaunch ? 'Payment opening soon' : 'Secure payment (redirect)'}
          </Text>
          <Text
            variant="caption"
            muted={!softLaunch}
            className={`text-sm leading-relaxed sm:text-xs ${softLaunch ? 'text-amber-950/90' : ''}`}
          >
            {softLaunch ? (
              <>
                Online card payment is not live yet — usually only a few days away while we restock
                and finish the secure checkout link. Submit your details below and we will contact
                you at the email and phone you provided as soon as you can pay and we ship.
              </>
            ) : (
              <>
                You will be redirected to our partner store to complete payment. Your order
                reference is saved so you can track status after checkout.
              </>
            )}
          </Text>
        </div>
      </div>

      {redirecting && (
        <div
          className="flex items-center gap-3 rounded-sm border border-carbon-900/15 bg-white p-4 sm:p-5"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-accent-dark" />
          <Text variant="small" weight="medium" className="text-base text-carbon-900 sm:text-sm">
            {softLaunch ? 'Saving your order…' : 'Redirecting to secure payment…'}
          </Text>
        </div>
      )}

      {errored && errorMessage && (
        <div
          className="flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 p-4"
          role="alert"
          aria-live="assertive"
        >
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
        className="min-h-12 w-full touch-manipulation sm:min-h-0"
      >
        {redirecting ? (
          <>
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            {softLaunch ? 'Saving…' : 'Redirecting…'}
          </>
        ) : softLaunch ? (
          <>
            <Clock className="mr-2 inline-block h-4 w-4" aria-hidden />
            {resolvedSubmit}
          </>
        ) : (
          <>
            <Lock className="mr-2 inline-block h-4 w-4" aria-hidden />
            {resolvedSubmit}
          </>
        )}
      </Button>

      <Text variant="caption" muted className="block px-0.5 text-center text-xs leading-relaxed">
        {softLaunch
          ? 'No payment is taken on this site yet. We will only use your details to complete your order when checkout is ready.'
          : 'No card details are collected on this site. Payment is completed on the secure partner checkout.'}
      </Text>
    </div>
  );
}
