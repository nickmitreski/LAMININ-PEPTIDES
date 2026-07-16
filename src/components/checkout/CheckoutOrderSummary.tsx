import { Link } from 'react-router-dom';
import { Droplets, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import CartSummary from '../cart/CartSummary';
import { Heading, Text } from '../ui/Typography';
import { cartLineKey, type CartContextType, type CartState } from '../../types/cart';
import { formatPrice } from '../../lib/formatCurrency';
import { imgFetchPriorityProps } from '../../lib/imgFetchPriority';

interface CheckoutOrderSummaryProps {
  state: CartState;
  shipping: number;
  discountAmount: number;
  discountCode?: string;
  isSubmitting: boolean;
  onRemoveDiscount?: () => void;
  addItem: CartContextType['addItem'];
}

export default function CheckoutOrderSummary({
  state,
  shipping,
  discountAmount,
  discountCode,
  isSubmitting,
  onRemoveDiscount,
  addItem,
}: CheckoutOrderSummaryProps) {
  const showBacteriostaticWater =
    state.items.length > 0 &&
    !state.items.some((item) => item.peptideId === 'bacteriostatic-water');

  return (
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
                {...imgFetchPriorityProps('low')}
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

      {showBacteriostaticWater && (
        <div className="mb-4 rounded-lg border border-accent-200 bg-accent-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-accent-700">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <Text variant="small" weight="medium" className="mb-1 text-accent-900">
                Reconstitution essential
              </Text>
              <Text variant="caption" className="mb-2 text-accent-700">
                Bacteriostatic water is required to reconstitute peptides before use. We recommend
                adding it to your order.
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
                className="inline-flex items-center gap-1.5 rounded-sm bg-accent-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-700"
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
        discount={discountAmount}
        discountCode={discountCode}
        onRemoveDiscount={onRemoveDiscount}
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
  );
}
