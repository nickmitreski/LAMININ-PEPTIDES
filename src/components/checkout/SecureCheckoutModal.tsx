import { useEffect, useRef } from 'react';
import { Shield, Loader2, Mail, Smartphone } from 'lucide-react';
import Button from '../ui/Button';
import {
  CHECKOUT_BRAND_NAME,
  CHECKOUT_DELIVERY_BRAND,
  CHECKOUT_PARTNER_LABEL,
} from '../../constants/checkoutCopy';

export type SecureCheckoutModalPhase = 'encrypting' | 'sent' | 'error';

interface SecureCheckoutModalProps {
  open: boolean;
  phase: SecureCheckoutModalPhase;
  /** LAMIN order id (internal field `peptide_order_id`); shown on confirmation / message flows, not during encrypting. */
  orderReference?: string | null;
  /** e.g. "US$12.34" — shown with reference when link was sent by message. */
  grandTotalLabel?: string | null;
  /** e.g. "your email", "your mobile number", or both */
  destinationsDescription: string;
  /** SMS/email not sent (e.g. Resend/Twilio not enabled yet); softer copy. */
  codeDeliveryPending?: boolean;
  /** Edge has ENABLE_CODE_DELIVERY=true; when pending, show “check logs” not “set secret”. */
  deliveryEnabledAtEdge?: boolean;
  /** Customer should open the pay link from email/SMS (includes code + reference). */
  linkDeliveredInMessages?: boolean;
  /** Pay UI opens on partner site via API; this page does not navigate to payment. */
  partnerOpensPaymentUi?: boolean;
  /**
   * Demo-only: OTP returned by Edge when `RETURN_CHECKOUT_OTP_IN_RESPONSE=true`. Never enable in production.
   */
  demoOtp?: string | null;
  errorMessage?: string | null;
  onContinue: () => void;
  onDismissError: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
}

/**
 * Full-screen overlay: encryption-style loader, then confirmation (no OTP shown in-browser).
 */
export default function SecureCheckoutModal({
  open,
  phase,
  destinationsDescription,
  orderReference = null,
  grandTotalLabel = null,
  codeDeliveryPending = false,
  deliveryEnabledAtEdge = false,
  linkDeliveredInMessages = false,
  partnerOpensPaymentUi = false,
  demoOtp = null,
  errorMessage,
  onContinue,
  onDismissError,
  continueDisabled = false,
  continueLabel = 'Continue to secure payment',
}: SecureCheckoutModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => panelRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, phase]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-carbon-900/60 px-4 pb-safe pt-4 sm:items-center sm:px-6 sm:pb-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && phase === 'error') onDismissError();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="secure-checkout-title"
        aria-describedby="secure-checkout-desc"
        tabIndex={-1}
        className="max-h-[min(90vh,32rem)] w-full max-w-md overflow-y-auto rounded-sm border border-carbon-900/15 bg-white p-6 shadow-xl outline-none sm:p-8"
      >
        {phase === 'encrypting' ? (
          <div className="flex flex-col items-center gap-6 py-4 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-2 border-carbon-900/10 motion-safe:animate-[spin_2.8s_linear_infinite]"
                aria-hidden
              />
              <div
                className="absolute inset-1 rounded-full border-2 border-transparent border-t-accent-dark border-r-accent-dark/40 motion-safe:animate-[spin_1.4s_linear_infinite]"
                style={{ animationDirection: 'reverse' }}
                aria-hidden
              />
              <Shield
                className="relative z-10 h-11 w-11 text-accent-dark motion-safe:animate-pulse motion-reduce:animate-none"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <div>
              <h2
                id="secure-checkout-title"
                className="text-lg font-semibold tracking-tight text-carbon-900 sm:text-base"
              >
                Encrypting
              </h2>
              <p id="secure-checkout-desc" className="sr-only">
                Preparing your secure checkout session. Please wait.
              </p>
            </div>
            <div
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-carbon-900/10 bg-platinum/80 px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-5 w-5 shrink-0 animate-spin text-accent-dark motion-reduce:animate-none motion-reduce:opacity-70"
                aria-hidden
              />
              <span className="text-sm font-medium text-carbon-900 sm:text-xs">Encrypting…</span>
            </div>
          </div>
        ) : null}

        {phase === 'sent' ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2
                id="secure-checkout-title"
                className="text-lg font-semibold text-carbon-900 sm:text-base"
              >
                {codeDeliveryPending
                  ? 'Secure session ready'
                  : linkDeliveredInMessages
                    ? 'Check your messages'
                    : partnerOpensPaymentUi
                      ? `Payment started with ${CHECKOUT_PARTNER_LABEL}`
                      : 'CODE SENT'}
              </h2>
              <p
                id="secure-checkout-desc"
                className="mt-3 text-base leading-relaxed text-neutral-700 sm:text-sm"
              >
                {codeDeliveryPending ? (
                  deliveryEnabledAtEdge ? (
                    <>
                      Your verification session is saved, but we could not confirm delivery on every
                      channel (for example SMS or email). Check your phone for a text, and Supabase Edge
                      function logs if not. You can still continue when you are ready.
                    </>
                  ) : (
                    <>
                      Your verification session is saved securely. Codes are not sent yet because code
                      delivery is off on the server. Set Edge secret{' '}
                      <span className="font-mono">ENABLE_CODE_DELIVERY</span> to{' '}
                      <span className="font-mono">true</span> and configure Twilio for SMS. You can still
                      continue; we would use {destinationsDescription} for codes when delivery is on.
                    </>
                  )
                ) : linkDeliveredInMessages ? (
                  <>
                    We sent a <strong className="font-semibold">secure payment link</strong>, your{' '}
                    <strong className="font-semibold">order reference</strong>, and{' '}
                    <strong className="font-semibold">verification code</strong> to{' '}
                    {destinationsDescription} from {CHECKOUT_DELIVERY_BRAND}. Open the link in your
                    message — it shows your reference and amount; enter the code when asked to complete
                    encrypted card payment.
                  </>
                ) : partnerOpensPaymentUi ? (
                  <>
                    Payment details were sent to {CHECKOUT_PARTNER_LABEL} over a secure API (server
                    to server). They can open the checkout window or popup on{' '}
                    <strong className="font-semibold">their</strong> site—this tab will not redirect
                    to the card page. If you use email/SMS codes, they apply on that flow. You can
                    continue here to finish your order reference on this site.
                  </>
                ) : (
                  <>
                    A one-time verification code has been sent to {destinationsDescription}. Use it on
                    the {CHECKOUT_BRAND_NAME} page when prompted.
                  </>
                )}
              </p>
            </div>
            {demoOtp ? (
              <div
                className="rounded-sm border-2 border-amber-400/90 bg-amber-50 px-4 py-3 text-center sm:text-left"
                role="status"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                  Demo only — remove before production
                </p>
                <p className="mt-2 text-sm leading-relaxed text-amber-950 sm:text-xs">
                  Your one-time code (same as SMS when enabled): enter it on the CoreForge payment
                  screen. Turn off Edge secret{' '}
                  <span className="font-mono">RETURN_CHECKOUT_OTP_IN_RESPONSE</span> when using Twilio.
                </p>
                <p
                  className="mt-3 font-mono text-2xl font-bold tracking-widest text-carbon-900 sm:text-xl"
                  aria-label="Demo verification code"
                >
                  {demoOtp}
                </p>
              </div>
            ) : null}
            {orderReference ? (
              <div className="rounded-sm border border-carbon-900/10 bg-platinum/50 px-4 py-3 text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Your order reference
                </p>
                <p className="mt-1 break-all font-mono text-base font-semibold text-carbon-900 sm:text-sm">
                  {orderReference}
                </p>
                {grandTotalLabel ? (
                  <p className="mt-2 text-sm text-neutral-700 sm:text-xs">
                    Amount on the payment page:{' '}
                    <span className="font-semibold">{grandTotalLabel}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
            {partnerOpensPaymentUi && !codeDeliveryPending ? (
              <div className="rounded-sm border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-relaxed text-carbon-900 sm:text-xs">
                This page only creates the session and calls the payment API from the server. Pop-ups or
                new windows for payment come from {CHECKOUT_PARTNER_LABEL}, not from this tab.
              </div>
            ) : null}
            {!codeDeliveryPending && !partnerOpensPaymentUi && !linkDeliveredInMessages ? (
              <div className="flex flex-wrap items-center justify-center gap-4 rounded-sm border border-carbon-900/10 bg-platinum/50 px-4 py-3 text-sm text-neutral-600 sm:text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  Email
                </span>
                <span className="text-carbon-900/20" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  SMS
                </span>
              </div>
            ) : !partnerOpensPaymentUi && !linkDeliveredInMessages ? (
              <div className="rounded-sm border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950 sm:text-xs">
                {deliveryEnabledAtEdge ? (
                  <>
                    Delivery incomplete: check Edge logs for <span className="font-mono">secure-checkout-init</span>{' '}
                    (Twilio errors, rate limits, or invalid number). Email is optional here; codes go by SMS
                    when Twilio succeeds.
                  </>
                ) : (
                  <>
                    Delivery off: set Edge secret <span className="font-mono">ENABLE_CODE_DELIVERY</span> to{' '}
                    <span className="font-mono">true</span> and configure Twilio for SMS. Add{' '}
                    <span className="font-mono">RESEND_API_KEY</span> only when you want real email sends.
                  </>
                )}
              </div>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="min-h-12 w-full touch-manipulation"
              disabled={continueDisabled}
              onClick={onContinue}
            >
              {continueLabel}
            </Button>
          </div>
        ) : null}

        {phase === 'error' ? (
          <div className="space-y-4 text-center">
            <h2
              id="secure-checkout-title"
              className="text-lg font-semibold text-carbon-900 sm:text-base"
            >
              Could not send code
            </h2>
            <p id="secure-checkout-desc" className="text-base text-red-900/90 sm:text-sm">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-12 w-full touch-manipulation"
              onClick={onDismissError}
            >
              Back to checkout
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
