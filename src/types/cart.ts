export interface CartItem {
  peptideId: string;
  /** When set, line is unique per peptide + variant (e.g. Retatrutide 20 mg). */
  variantId?: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  purity: string;
}

export function cartLineKey(item: Pick<CartItem, 'peptideId' | 'variantId'>): string {
  return item.variantId ? `${item.peptideId}::${item.variantId}` : item.peptideId;
}

export function matchesCartLine(
  item: Pick<CartItem, 'peptideId' | 'variantId'>,
  peptideId: string,
  variantId?: string
): boolean {
  if (item.peptideId !== peptideId) return false;
  if (variantId !== undefined) return item.variantId === variantId;
  return item.variantId === undefined;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (peptideId: string, variantId?: string) => boolean;
  getItemQuantity: (peptideId: string, variantId?: string) => number;
}
