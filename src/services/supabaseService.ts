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
  notes: string | null;
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
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_postcode?: string;
  customer_country?: string;
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
      customer_first_name: orderData.customer_first_name ?? null,
      customer_last_name: orderData.customer_last_name ?? null,
      customer_phone: orderData.customer_phone ?? null,
      customer_address: orderData.customer_address ?? null,
      customer_city: orderData.customer_city ?? null,
      customer_state: orderData.customer_state ?? null,
      customer_postcode: orderData.customer_postcode ?? null,
      customer_country: orderData.customer_country ?? null,
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

export interface OrderCounts {
  total: number;
  pending: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

/**
 * Admin: Get accurate order counts directly from the DB.
 * Avoids the inaccuracy of computing stats from a paginated slice in the UI.
 */
export async function getOrderCounts(
  client: SupabaseClient | null = supabase
): Promise<OrderCounts> {
  const empty: OrderCounts = {
    total: 0,
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  if (!client) return empty;

  const statuses: OrderStatus[] = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  try {
    const [totalRes, ...statusRes] = await Promise.all([
      client.from('order_references').select('*', { count: 'exact', head: true }),
      ...statuses.map((s) =>
        client
          .from('order_references')
          .select('*', { count: 'exact', head: true })
          .eq('status', s)
      ),
    ]);

    const counts: OrderCounts = { ...empty, total: totalRes.count ?? 0 };
    statuses.forEach((s, i) => {
      counts[s] = statusRes[i].count ?? 0;
    });
    return counts;
  } catch (err) {
    console.error('[supabase] getOrderCounts', err);
    return empty;
  }
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

/** Admin: Get all customers */
export async function getAllCustomers(
  client: SupabaseClient | null = supabase
): Promise<
  Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postcode: string | null;
    country: string | null;
    total_orders: number;
    total_spent: number;
    last_order_date: string | null;
    created_at: string;
  }>
> {
  if (!client) return [];

  const { data, error } = await client
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[supabase] getAllCustomers', error);
    return [];
  }

  return data;
}

/** Admin: Delete customer and all their orders */
export async function deleteCustomerAndOrders(
  customerEmail: string,
  client: SupabaseClient | null = supabase
): Promise<{
  success: boolean;
  error?: string;
  orders_deleted?: number;
  notes_deleted?: number;
}> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('delete_customer_and_orders', {
    p_customer_email: customerEmail,
  });

  if (error) {
    console.error('[supabase] deleteCustomerAndOrders', error);
    return { success: false, error: error.message };
  }

  return data as {
    success: boolean;
    error?: string;
    orders_deleted?: number;
    notes_deleted?: number;
  };
}

/** Admin: Delete individual order */
export async function deleteOrder(
  orderId: string,
  client: SupabaseClient | null = supabase
): Promise<{
  success: boolean;
  error?: string;
  notes_deleted?: number;
}> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('delete_order', {
    p_order_id: orderId,
  });

  if (error) {
    console.error('[supabase] deleteOrder', error);
    return { success: false, error: error.message };
  }

  return data as {
    success: boolean;
    error?: string;
    notes_deleted?: number;
  };
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

/** Admin: Get product with images */
export async function getProductWithImages(
  productId: string,
  client: SupabaseClient | null = supabase
): Promise<{
  success: boolean;
  product?: any;
  error?: string;
}> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('get_product_with_images', {
    p_product_id: productId,
  });

  if (error) {
    console.error('[supabase] getProductWithImages', error);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; product?: any; error?: string };
}

/** Admin: Update product */
export async function updateProduct(
  productId: string,
  updates: {
    peptide_name?: string;
    protein_name?: string;
    description?: string;
    price?: number;
    category?: string;
    is_active?: boolean;
    stock_quantity?: number;
    low_stock_threshold?: number;
    track_inventory?: boolean;
  },
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('update_product', {
    p_product_id: productId,
    p_peptide_name: updates.peptide_name || null,
    p_protein_name: updates.protein_name || null,
    p_description: updates.description || null,
    p_price: updates.price || null,
    p_category: updates.category || null,
    p_is_active: updates.is_active !== undefined ? updates.is_active : null,
    p_stock_quantity: updates.stock_quantity !== undefined ? updates.stock_quantity : null,
    p_low_stock_threshold: updates.low_stock_threshold || null,
    p_track_inventory: updates.track_inventory !== undefined ? updates.track_inventory : null,
  });

  if (error) {
    console.error('[supabase] updateProduct', error);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; error?: string };
}

/** Admin: Save product image record */
export async function saveProductImage(
  productId: string,
  imageUrl: string,
  storagePath: string,
  fileName: string,
  fileSize: number,
  isPrimary: boolean = false,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: imageUrl,
      storage_path: storagePath,
      file_name: fileName,
      file_size: fileSize,
      is_primary: isPrimary,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[supabase] saveProductImage', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/** Admin: Set primary product image */
export async function setPrimaryProductImage(
  imageId: string,
  productId: string,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('set_primary_product_image', {
    p_image_id: imageId,
    p_product_id: productId,
  });

  if (error) {
    console.error('[supabase] setPrimaryProductImage', error);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; error?: string };
}

/** Admin: Delete product image */
export async function deleteProductImageRecord(
  imageId: string,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; storage_path?: string; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('delete_product_image', {
    p_image_id: imageId,
  });

  if (error) {
    console.error('[supabase] deleteProductImageRecord', error);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; storage_path?: string; error?: string };
}
