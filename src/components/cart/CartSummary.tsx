import { Text } from '../ui/Typography';
import { formatPrice } from '../../lib/formatCurrency';

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  discountCode?: string;
  onRemoveDiscount?: () => void;
  className?: string;
}

export default function CartSummary({
  subtotal,
  shipping = 0,
  tax = 0,
  discount = 0,
  discountCode,
  onRemoveDiscount,
  className = ''
}: CartSummaryProps) {
  const total = subtotal + shipping + tax - discount;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <Text variant="small" muted>Subtotal</Text>
        <Text variant="small" weight="medium">{formatPrice(subtotal)}</Text>
      </div>

      {discount > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Text variant="small" className="text-green-700">
              Discount{discountCode ? ` (${discountCode})` : ''}
            </Text>
            {onRemoveDiscount && (
              <button
                type="button"
                onClick={onRemoveDiscount}
                className="text-xs text-red-500 underline underline-offset-2 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <Text variant="small" weight="medium" className="text-green-700">
            &minus;{formatPrice(discount)}
          </Text>
        </div>
      )}

      {shipping > 0 && (
        <div className="flex justify-between items-center">
          <Text variant="small" muted>Shipping</Text>
          <Text variant="small" weight="medium">{formatPrice(shipping)}</Text>
        </div>
      )}

      {tax > 0 && (
        <div className="flex justify-between items-center">
          <Text variant="small" muted>Tax (GST)</Text>
          <Text variant="small" weight="medium">{formatPrice(tax)}</Text>
        </div>
      )}

      <div className="border-t border-carbon-900/10 pt-3">
        <div className="flex justify-between items-center">
          <Text variant="body" weight="semibold" className="text-carbon-900">
            Total
          </Text>
          <Text variant="body" weight="semibold" className="text-carbon-900">
            {formatPrice(total)} AUD
          </Text>
        </div>
      </div>
    </div>
  );
}
