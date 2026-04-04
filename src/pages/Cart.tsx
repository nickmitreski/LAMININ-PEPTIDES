import { Link } from 'react-router-dom';
import ShippingPolicyHint from '../components/cart/ShippingPolicyHint';
import { ShoppingBag } from 'lucide-react';
import Section from '../components/layout/Section';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Heading, Text } from '../components/ui/Typography';
import { useCart } from '../context/CartContext';
import { cartLineKey } from '../types/cart';

export default function Cart() {
  const { state, updateQuantity, removeItem, clearCart } = useCart();

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen">
        <Section background="white" spacing="xl">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="w-20 h-20 text-neutral-300 mx-auto mb-6" strokeWidth={1.5} />
            <Heading level={3} className="mb-3">
              Your cart is empty
            </Heading>
            <Text variant="small" muted className="mb-8">
              Browse our library of research-grade peptides to get started.
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

  return (
    <div className="min-h-screen bg-platinum">
      <Section background="white" spacing="lg">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Heading level={3}>Shopping Cart</Heading>
            <button
              type="button"
              onClick={clearCart}
              className="text-sm text-neutral-600 hover:text-carbon-900 underline transition-colors"
            >
              Clear cart
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card padding="lg">
                <div className="divide-y divide-carbon-900/10">
                  {state.items.map((item) => (
                    <CartItem
                      key={cartLineKey(item)}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-carbon-900/10">
                  <Link to="/library">
                    <Button variant="outline" size="md">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-24">
                <Heading level={5} className="mb-6">
                  Order Summary
                </Heading>

                <CartSummary subtotal={state.total} className="mb-6" />

                <div className="space-y-3">
                  <Link to="/checkout" className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <ShippingPolicyHint />
                </div>

                <div className="mt-6 pt-6 border-t border-carbon-900/10">
                  <Text variant="caption" muted className="leading-relaxed">
                    All products are intended for laboratory research use only.
                    Not for human consumption.
                  </Text>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
