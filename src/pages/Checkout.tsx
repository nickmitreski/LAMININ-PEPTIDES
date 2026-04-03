import { useState, useRef, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import CartSummary from '../components/cart/CartSummary';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { cartLineKey } from '../types/cart';
import PaymentForm, {
  type CheckoutPaymentPhase,
} from '../components/checkout/PaymentForm';
import CheckoutPaymentErrorBoundary from '../components/checkout/CheckoutPaymentErrorBoundary';
import {
  buildCheckoutPayload,
  createOrderReferenceRecord,
  completeProteinCheckoutRedirect,
  checkoutLog,
  type CheckoutPayload,
} from '../services/proteinCheckout';
import {
  initiateSecureCheckoutSession,
  describeCodeDestinations,
} from '../services/secureCheckoutSession';
import SecureCheckoutModal, {
  type SecureCheckoutModalPhase,
} from '../components/checkout/SecureCheckoutModal';
import { validateCheckoutContact } from '../lib/checkoutContactValidation';
import { CHECKOUT_BRAND_NAME } from '../constants/checkoutCopy';

const partnerCheckoutConfigured = Boolean(
  (import.meta.env.VITE_PROTEIN_STORE_URL as string | undefined)?.trim()
);
const checkoutSoftLaunch =
  import.meta.env.VITE_CHECKOUT_SOFT_LAUNCH === 'true' || !partnerCheckoutConfigured;

/** Minimum time the “Securing your session” modal stays open (ms); then auto-open payment URL if returned. */
const CHECKOUT_ENCRYPT_MIN_MS = Math.max(
  0,
  Number(import.meta.env.VITE_CHECKOUT_ENCRYPT_MIN_MS ?? 5000)
);

/** If true, this storefront may redirect to payment_portal_url. Default false: partner opens pay UI via API. */
const OPEN_PAYMENT_URL_ON_THIS_SITE =
  import.meta.env.VITE_OPEN_PAYMENT_URL_ON_THIS_SITE === 'true';

/** Match Edge `PAYMENT_LINK_CURRENCY` / Square so the modal shows the same amount label as the pay page. */
const CHECKOUT_DISPLAY_CURRENCY =
  (import.meta.env.VITE_CHECKOUT_DISPLAY_CURRENCY as string | undefined)?.trim() || 'USD';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export default function Checkout() {
  const { state, clearCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [paymentPhase, setPaymentPhase] = useState<CheckoutPaymentPhase>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const checkoutStatusRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
  });
  const [securityAcknowledged, setSecurityAcknowledged] = useState(false);
  const [secureModalOpen, setSecureModalOpen] = useState(false);
  const [secureModalPhase, setSecureModalPhase] =
    useState<SecureCheckoutModalPhase>('encrypting');
  const [secureModalError, setSecureModalError] = useState<string | null>(null);
  const [codeDestinationsText, setCodeDestinationsText] = useState('');
  const [pendingCheckoutPayload, setPendingCheckoutPayload] =
    useState<CheckoutPayload | null>(null);
  const [paymentPortalUrl, setPaymentPortalUrl] = useState<string | null>(null);
  const [secureCodeDeliveryPending, setSecureCodeDeliveryPending] = useState(false);
  const [partnerOpensPaymentUi, setPartnerOpensPaymentUi] = useState(false);
  const [linkDeliveredInMessages, setLinkDeliveredInMessages] = useState(false);
  const [secureOrderReference, setSecureOrderReference] = useState<string | null>(null);
  const [secureGrandTotalLabel, setSecureGrandTotalLabel] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (secureModalOpen) return;
    if (!securityAcknowledged) {
      showToast(
        `Please confirm you understand ${CHECKOUT_BRAND_NAME} and the payment code process.`,
        'error',
        5000
      );
      return;
    }

    const contact = validateCheckoutContact(formData.email, formData.phone);
    if (!contact.ok) {
      showToast(contact.message ?? 'Check your contact details.', 'error', 6000);
      return;
    }

    setPaymentError(null);

    const shipping = 15.0;
    const tax = state.total * 0.1;
    const grand_total = state.total + shipping + tax;

    const customer = {
      email: formData.email.trim(),
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      postcode: formData.postcode,
      country: formData.country,
    };

    const totals = {
      subtotal: state.total,
      shipping,
      tax,
      grand_total,
    };

    setSecureModalOpen(true);
    setSecureModalPhase('encrypting');
    setSecureModalError(null);
    setPendingCheckoutPayload(null);
    setPaymentPortalUrl(null);
    setSecureCodeDeliveryPending(false);
    setPartnerOpensPaymentUi(false);
    setLinkDeliveredInMessages(false);
    setSecureOrderReference(null);
    setSecureGrandTotalLabel(null);

    const encryptStartedAt = Date.now();

    try {
      const payload = await buildCheckoutPayload(state.items, customer, totals);
      await createOrderReferenceRecord(payload);
      setSecureOrderReference(payload.peptide_order_id);
      setSecureGrandTotalLabel(
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: CHECKOUT_DISPLAY_CURRENCY,
        }).format(payload.totals.grand_total)
      );

      const secure = await initiateSecureCheckoutSession(payload, state.items, {
        sendEmail: contact.emailValid,
        sendSms: contact.phoneValid,
      });

      if (!secure.ok) {
        setSecureModalPhase('error');
        setSecureModalError(secure.error ?? 'Secure checkout failed.');
        return;
      }

      const portalRaw =
        typeof secure.payment_portal_url === 'string' &&
        secure.payment_portal_url.startsWith('http')
          ? secure.payment_portal_url
          : null;

      const deliveryPending = Boolean(secure.code_delivery_pending);
      const paymentLinkCreated = Boolean(secure.payment_link_created);
      const partnerNotifyOk = Boolean(secure.partner_payment_ui_notify_ok);
      const linkInMessages = Boolean(secure.payment_link_in_delivery);
      const handoffToPartner =
        !OPEN_PAYMENT_URL_ON_THIS_SITE &&
        !linkInMessages &&
        (paymentLinkCreated || partnerNotifyOk || Boolean(portalRaw));

      const elapsed = Date.now() - encryptStartedAt;
      const waitMs = Math.max(0, CHECKOUT_ENCRYPT_MIN_MS - elapsed);
      if (waitMs > 0) {
        await sleep(waitMs);
      }

      if (portalRaw && OPEN_PAYMENT_URL_ON_THIS_SITE) {
        const u = new URL(portalRaw);
        if (deliveryPending) {
          u.searchParams.set('secure_session', '1');
        } else {
          u.searchParams.set('secure_code_sent', '1');
        }
        checkoutLog('auto-redirect payment portal', u.toString());
        clearCart();
        setSecureModalOpen(false);
        setPendingCheckoutPayload(null);
        setPaymentPortalUrl(null);
        window.location.assign(u.toString());
        return;
      }

      setPendingCheckoutPayload(payload);
      setPaymentPortalUrl(
        OPEN_PAYMENT_URL_ON_THIS_SITE && portalRaw ? portalRaw : null
      );
      setPartnerOpensPaymentUi(handoffToPartner);
      setLinkDeliveredInMessages(linkInMessages);
      setSecureCodeDeliveryPending(deliveryPending);
      setCodeDestinationsText(
        deliveryPending
          ? describeCodeDestinations(contact.emailValid, contact.phoneValid)
          : describeCodeDestinations(!!secure.sent_email, !!secure.sent_sms)
      );
      setSecureModalPhase('sent');
    } catch (err) {
      checkoutLog('secure checkout init failed', err);
      setSecureModalPhase('error');
      setSecureModalError(
        err instanceof Error
          ? err.message
          : 'Could not prepare secure checkout. Please try again.'
      );
    }
  };

  const finishRedirectAfterCode = async () => {
    const payload = pendingCheckoutPayload;
    if (!payload) return;

    setPaymentPhase('redirecting');
    setSecureModalOpen(false);

    try {
      if (paymentPortalUrl) {
        const u = new URL(paymentPortalUrl);
        if (secureCodeDeliveryPending) {
          u.searchParams.set('secure_session', '1');
        } else {
          u.searchParams.set('secure_code_sent', '1');
        }
        checkoutLog('redirect payment portal', u.toString());
        clearCart();
        setPendingCheckoutPayload(null);
        setPaymentPortalUrl(null);
        window.location.assign(u.toString());
        return;
      }

      const { redirectUrl, peptide_order_id } =
        await completeProteinCheckoutRedirect(payload);

      checkoutLog('redirect', { redirectUrl, peptide_order_id });
      clearCart();
      setPendingCheckoutPayload(null);

      const target = new URL(redirectUrl, window.location.href);
      const isSameOrigin = target.origin === window.location.origin;
      const isOrderConfirm = target.pathname.includes('order-confirmation');

      if (secureCodeDeliveryPending) {
        target.searchParams.set('secure_session', '1');
      } else {
        target.searchParams.set('secure_code_sent', '1');
      }

      if (isSameOrigin && isOrderConfirm) {
        navigate(`${target.pathname}${target.search}${target.hash}`);
      } else {
        const u = new URL(redirectUrl);
        if (secureCodeDeliveryPending) {
          u.searchParams.set('secure_session', '1');
        } else {
          u.searchParams.set('secure_code_sent', '1');
        }
        window.location.assign(u.toString());
      }
    } catch (err) {
      checkoutLog('checkout redirect failed', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not continue to payment. Please try again.';
      setPaymentError(msg);
      setPaymentPhase('error');
      showToast(msg, 'error', 6000);
    }
  };

  const closeSecureModalAfterError = () => {
    setSecureModalOpen(false);
    setSecureModalError(null);
    setPendingCheckoutPayload(null);
    setPaymentPortalUrl(null);
    setSecureCodeDeliveryPending(false);
    setPartnerOpensPaymentUi(false);
    setLinkDeliveredInMessages(false);
    setSecureOrderReference(null);
    setSecureGrandTotalLabel(null);
  };

  const handleRetry = () => {
    setPaymentPhase('idle');
    setPaymentError(null);
  };

  useEffect(() => {
    if (paymentPhase === 'error') {
      checkoutStatusRef.current?.focus();
    }
  }, [paymentPhase]);

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen">
        <Section background="white" spacing="xl">
          <div className="max-w-2xl mx-auto text-center">
            <Heading level={3} className="mb-3">
              Your cart is empty
            </Heading>
            <Text variant="small" muted className="mb-8">
              Add items to your cart before checking out.
            </Text>
            <Link to="/library">
              <Button variant="primary" size="lg">
                Browse Library
              </Button>
            </Link>
          </div>
        </Section>
      </div>
    );
  }

  const shipping = 15.0;
  const tax = state.total * 0.1;
  const checkoutBusy =
    paymentPhase === 'redirecting' ||
    (secureModalOpen && secureModalPhase === 'encrypting');

  return (
    <div className="min-h-screen bg-platinum overscroll-contain">
      <Section background="white" spacing="lg">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-carbon-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to cart
            </Link>
            <Heading level={3}>Checkout</Heading>
          </div>

          <form
            onSubmit={handleSubmit}
            aria-busy={
              paymentPhase === 'redirecting' ||
              (secureModalOpen && secureModalPhase === 'encrypting')
            }
          >
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
              <div className="space-y-6 lg:col-span-2">
                <Card padding="lg">
                  <Heading level={5} className="mb-6">
                    Contact Information
                  </Heading>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        disabled={checkoutBusy}
                      />
                      <Input
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        disabled={checkoutBusy}
                      />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      disabled={checkoutBusy}
                      helperText="Required unless you provide a mobile number below — we send your payment code here."
                    />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      label="Mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      disabled={checkoutBusy}
                      helperText="Required unless you provide email above — SMS with your payment code."
                    />
                  </div>
                </Card>

                <Card padding="lg">
                  <Heading level={5} className="mb-6">
                    Shipping Address
                  </Heading>
                  <div className="space-y-4">
                    <Input
                      id="address"
                      name="address"
                      label="Street Address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      disabled={checkoutBusy}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        id="city"
                        name="city"
                        label="City"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        disabled={checkoutBusy}
                      />
                      <Input
                        id="state"
                        name="state"
                        label="State"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        disabled={checkoutBusy}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        id="postcode"
                        name="postcode"
                        label="Postcode"
                        value={formData.postcode}
                        onChange={handleChange}
                        required
                        disabled={checkoutBusy}
                      />
                      <div>
                        <label
                          htmlFor="country"
                          className="mb-2 block text-xs font-medium uppercase tracking-wide text-carbon-900"
                        >
                          Country
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          disabled={checkoutBusy}
                          className="min-h-11 w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-base transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900 md:min-h-0 md:text-sm"
                        >
                          <option value="Australia">Australia</option>
                          <option value="New Zealand">New Zealand</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>

                <CheckoutPaymentErrorBoundary>
                  <Card padding="lg">
                    <Heading level={5} className="mb-4">
                      Payment
                    </Heading>
                    <Text
                      variant="caption"
                      muted
                      className="mb-4 block text-sm leading-relaxed sm:text-xs"
                    >
                      {checkoutSoftLaunch
                        ? 'Use the order summary on the right (below on mobile) to submit your order request. No card is charged until we enable payment and confirm with you.'
                        : 'Complete your purchase from the order summary — you will be redirected to our secure partner checkout.'}
                    </Text>
                  </Card>
                </CheckoutPaymentErrorBoundary>
              </div>

              <div className="lg:col-span-1">
                <Card padding="lg" className="lg:sticky lg:top-24">
                  <Heading level={5} className="mb-6">
                    Order Summary
                  </Heading>

                  <div className="mb-6 space-y-4">
                    {state.items.map((item) => (
                      <div key={cartLineKey(item)} className="flex gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm bg-neutral-50">
                          <img
                            src={item.image}
                            alt=""
                            decoding="async"
                            loading="lazy"
                            fetchPriority="low"
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Text variant="caption" weight="medium" className="text-carbon-900">
                            {item.name}
                          </Text>
                          <Text variant="caption" muted>
                            Qty: {item.quantity}
                          </Text>
                        </div>
                        <Text variant="caption" weight="medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </div>
                    ))}
                  </div>

                  <CartSummary
                    subtotal={state.total}
                    shipping={shipping}
                    tax={tax}
                    className="mb-6"
                  />

                  <div
                    ref={checkoutStatusRef}
                    tabIndex={-1}
                    className="outline-none focus-visible:ring-2 focus-visible:ring-carbon-900/25 focus-visible:ring-offset-2 rounded-sm"
                  >
                    <PaymentForm
                      phase={paymentPhase}
                      errorMessage={paymentError}
                      onRetry={handleRetry}
                      softLaunch={checkoutSoftLaunch}
                      securityAcknowledged={securityAcknowledged}
                      onSecurityAcknowledgedChange={setSecurityAcknowledged}
                      interactionsLocked={
                        secureModalOpen && secureModalPhase === 'encrypting'
                      }
                    />
                  </div>

                  <div className="mt-6 border-t border-carbon-900/10 pt-6">
                    <Text variant="caption" muted className="leading-relaxed">
                      All products are intended for laboratory research use only.
                    </Text>
                  </div>
                </Card>
              </div>
            </div>
          </form>

          <SecureCheckoutModal
            open={secureModalOpen}
            phase={secureModalPhase}
            orderReference={
              secureModalPhase === 'encrypting' || secureModalPhase === 'sent'
                ? secureOrderReference
                : null
            }
            grandTotalLabel={
              secureModalPhase === 'sent' && linkDeliveredInMessages
                ? secureGrandTotalLabel
                : null
            }
            destinationsDescription={codeDestinationsText}
            codeDeliveryPending={
              secureModalPhase === 'sent' && secureCodeDeliveryPending
            }
            linkDeliveredInMessages={
              secureModalPhase === 'sent' && linkDeliveredInMessages
            }
            partnerOpensPaymentUi={
              secureModalPhase === 'sent' && partnerOpensPaymentUi
            }
            errorMessage={secureModalError}
            onContinue={finishRedirectAfterCode}
            onDismissError={closeSecureModalAfterError}
            continueDisabled={paymentPhase === 'redirecting' || !pendingCheckoutPayload}
            continueLabel={
              paymentPortalUrl
                ? 'Continue to pay'
                : partnerOpensPaymentUi
                  ? checkoutSoftLaunch
                    ? 'Continue to order confirmation'
                    : 'Continue on this site'
                  : checkoutSoftLaunch
                    ? 'Continue to order confirmation'
                    : 'Continue to secure payment'
            }
          />
        </div>
      </Section>
    </div>
  );
}
