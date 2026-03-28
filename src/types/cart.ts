export interface CartItem {
  peptideId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  purity: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (peptideId: string) => void;
  updateQuantity: (peptideId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (peptideId: string) => boolean;
  getItemQuantity: (peptideId: string) => number;
}
