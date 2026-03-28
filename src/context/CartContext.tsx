import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CartItem, CartState, CartContextType } from '../types/cart';

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
        const existingItem = currentItems.find((i) => i.peptideId === item.peptideId);

        if (existingItem) {
          // Update quantity if item exists
          return currentItems.map((i) =>
            i.peptideId === item.peptideId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }

        // Add new item
        return [...currentItems, { ...item, quantity }];
      });
    },
    [setItems]
  );

  // Remove item from cart
  const removeItem = useCallback(
    (peptideId: string) => {
      setItems((currentItems) => currentItems.filter((item) => item.peptideId !== peptideId));
    },
    [setItems]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    (peptideId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(peptideId);
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.peptideId === peptideId ? { ...item, quantity } : item
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
    (peptideId: string) => {
      return items.some((item) => item.peptideId === peptideId);
    },
    [items]
  );

  // Get item quantity
  const getItemQuantity = useCallback(
    (peptideId: string) => {
      const item = items.find((i) => i.peptideId === peptideId);
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
