import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  checkoutGstAmount,
  checkoutGstRate,
  expressShippingAud,
} from '../lib/shippingPolicy';
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
import BankTransferModal from '../components/checkout/BankTransferModal';
import {
  createPaymentTracking,
  markPaymentInstructionsViewed,
} from '../services/bankTransferPayment';
import { sendOrderEmail } from '../services/emailService';

// Generate order reference: LM-[6 alphanumeric chars]
function generateOrderReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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

export default function Checkout() {
  const { state, clearCart } = useCart();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting || bankTransferModalOpen) return;

    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast('Please enter your full name.', 'error', 5000);
      return;
    }

    if (!formData.phone.trim()) {
      showToast('Please enter your phone number.', 'error', 5000);
      return;
    }

    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.postcode.trim()) {
      showToast('Please complete your shipping address.', 'error', 5000);
      return;
    }

    setIsSubmitting(true);

    try {
      const shipping = expressShippingAud(state.total);
      const tax = checkoutGstAmount(state.total, checkoutGstRate());
      const grandTotal = state.total + shipping + tax;
      const orderRef = generateOrderReference();

      // Create payment tracking record
      const result = await createPaymentTracking({
        orderReference: orderRef,
        customerEmail: formData.email.trim() || 'noemail@provided.com',
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
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Mark that customer will view payment instructions
      await markPaymentInstructionsViewed(orderRef);

      // Send payment instruction email (non-blocking — don't fail checkout if email fails)
      if (formData.email.trim()) {
        sendOrderEmail({
          orderReference: orderRef,
          customerEmail: formData.email.trim(),
          customerName: `${formData.firstName} ${formData.lastName}`,
          totalAmount: grandTotal,
          currency: 'AUD',
        }).catch((err) => console.error('Email send failed:', err));
      }

      // Show bank transfer modal
      setCurrentOrderReference(orderRef);
      setCurrentTotalAmount(grandTotal);
      setBankTransferModalOpen(true);

      showToast('Order created! Check your email for payment instructions.', 'success', 6000);
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
                Browse Library
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
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-carbon-900 mb-4 transition-colors"
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
                        disabled={isSubmitting}
                      />
                      <Input
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
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
                      helperText="Required for delivery updates."
                    />
                  </div>
                </Card>

                {/* Shipping Address */}
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
                      disabled={isSubmitting}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        id="city"
                        name="city"
                        label="City"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      />
                      <Input
                        id="state"
                        name="state"
                        label="State"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                    Payment Method
                  </Heading>
                  <Text
                    variant="caption"
                    muted
                    className="mb-4 block text-sm leading-relaxed sm:text-xs"
                  >
                    Payment is made via bank transfer. After placing your order, you will receive detailed payment instructions including our bank account details and your unique order reference number.
                  </Text>
                  <div className="rounded-sm border border-carbon-900/10 bg-neutral-50 px-4 py-3">
                    <p className="text-sm font-medium text-carbon-900">Bank Transfer / PayID</p>
                    <p className="mt-1 text-xs text-neutral-600">
                      Complete payment using your banking app
                    </p>
                  </div>
                </Card>
              </div>

              {/* Order Summary */}
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
                    {isSubmitting ? 'Processing...' : 'Place Order'}
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
