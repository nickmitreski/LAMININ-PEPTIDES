import { Lock, Loader2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Text } from '../ui/Typography';
import { CHECKOUT_BRAND_NAME } from '../../constants/checkoutCopy';

export type CheckoutPaymentPhase = 'idle' | 'redirecting' | 'error';

interface PaymentFormProps {
  phase: CheckoutPaymentPhase;
  errorMessage?: string | null;
  onRetry?: () => void;
  submitLabel?: string;
  /** Partner card checkout disabled — order request only; team follows up via contact details. */
  softLaunch?: boolean;
  /** User must acknowledge CoreForge / encryption copy before submit. */
  securityAcknowledged: boolean;
  onSecurityAcknowledgedChange: (value: boolean) => void;
  /** When true, checkbox and submit are locked (e.g. while secure modal is preparing). */
  interactionsLocked?: boolean;
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
  securityAcknowledged,
  onSecurityAcknowledgedChange,
  interactionsLocked = false,
}: PaymentFormProps) {
  const redirecting = phase === 'redirecting';
  const errored = phase === 'error';
  const defaultSubmit = softLaunch ? 'Submit order request' : 'Proceed to secure payment';
  const resolvedSubmit = submitLabel ?? defaultSubmit;
  const submitBlocked = redirecting || interactionsLocked || !securityAcknowledged;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-sm border border-accent/30 bg-accent/10 p-4 sm:p-5">
        <Lock className="mt-0.5 h-6 w-6 shrink-0 text-accent-dark sm:h-5 sm:w-5" aria-hidden />
        <div className="min-w-0">
          <Text
            variant="small"
            weight="medium"
            className="mb-1.5 text-base text-carbon-900 sm:text-sm"
          >
            {softLaunch ? 'Secure checkout' : 'Secure payment (redirect)'}
          </Text>
          <Text variant="caption" muted className="text-sm leading-relaxed sm:text-xs">
            You will receive a one-time code by SMS and/or email, then continue to {CHECKOUT_BRAND_NAME}.
            Your order reference links this store and the partner catalogue items.
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

      <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-carbon-900/15 bg-white p-4 touch-manipulation">
        <input
          type="checkbox"
          checked={securityAcknowledged}
          onChange={(e) => onSecurityAcknowledgedChange(e.target.checked)}
          disabled={redirecting || interactionsLocked}
          className="mt-1 h-[1.125rem] w-[1.125rem] shrink-0 rounded border-carbon-900/30 text-carbon-900 focus:ring-2 focus:ring-carbon-900/25"
        />
        <span className="min-w-0 text-sm leading-relaxed text-carbon-900 sm:text-xs">
          I understand that this secure checkout payment is using the{' '}
          <strong className="font-semibold">COREFORGE</strong> payment for their strong 256 bit
          encryption. I will receive a one-time code by SMS and/or Email before completing payment.
        </span>
      </label>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={submitBlocked}
        className="min-h-12 w-full touch-manipulation disabled:pointer-events-none disabled:opacity-40 sm:min-h-0"
      >
        {redirecting ? (
          <>
            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            {softLaunch ? 'Saving…' : 'Redirecting…'}
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
          ? `No payment is taken on this site until you complete secure checkout. Codes are sent by SMS and/or email for ${CHECKOUT_BRAND_NAME}.`
          : `No card details are collected on this site. You verify with a one-time code, then pay via ${CHECKOUT_BRAND_NAME}.`}
      </Text>
    </div>
  );
}
