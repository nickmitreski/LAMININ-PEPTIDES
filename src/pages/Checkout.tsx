import { useState, FormEvent } from 'react';
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
import { redirectToProteinStore, checkoutLog } from '../services/proteinCheckout';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentPhase('redirecting');

    const shipping = 15.0;
    const tax = state.total * 0.1;
    const grand_total = state.total + shipping + tax;

    try {
      const { redirectUrl, peptide_order_id } = await redirectToProteinStore(
        state.items,
        {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: formData.country,
        },
        {
          subtotal: state.total,
          shipping,
          tax,
          grand_total,
        }
      );

      checkoutLog('redirect', { redirectUrl, peptide_order_id });
      clearCart();

      const target = new URL(redirectUrl, window.location.href);
      const isSameOrigin = target.origin === window.location.origin;
      const isOrderConfirm =
        target.pathname.includes('order-confirmation');

      if (isSameOrigin && isOrderConfirm) {
        navigate(`${target.pathname}${target.search}${target.hash}`);
      } else {
        window.location.assign(redirectUrl);
      }
    } catch (err) {
      checkoutLog('checkout failed', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not start secure checkout. Please try again.';
      setPaymentError(msg);
      setPaymentPhase('error');
      showToast(msg, 'error', 6000);
    }
  };

  const handleRetry = () => {
    setPaymentPhase('idle');
    setPaymentError(null);
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

  return (
    <div className="min-h-screen bg-platinum">
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

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card padding="lg">
                  <Heading level={5} className="mb-6">
                    Contact Information
                  </Heading>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        disabled={paymentPhase === 'redirecting'}
                      />
                      <Input
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        disabled={paymentPhase === 'redirecting'}
                      />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={paymentPhase === 'redirecting'}
                    />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      label="Phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={paymentPhase === 'redirecting'}
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
                      disabled={paymentPhase === 'redirecting'}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="city"
                        name="city"
                        label="City"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        disabled={paymentPhase === 'redirecting'}
                      />
                      <Input
                        id="state"
                        name="state"
                        label="State"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        disabled={paymentPhase === 'redirecting'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="postcode"
                        name="postcode"
                        label="Postcode"
                        value={formData.postcode}
                        onChange={handleChange}
                        required
                        disabled={paymentPhase === 'redirecting'}
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
                          disabled={paymentPhase === 'redirecting'}
                          className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
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
                    <Text variant="caption" muted className="mb-4 block leading-relaxed">
                      Complete your purchase from the order summary — you will be
                      redirected to our secure partner checkout.
                    </Text>
                  </Card>
                </CheckoutPaymentErrorBoundary>
              </div>

              <div className="lg:col-span-1">
                <Card padding="lg" className="sticky top-24">
                  <Heading level={5} className="mb-6">
                    Order Summary
                  </Heading>

                  <div className="mb-6 space-y-4">
                    {state.items.map((item) => (
                      <div key={cartLineKey(item)} className="flex gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm bg-neutral-50">
                          <img
                            src={item.image}
                            alt={item.name}
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

                  <PaymentForm
                    phase={paymentPhase}
                    errorMessage={paymentError}
                    onRetry={handleRetry}
                    submitLabel="Proceed to secure payment"
                  />

                  <div className="mt-6 border-t border-carbon-900/10 pt-6">
                    <Text variant="caption" muted className="leading-relaxed">
                      All products are intended for laboratory research use only.
                    </Text>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </Section>
    </div>
  );
}
