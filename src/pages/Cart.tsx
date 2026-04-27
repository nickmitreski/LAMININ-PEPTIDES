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
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Cart() {
  useDocumentTitle(
    'Your Cart',
    'Review the research peptides in your cart before continuing to checkout.'
  );
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleClearCart = () => {
    if (window.confirm('Remove all items from your cart? This cannot be undone.')) {
      clearCart();
    }
  };

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
                Browse library
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
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <Heading level={3}>Shopping cart</Heading>
              <Text variant="caption" muted className="mt-1 block">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </div>
            <button
              type="button"
              onClick={handleClearCart}
              className="rounded-sm text-sm text-neutral-600 underline underline-offset-4 transition-colors hover:text-carbon-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-900 focus-visible:ring-offset-2"
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
                      Continue shopping
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-24">
                <Heading level={5} className="mb-6">
                  Order summary
                </Heading>

                <CartSummary subtotal={state.total} className="mb-6" />

                <div className="space-y-3">
                  <Link to="/checkout" className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      Proceed to checkout
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
