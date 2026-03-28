import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import CartSummary from '../components/cart/CartSummary';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useCart } from '../context/CartContext';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);

    try {
      // TODO: Implement actual payment processing with Stripe
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('Order submitted:', {
        shipping: formData,
        items: state.items,
        total: state.total,
      });

      // Clear cart and navigate to success page
      clearCart();
      // TODO: Navigate to order confirmation page with order ID
      alert('Order placed successfully! (This is a demo - no actual payment processed)');
      navigate('/');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if cart is empty
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

  const shipping = 15.0; // Flat rate shipping
  const tax = state.total * 0.1; // 10% GST

  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="lg">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
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
              {/* Shipping Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
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
                      />
                      <Input
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
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
                    />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      label="Phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
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
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="city"
                        name="city"
                        label="City"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        id="state"
                        name="state"
                        label="State"
                        value={formData.state}
                        onChange={handleChange}
                        required
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
                      />
                      <div>
                        <label htmlFor="country" className="block text-xs font-medium uppercase tracking-wide text-carbon-900 mb-2">
                          Country
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2.5 text-sm border border-carbon-900/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-carbon-900 focus:border-transparent transition-colors"
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

                {/* Payment Method (Placeholder) */}
                <Card padding="lg">
                  <Heading level={5} className="mb-4">
                    Payment Method
                  </Heading>
                  <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-sm">
                    <Lock className="w-5 h-5 text-accent-dark flex-shrink-0 mt-0.5" />
                    <div>
                      <Text variant="small" weight="medium" className="text-carbon-900 mb-1">
                        Secure Payment Processing
                      </Text>
                      <Text variant="caption" muted>
                        Payment integration with Stripe is coming soon. For now, this is a demo
                        checkout flow.
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card padding="lg" className="sticky top-24">
                  <Heading level={5} className="mb-6">
                    Order Summary
                  </Heading>

                  {/* Order Items */}
                  <div className="mb-6 space-y-4">
                    {state.items.map((item) => (
                      <div key={item.peptideId} className="flex gap-3">
                        <div className="w-12 h-12 bg-neutral-50 rounded-sm flex-shrink-0 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
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

                  <CartSummary subtotal={state.total} shipping={shipping} tax={tax} className="mb-6" />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      'Processing...'
                    ) : (
                      <>
                        <Lock className="w-4 h-4 inline-block mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>

                  <Text variant="caption" muted className="text-center block mt-4">
                    Your payment information is secure and encrypted
                  </Text>

                  <div className="mt-6 pt-6 border-t border-carbon-900/10">
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
