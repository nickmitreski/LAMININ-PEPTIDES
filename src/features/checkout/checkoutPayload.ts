import { getCheckoutCfgCode } from '../../data/productMappings';
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
    id: getCheckoutCfgCode(item.peptideId, item.variantId) ?? item.peptideId,
    variant_id: item.variantId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }));
}
