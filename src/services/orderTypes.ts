export type OrderStatus =
  | 'pending'
  | 'viewed_instructions'
  | 'payment_received'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderReferenceRow {
  id: string;
  peptide_order_id: string;
  status: OrderStatus;
  customer_email: string | null;
  customer_name: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_postcode: string | null;
  customer_country: string | null;
  total_price: number | null;
  peptide_items: unknown;
  protein_items: unknown;
  discount_code: string | null;
  discount_amount: number | null;
  notes: string | null;
  payment_status: string;
  payment_viewed_at: string | null;
  payment_completed_at: string | null;
  cart_items: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
  subtotal: number | null;
  shipping: number | null;
  tax: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface PaymentTrackingDbRow {
  id: string;
  order_reference: string;
  payment_status: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: Record<string, string> | null;
  total_amount: number;
  cart_items: unknown;
  discount_code: string | null;
  discount_amount: number | null;
  admin_notes: string | null;
  payment_viewed_at: string | null;
  payment_completed_at: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecentEmailFailure {
  id: string;
  order_reference: string | null;
  recipient_email: string | null;
  email_type: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface OrderStatusHistoryRow {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  actor: string | null;
  note: string | null;
  created_at: string;
}

export interface PaymentEventRow {
  id: string;
  payment_attempt_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface OrderCounts {
  total: number;
  pending: number;
  viewed_instructions: number;
  payment_received: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface PaymentTrackingRow {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: Record<string, string> | null;
  cart_items: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_viewed_at: string | null;
  payment_completed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}
