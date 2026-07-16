import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { createLogger } from '../lib/logger';
import { logAdminAction } from './auditLog';
import type { CustomerInput } from './orderTypes';

const log = createLogger('customers');

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
    log.error('createCustomer failed', error);
    return null;
  }

  return data.id as string;
}

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
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) {
    log.error('getAllCustomers failed', error);
    return [];
  }

  return data;
}

export async function adminUpdateCustomer(
  customerId: string,
  patch: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postcode?: string | null;
    country?: string | null;
  },
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('admin_update_customer', {
    p_customer_id: customerId,
    p_email: patch.email ?? null,
    p_first_name: patch.first_name ?? null,
    p_last_name: patch.last_name ?? null,
    p_phone: patch.phone ?? null,
    p_address: patch.address ?? null,
    p_city: patch.city ?? null,
    p_state: patch.state ?? null,
    p_postcode: patch.postcode ?? null,
    p_country: patch.country ?? null,
  });

  if (error) {
    log.error('adminUpdateCustomer failed', error);
    return { success: false, error: error.message };
  }

  const r = data as { success?: boolean; error?: string };
  if (r?.success === false) {
    return { success: false, error: r.error || 'Update failed' };
  }

  await logAdminAction(
    {
      action: 'customer.edit',
      target_table: 'customers',
      target_id: customerId,
      after: patch,
    },
    client
  );

  return { success: true };
}

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

  if (!error && data) {
    const result = data as {
      success: boolean;
      error?: string;
      orders_deleted?: number;
      notes_deleted?: number;
    };
    if (result.success) {
      await logAdminAction(
        {
          action: 'customer.delete',
          target_table: 'customers',
          target_id: customerEmail,
          before: { email: customerEmail },
          note: `Deleted customer and ${result.orders_deleted ?? 0} orders`,
        },
        client
      );
    }
    return result;
  }

  log.warn('deleteCustomerAndOrders RPC unavailable, using direct deletes', error);

  try {
    const { count: ptCount } = await client
      .from('payment_tracking')
      .delete({ count: 'exact' })
      .eq('customer_email', customerEmail);

    await client.from('order_references').delete().eq('customer_email', customerEmail);

    const { error: custErr } = await client
      .from('customers')
      .delete()
      .eq('email', customerEmail);

    if (custErr) {
      log.error('deleteCustomerAndOrders direct delete failed', custErr);
      return { success: false, error: custErr.message };
    }

    await logAdminAction(
      {
        action: 'customer.delete',
        target_table: 'customers',
        target_id: customerEmail,
        before: { email: customerEmail },
        note: `Direct fallback delete; ${ptCount ?? 0} payment_tracking rows removed`,
      },
      client
    );

    return { success: true, orders_deleted: ptCount ?? 0, notes_deleted: 0 };
  } catch (e) {
    log.error('deleteCustomerAndOrders fallback failed', e);
    return { success: false, error: 'Failed to delete customer' };
  }
}
