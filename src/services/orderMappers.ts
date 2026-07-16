import type { OrderReferenceRow, OrderStatus, PaymentTrackingDbRow } from './orderTypes';

type CartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

function normalizeCartItems(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? '');
    const name = String(o.name ?? '');
    const price = Number(o.price);
    const quantity = Number(o.quantity);
    if (!id || !name || !Number.isFinite(price) || !Number.isFinite(quantity)) continue;
    const image = typeof o.image === 'string' ? o.image : undefined;
    out.push({ id, name, price, quantity, image });
  }
  return out;
}

export function paymentRowToOrder(row: PaymentTrackingDbRow): OrderReferenceRow {
  const addr = row.customer_address as Record<string, string> | null;
  const cartItems = normalizeCartItems(row.cart_items);
  return {
    id: row.id,
    peptide_order_id: row.order_reference,
    status: row.payment_status as OrderStatus,
    customer_email: row.customer_email,
    customer_name: row.customer_name,
    customer_first_name: null,
    customer_last_name: null,
    customer_phone: row.customer_phone,
    customer_address: addr?.address ?? null,
    customer_city: addr?.city ?? null,
    customer_state: addr?.state ?? null,
    customer_postcode: addr?.postcode ?? null,
    customer_country: addr?.country ?? null,
    total_price: row.total_amount,
    peptide_items: Array.isArray(row.cart_items)
      ? (row.cart_items as Array<Record<string, unknown>>).map((o) => {
          const quantity = Number(o.quantity) || 0;
          const unit_price = Number(o.price) || 0;
          return {
            cfg_code: String(o.id ?? ''),
            peptide_display_name: String(o.name ?? ''),
            quantity,
            unit_price,
            line_total: unit_price * quantity,
            image: typeof o.image === 'string' ? o.image : undefined,
            id: o.id,
            name: o.name,
            price: o.price,
          };
        })
      : row.cart_items,
    protein_items: null,
    discount_code: row.discount_code ?? null,
    discount_amount: row.discount_amount ?? null,
    notes: row.admin_notes,
    payment_status: row.payment_status,
    payment_viewed_at: row.payment_viewed_at,
    payment_completed_at: row.payment_completed_at,
    cart_items: cartItems,
    subtotal: row.subtotal,
    shipping: row.shipping,
    tax: row.tax,
    currency: row.currency ?? 'AUD',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
