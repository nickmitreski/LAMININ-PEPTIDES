import { Text } from '../ui/Typography';
import { formatPrice } from '../../lib/formatCurrency';

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  className?: string;
}

export default function CartSummary({
  subtotal,
  shipping = 0,
  tax = 0,
  className = ''
}: CartSummaryProps) {
  const total = subtotal + shipping + tax;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <Text variant="small" muted>Subtotal</Text>
        <Text variant="small" weight="medium">{formatPrice(subtotal)}</Text>
      </div>

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
