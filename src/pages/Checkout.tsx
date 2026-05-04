import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  checkoutGstAmount,
  checkoutGstRate,
  expressShippingAud,
} from '../lib/shippingPolicy';
import { ArrowLeft, Tag, X, Loader2, Droplets, Plus } from 'lucide-react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import CartSummary from '../components/cart/CartSummary';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { cartLineKey } from '../types/cart';
import BankTransferModal from '../components/checkout/BankTransferModal';
import { supabase } from '../lib/supabase';
import {
  createPaymentTracking,
  markPaymentInstructionsViewed,
} from '../services/bankTransferPayment';
import { sendOrderEmail } from '../services/emailService';
import { formatPrice } from '../lib/formatCurrency';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  validateDiscountCode,
  redeemDiscountCode,
  type DiscountValidation,
} from '../services/discountService';

// Generate order reference: LM-[6 alphanumeric chars] using crypto RNG
function generateOrderReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomBytes[i] % chars.length);
  }
  return `LM-${code}`;
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

type FieldErrors = Partial<Record<keyof ShippingFormData, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AU_POSTCODE_RE = /^\d{4}$/;
const NZ_POSTCODE_RE = /^\d{4}$/;
const PHONE_RE = /^[\d\s+()-]{6,}$/;

function validateForm(data: ShippingFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'Required';
  if (!data.lastName.trim()) errors.lastName = 'Required';
  if (data.email.trim() && !EMAIL_RE.test(data.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.phone.trim()) {
    errors.phone = 'Required';
  } else if (!PHONE_RE.test(data.phone.trim())) {
    errors.phone = 'Enter a valid phone number';
  }
  if (!data.address.trim()) errors.address = 'Required';
  if (!data.city.trim()) errors.city = 'Required';
  if (!data.state.trim()) errors.state = 'Required';
  if (!data.postcode.trim()) {
    errors.postcode = 'Required';
  } else if (data.country === 'Australia' && !AU_POSTCODE_RE.test(data.postcode.trim())) {
    errors.postcode = 'Australian postcodes are 4 digits';
  } else if (data.country === 'New Zealand' && !NZ_POSTCODE_RE.test(data.postcode.trim())) {
    errors.postcode = 'NZ postcodes are 4 digits';
  }
  return errors;
}

export default function Checkout() {
  useDocumentTitle(
    'Checkout',
    'Securely complete your order. Bank transfer instructions are emailed immediately after order confirmation.'
  );
  const { state, clearCart, addItem } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankTransferModalOpen, setBankTransferModalOpen] = useState(false);
  const [currentOrderReference, setCurrentOrderReference] = useState<string>('');
  const [currentTotalAmount, setCurrentTotalAmount] = useState<number>(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Discount code state
  const [discountInput, setDiscountInput] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidation | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear this field's error as the user types
    if (fieldErrors[name as keyof ShippingFormData]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof ShippingFormData];
        return next;
      });
    }
  };

  const handleApplyDiscount = async () => {
    const code = discountInput.trim();
    if (!code) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const result = await validateDiscountCode(code, state.total);
      if (result.valid) {
        setAppliedDiscount(result);
        setDiscountError('');
        showToast(`Discount code "${result.code}" applied!`, 'success');
      } else {
        setDiscountError(result.error || 'Invalid code');
        setAppliedDiscount(null);
      }
    } catch {
      setDiscountError('Could not validate code');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput('');
    setDiscountError('');
  };

  const discountAmount = appliedDiscount?.discount_amount ?? 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting || bankTransferModalOpen) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Please fix the highlighted fields.', 'error', 4000);
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Defer focus so scroll can settle on mobile browsers
        setTimeout(() => el.focus({ preventScroll: true }), 250);
      }
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);

    try {
      const shipping = expressShippingAud(state.total);
      const tax = checkoutGstAmount(state.total, checkoutGstRate());
      const grandTotal = state.total + shipping + tax - discountAmount;
      const orderRef = generateOrderReference();

      // Create payment tracking record (includes discount info)
      const result = await createPaymentTracking({
        orderReference: orderRef,
        customerEmail: formData.email.trim() || '',
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone.trim(),
        customerAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: formData.country,
        },
        cartItems: state.items.map(item => ({
          id: item.peptideId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal: state.total,
        shipping,
        tax,
        totalAmount: grandTotal,
        currency: 'AUD',
        discountCode: appliedDiscount?.valid ? appliedDiscount.code : null,
        discountAmount: discountAmount > 0 ? discountAmount : 0,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Create/update customer record (non-blocking — don't fail checkout).
      // PostgrestBuilder is a PromiseLike (no .catch), so use .then with the result envelope.
      if (supabase && formData.email.trim()) {
        void supabase
          .rpc('upsert_checkout_customer', {
            p_email: formData.email.trim(),
            p_first_name: formData.firstName.trim(),
            p_last_name: formData.lastName.trim(),
            p_phone: formData.phone.trim(),
            p_address: formData.address,
            p_city: formData.city,
            p_state: formData.state,
            p_postcode: formData.postcode,
            p_country: formData.country,
            p_order_total: grandTotal,
          })
          .then(({ error }) => {
            if (error) console.error('Customer upsert failed:', error);
          });
      }

      // Redeem discount code if one was applied (must succeed or we surface it — count stays in sync)
      if (appliedDiscount?.valid && appliedDiscount.discount_code_id) {
        const redeemResult = await redeemDiscountCode({
          discountCodeId: appliedDiscount.discount_code_id,
          orderReference: orderRef,
          customerEmail: formData.email.trim() || undefined,
          discountAmount,
        });
        if (!redeemResult.success) {
          console.error('Discount redemption failed:', redeemResult.error);
          showToast(
            `Order created, but we could not register your discount (${redeemResult.error || 'unknown'}). Note your order reference ${orderRef} — contact us if needed.`,
            'error',
            10000
          );
        }
      }

      // Mark that customer will view payment instructions
      await markPaymentInstructionsViewed(orderRef);

      // Payment instructions email + optional admin WhatsApp (via Edge Function — don't fail checkout)
      sendOrderEmail({
        orderReference: orderRef,
        customerEmail: formData.email.trim() || undefined,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone.trim(),
        totalAmount: grandTotal,
        currency: 'AUD',
      }).catch((err) => console.error('Post-checkout notifications failed:', err));

      // Show bank transfer modal
      setCurrentOrderReference(orderRef);
      setCurrentTotalAmount(grandTotal);
      setBankTransferModalOpen(true);

      showToast(
        formData.email.trim()
          ? 'Order created! Check your email for payment instructions.'
          : 'Order created! Save your order reference and complete payment using the instructions below.',
        'success',
        6000
      );
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to create order. Please try again.',
        'error',
        6000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBankTransferModal = () => {
    setBankTransferModalOpen(false);

    // Clear cart and redirect to a confirmation page
    clearCart();

    // Navigate to order confirmation with order reference
    navigate(`/order-confirmation?ref=${currentOrderReference}&status=pending_payment`);
  };

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
                Browse library
              </Button>
            </Link>
          </div>
        </Section>
      </div>
    );
  }

  const shipping = expressShippingAud(state.total);
  const tax = checkoutGstAmount(state.total, checkoutGstRate());

  return (
    <div className="min-h-screen bg-platinum overscroll-contain">
      <Section background="white" spacing="lg">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-sm text-carbon-900 hover:text-carbon-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to cart
            </Link>
            <Heading level={3}>Checkout</Heading>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
              <div className="space-y-6 lg:col-span-2">
                {/* Contact Information */}
                <Card padding="lg">
                  <Heading level={5} className="mb-6">
                    Contact information
                  </Heading>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        id="firstName"
                        name="firstName"
                        label="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        autoComplete="given-name"
                        disabled={isSubmitting}
                        error={fieldErrors.firstName}
                      />
                      <Input
                        id="lastName"
                        name="lastName"
                        label="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        autoComplete="family-name"
                        disabled={isSubmitting}
                        error={fieldErrors.lastName}
                      />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email (optional)"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      disabled={isSubmitting}
                      error={fieldErrors.email}
                      helperText="For order updates and receipts."
                    />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      label="Mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      required
                      disabled={isSubmitting}
                      error={fieldErrors.phone}
                      helperText="Required for delivery updates."
                    />
                  </div>
                </Card>

                {/* Shipping Address */}
                <Card padding="lg">
                  <Heading level={5} className="mb-6">
                    Shipping address
                  </Heading>
                  <div className="space-y-4">
                    <Input
                      id="address"
                      name="address"
                      label="Street address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      autoComplete="street-address"
                      disabled={isSubmitting}
                      error={fieldErrors.address}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        id="city"
                        name="city"
                        label="City"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        autoComplete="address-level2"
                        disabled={isSubmitting}
                        error={fieldErrors.city}
                      />
                      <Input
                        id="state"
                        name="state"
                        label="State"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        autoComplete="address-level1"
                        disabled={isSubmitting}
                        error={fieldErrors.state}
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
                        autoComplete="postal-code"
                        inputMode="numeric"
                        disabled={isSubmitting}
                        error={fieldErrors.postcode}
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
                          disabled={isSubmitting}
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

                {/* Payment Method */}
                <Card padding="lg">
                  <Heading level={5} className="mb-4">
                    Payment method
                  </Heading>
                  <Text
                    variant="caption"
                    muted
                    className="mb-4 block text-sm leading-relaxed sm:text-xs"
                  >
                    Payment is made via bank transfer. After placing your order, you will receive detailed payment instructions including our bank account details and your unique order reference number.
                  </Text>
                  <div className="rounded-sm border border-carbon-900/10 bg-neutral-50 px-4 py-3">
                    <p className="text-sm font-medium text-carbon-900">Bank transfer / PayID</p>
                    <p className="mt-1 text-xs text-carbon-900">
                      Complete payment using your banking app
                    </p>
                  </div>
                </Card>

                {/* Discount Code */}
                <Card padding="lg">
                  <Heading level={5} className="mb-4">
                    Discount code
                  </Heading>
                  {appliedDiscount?.valid ? (
                    <div className="flex items-center justify-between rounded-sm border border-success-border bg-success-light px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-success-dark" />
                        <span className="text-sm font-medium text-success-text">
                          {appliedDiscount.code}
                        </span>
                        <span className="text-xs text-success">
                          &minus;{formatPrice(discountAmount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="rounded p-1 text-success transition-colors hover:bg-success-muted hover:text-success-text"
                        aria-label="Remove discount code"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={discountInput}
                        onChange={(e) => {
                          setDiscountInput(e.target.value.toUpperCase());
                          if (discountError) setDiscountError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleApplyDiscount();
                          }
                        }}
                        disabled={isSubmitting || discountLoading}
                        className="min-h-11 flex-1 rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm uppercase tracking-wider transition-colors placeholder:normal-case placeholder:tracking-normal focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900 md:min-h-0"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => void handleApplyDiscount()}
                        disabled={!discountInput.trim() || isSubmitting || discountLoading}
                      >
                        {discountLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  )}
                  {discountError && (
                    <p className="mt-2 text-xs text-error">{discountError}</p>
                  )}
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card padding="lg" className="lg:sticky lg:top-24">
                  <Heading level={5} className="mb-6">
                    Order summary
                  </Heading>

                  <div className="mb-6 space-y-4">
                    {state.items.map((item) => (
                      <div key={cartLineKey(item)} className="flex gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm bg-neutral-50">
                          <img
                            src={item.image}
                            alt=""
                            aria-hidden="true"
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
                          {formatPrice(item.price * item.quantity)}
                        </Text>
                      </div>
                    ))}
                  </div>

                  {/* BAC Water Recommendation */}
                  {state.items.length > 0 && !state.items.some(item => item.peptideId === 'bacteriostatic-water') && (
                    <div className="mb-4 rounded-lg border border-accent-200 bg-accent-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-accent-700">
                          <Droplets className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <Text variant="small" weight="medium" className="text-accent-900 mb-1">
                            Reconstitution essential
                          </Text>
                          <Text variant="caption" className="text-accent-700 mb-2">
                            Bacteriostatic water is required to reconstitute peptides before use. We recommend adding it to your order.
                          </Text>
                          <button
                            type="button"
                            onClick={() => {
                              addItem({
                                peptideId: 'bacteriostatic-water',
                                name: 'Bacteriostatic Water 3ml',
                                price: 5,
                                image: '/images/products/CFG-028_5 — Bacteriostatic water 3ml.png',
                                purity: 'N/A',
                              });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-700 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Bacteriostatic Water — $5.00
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <CartSummary
                    subtotal={state.total}
                    shipping={shipping}
                    tax={tax}
                    discount={discountAmount}
                    discountCode={appliedDiscount?.code}
                    onRemoveDiscount={appliedDiscount ? handleRemoveDiscount : undefined}
                    className="mb-6"
                  />

                  <Text variant="caption" muted className="mb-6 leading-relaxed">
                    Orders dispatch the next business day. Express Australia-wide with tracking; authority
                    to leave may apply — see{' '}
                    <Link
                      to="/shipping"
                      className="font-medium text-carbon-900 underline underline-offset-2 hover:opacity-90 touch-manipulation"
                    >
                      shipping terms
                    </Link>
                    .
                  </Text>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="min-h-12 w-full touch-manipulation"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing…' : 'Place order'}
                  </Button>

                  <div className="mt-6 border-t border-carbon-900/10 pt-6">
                    <Text variant="caption" muted className="leading-relaxed">
                      All products are intended for laboratory research use only.
                    </Text>
                  </div>
                </Card>
              </div>
            </div>
          </form>

          {/* Bank Transfer Modal */}
          <BankTransferModal
            open={bankTransferModalOpen}
            orderReference={currentOrderReference}
            totalAmount={currentTotalAmount}
            currency="AUD"
            onClose={handleCloseBankTransferModal}
          />
        </div>
      </Section>
    </div>
  );
}
