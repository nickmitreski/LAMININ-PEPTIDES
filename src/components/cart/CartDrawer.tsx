import { useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, updateQuantity, removeItem } = useCart();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] animate-fadeIn bg-carbon-900/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col bg-white shadow-xl animate-slideInRight pt-safe px-safe"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-carbon-900/10 p-4 sm:p-6">
          <Heading level={4} className="min-w-0 truncate text-base sm:text-inherit">
            Shopping Cart
          </Heading>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-grey hover:text-carbon-900 touch-manipulation"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        {state.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-4 text-center sm:p-6">
            <ShoppingBag className="w-16 h-16 text-neutral-300 mb-4" strokeWidth={1.5} />
            <Heading level={5} className="mb-2">
              Your cart is empty
            </Heading>
            <Text variant="small" muted className="mb-6">
              Browse our library to add research-grade peptides.
            </Text>
            <Link to="/library" onClick={onClose}>
              <Button variant="primary" size="md">
                Browse Library
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6">
              <div className="py-3 sm:py-4">
                {state.items.map((item) => (
                  <CartItem
                    key={item.peptideId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-4 border-t border-carbon-900/10 p-4 pb-safe sm:p-6">
              <CartSummary subtotal={state.total} />

              <div className="space-y-2">
                <Link to="/checkout" onClick={onClose} className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link to="/cart" onClick={onClose} className="block">
                  <Button variant="outline" size="md" className="w-full">
                    View Full Cart
                  </Button>
                </Link>
              </div>

              <Text variant="caption" muted className="text-center block">
                Shipping & taxes calculated at checkout
              </Text>
            </div>
          </>
        )}
      </div>
    </>
  );
}
