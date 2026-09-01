import { PEPTIDE_ID_TO_CFG } from '../../data/productMappings';
import type { CartItem } from '../../types/cart';
import type { BankTransferPaymentData } from '../../services/bankTransferPayment';

/**
 * Convert storefront cart lines into the checkout contract.
 *
 * `variant_id` is deliberately sent alongside the shared CFG code so the
 * database can resolve the exact server-owned price for multi-strength SKUs.
 */
export function toCheckoutCartItems(
  items: CartItem[]
): BankTransferPaymentData['cartItems'] {
  return items.map((item) => ({
    id: PEPTIDE_ID_TO_CFG[item.peptideId] ?? item.peptideId,
    variant_id: item.variantId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }));
}
