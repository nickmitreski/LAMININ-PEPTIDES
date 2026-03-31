import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  PRODUCT_MAPPINGS,
  type ProductMapping,
} from '../data/productMappings';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderReferenceRow {
  id: string;
  peptide_order_id: string;
  protein_store_order_id: string | null;
  status: OrderStatus;
  customer_email: string | null;
  customer_name: string | null;
  total_price: number | null;
  peptide_items: unknown;
  protein_items: unknown;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

function mappingsFromRows(
  rows: {
    cfg_code: string;
    peptide_name: string;
    protein_name: string;
    price: number;
  }[]
): Record<string, ProductMapping> {
  const out: Record<string, ProductMapping> = {};
  for (const r of rows) {
    out[r.cfg_code] = {
      peptideName: r.peptide_name,
      proteinName: r.protein_name,
      price: Number(r.price),
    };
  }
  return out;
}

/** Active mappings from Supabase, or embedded fallbacks if DB empty / offline. */
export async function getProductMappings(): Promise<
  Record<string, ProductMapping>
> {
  if (!supabase) {
    return { ...PRODUCT_MAPPINGS };
  }

  const { data, error } = await supabase
    .from('product_mappings')
    .select('cfg_code, peptide_name, protein_name, price')
    .eq('is_active', true);

  if (error || !data?.length) {
    return { ...PRODUCT_MAPPINGS };
  }

  return mappingsFromRows(data);
}

export async function createOrderReference(orderData: {
  peptide_order_id: string;
  protein_store_order_id?: string | null;
  status?: OrderStatus;
  customer_email: string;
  customer_name: string;
  total_price: number;
  peptide_items: unknown;
  protein_items: unknown;
}): Promise<{ id: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('order_references')
    .insert({
      peptide_order_id: orderData.peptide_order_id,
      protein_store_order_id: orderData.protein_store_order_id ?? null,
      status: orderData.status ?? 'pending',
      customer_email: orderData.customer_email,
      customer_name: orderData.customer_name,
      total_price: orderData.total_price,
      peptide_items: orderData.peptide_items,
      protein_items: orderData.protein_items,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[supabase] createOrderReference', error);
    return null;
  }

  return { id: data.id as string };
}

export async function getOrderStatus(
  peptideOrderId: string
): Promise<OrderReferenceRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('order_references')
    .select('*')
    .eq('peptide_order_id', peptideOrderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OrderReferenceRow;
}

export async function updateOrderStatus(
  peptideOrderId: string,
  status: OrderStatus,
  client: SupabaseClient | null = supabase
): Promise<boolean> {
  if (!client) return false;

  const { error } = await client
    .from('order_references')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('peptide_order_id', peptideOrderId);

  return !error;
}

export async function createCustomer(
  customerData: CustomerInput
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('customers')
    .upsert(
      {
        email: customerData.email.toLowerCase().trim(),
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        phone: customerData.phone ?? null,
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single();

  if (error || !data) {
    console.error('[supabase] createCustomer', error);
    return null;
  }

  return data.id as string;
}

/** Admin: Get all orders (paginated). Pass authenticated admin client so JWT is sent when RLS uses auth.uid(). */
export async function getAllOrders(
  limit = 50,
  offset = 0,
  client: SupabaseClient | null = supabase
): Promise<OrderReferenceRow[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('order_references')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    console.error('[supabase] getAllOrders', error);
    return [];
  }

  return data as OrderReferenceRow[];
}

/** Admin: Get orders by status */
export async function getOrdersByStatus(
  status: OrderStatus,
  client: SupabaseClient | null = supabase
): Promise<OrderReferenceRow[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('order_references')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[supabase] getOrdersByStatus', error);
    return [];
  }

  return data as OrderReferenceRow[];
}

/** Admin: Get all product mappings (including inactive) */
export async function getAllProductMappings(
  client: SupabaseClient | null = supabase
): Promise<
  Array<{
    id: string;
    cfg_code: string;
    peptide_name: string;
    protein_name: string;
    price: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>
> {
  if (!client) return [];

  const { data, error } = await client
    .from('product_mappings')
    .select('*')
    .order('cfg_code', { ascending: true });

  if (error || !data) {
    console.error('[supabase] getAllProductMappings', error);
    return [];
  }

  return data;
}
