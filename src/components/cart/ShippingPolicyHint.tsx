import { Link } from 'react-router-dom';
import { Text } from '../ui/Typography';
import { FLAT_EXPRESS_SHIPPING_AUD, FREE_SHIPPING_THRESHOLD_AUD } from '../../lib/shippingPolicy';

/** Short copy aligned with `/shipping`; use on cart / drawer (checkout shows line items). */
export default function ShippingPolicyHint({
  className = '',
  centered = true,
}: {
  className?: string;
  centered?: boolean;
}) {
  return (
    <Text
      variant="caption"
      muted
      className={`block leading-relaxed ${centered ? 'text-center' : 'text-left'} ${className}`}
    >
      Express shipping Australia-wide: complimentary over ${FREE_SHIPPING_THRESHOLD_AUD}, otherwise $
      {FLAT_EXPRESS_SHIPPING_AUD.toFixed(2)} flat. GST shown at checkout.{' '}
      <Link
        to="/shipping"
        className="font-medium text-carbon-900 underline underline-offset-2 transition-opacity hover:opacity-90 touch-manipulation"
      >
        Shipping terms
      </Link>
      .
    </Text>
  );
}
