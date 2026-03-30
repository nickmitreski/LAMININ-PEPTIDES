import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartItem as CartItemType, cartLineKey } from '../../types/cart';
import { Text, Label } from '../ui/Typography';
import { getProductSlug } from '../../data/productContent';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (lineKey: string, quantity: number) => void;
  onRemove: (lineKey: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const productSlug = getProductSlug(item.peptideId);
  const lineKey = cartLineKey(item);

  return (
    <div className="flex gap-4 py-4 border-b border-carbon-900/10 last:border-0">
      <Link
        to={`/products/${productSlug}`}
        className="flex-shrink-0 w-20 h-20 bg-neutral-50 rounded-md overflow-hidden hover:opacity-75 transition-opacity"
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-contain p-2"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Link to={`/products/${productSlug}`} className="hover:underline">
            <Label className="text-carbon-900 block">
              {item.name}
            </Label>
          </Link>
          <button
            type="button"
            onClick={() => onRemove(lineKey)}
            className="flex-shrink-0 p-1 text-neutral-500 hover:text-carbon-900 transition-colors"
            aria-label="Remove item"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <Text variant="caption" muted className="mb-3">
          Purity: {item.purity}
        </Text>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateQuantity(lineKey, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center border border-carbon-900/20 rounded-sm hover:bg-grey disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <span className="text-sm font-medium">−</span>
            </button>

            <Text variant="small" weight="medium" className="min-w-[2ch] text-center">
              {item.quantity}
            </Text>

            <button
              type="button"
              onClick={() => onUpdateQuantity(lineKey, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center border border-carbon-900/20 rounded-sm hover:bg-grey transition-colors"
              aria-label="Increase quantity"
            >
              <span className="text-sm font-medium">+</span>
            </button>
          </div>

          <Text variant="small" weight="medium" className="text-carbon-900">
            ${(item.price * item.quantity).toFixed(2)}
          </Text>
        </div>
      </div>
    </div>
  );
}
