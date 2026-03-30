import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  CartItem,
  CartState,
  CartContextType,
  cartLineKey,
  matchesCartLine,
} from '../types/cart';

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('laminin-cart', []);

  // Calculate totals
  const state = useMemo<CartState>(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      total,
      itemCount,
    };
  }, [items]);

  // Add item to cart
  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
      setItems((currentItems) => {
        const key = cartLineKey(item);
        const existingItem = currentItems.find((i) => cartLineKey(i) === key);

        if (existingItem) {
          return currentItems.map((i) =>
            cartLineKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i
          );
        }

        return [...currentItems, { ...item, quantity }];
      });
    },
    [setItems]
  );

  const removeItem = useCallback(
    (lineKey: string) => {
      setItems((currentItems) =>
        currentItems.filter((item) => cartLineKey(item) !== lineKey)
      );
    },
    [setItems]
  );

  const updateQuantity = useCallback(
    (lineKey: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(lineKey);
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          cartLineKey(item) === lineKey ? { ...item, quantity } : item
        )
      );
    },
    [setItems, removeItem]
  );

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  // Check if item is in cart
  const isInCart = useCallback(
    (peptideId: string, variantId?: string) => {
      return items.some((item) => matchesCartLine(item, peptideId, variantId));
    },
    [items]
  );

  const getItemQuantity = useCallback(
    (peptideId: string, variantId?: string) => {
      const item = items.find((i) => matchesCartLine(i, peptideId, variantId));
      return item ? item.quantity : 0;
    },
    [items]
  );

  const value: CartContextType = useMemo(
    () => ({
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getItemQuantity,
    }),
    [state, addItem, removeItem, updateQuantity, clearCart, isInCart, getItemQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
