import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { createLogger } from '../lib/logger';
import type { AdminOrderLine } from '../features/admin/orders/orderLineEditor';
import { logAdminAction } from './auditLog';
import { paymentRowToOrder } from './orderMappers';
import type {
  OrderCounts,
  OrderReferenceRow,
  OrderStatus,
  OrderStatusHistoryRow,
  PaymentEventRow,
  PaymentTrackingDbRow,
  RecentEmailFailure,
} from './orderTypes';

const log = createLogger('orders');

export type ReplaceAdminOrderLinesResult = {
  success: boolean;
  error?: string;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discountAmount?: number;
  totalAmount?: number;
};

export type CreateAdminInvoiceResult = {
  success: boolean;
  error?: string;
  trackingId?: string;
  orderReference?: string;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  totalAmount?: number;
  sendEmail?: boolean;
};

export type PaymentReminderRow = {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  payment_status: string;
  payment_reminder_count: number;
  last_payment_reminder_at: string | null;
  created_at: string;
  due_reminder_number: number | null;
};

export async function createAdminInvoice(
  input: {
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    lines: AdminOrderLine[];
    shipping?: number;
    note?: string;
    sendEmail?: boolean;
  },
  client: SupabaseClient | null = supabase
): Promise<CreateAdminInvoiceResult> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('admin_create_invoice', {
    p_customer_email: input.customerEmail,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone ?? null,
    p_lines: input.lines,
    p_shipping: input.shipping ?? 0,
    p_note: input.note ?? null,
    p_send_email: input.sendEmail !== false,
  });

  if (error) {
    log.error('createAdminInvoice failed', error);
    return { success: false, error: error.message };
  }

  const result = data as {
    success?: boolean;
    error?: string;
    tracking_id?: string;
    order_reference?: string;
    subtotal?: number;
    shipping?: number;
    tax?: number;
    total_amount?: number;
    send_email?: boolean;
  } | null;

  if (!result?.success) {
    return {
      success: false,
      error: result?.error ?? 'Could not create invoice.',
    };
  }

  return {
    success: true,
    trackingId: result.tracking_id,
    orderReference: result.order_reference,
    subtotal: Number(result.subtotal ?? 0),
    shipping: Number(result.shipping ?? 0),
    tax: Number(result.tax ?? 0),
    totalAmount: Number(result.total_amount ?? 0),
    sendEmail: result.send_email !== false,
  };
}

export async function listDuePaymentReminders(
  client: SupabaseClient | null = supabase
): Promise<PaymentReminderRow[]> {
  if (!client) return [];
  const { data, error } = await client.rpc('admin_list_payment_reminders');
  if (error) {
    log.warn('listDuePaymentReminders failed', error.message);
    return [];
  }
  return (Array.isArray(data) ? data : []) as PaymentReminderRow[];
}

export async function markPaymentReminderSent(
  trackingId: string,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };
  const { data, error } = await client.rpc('admin_mark_payment_reminder_sent', {
    p_tracking_id: trackingId,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) {
    return { success: false, error: result?.error ?? 'Could not mark reminder' };
  }
  return { success: true };
}

export async function replaceAdminOrderLines(
  trackingId: string,
  lines: AdminOrderLine[],
  reason: string,
  client: SupabaseClient | null = supabase
): Promise<ReplaceAdminOrderLinesResult> {
  if (!client) return { success: false, error: 'No database client' };

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return {
      success: false,
      error: 'A reason is required when changing order lines.',
    };
  }

  const { data, error } = await client.rpc('admin_replace_order_lines', {
    p_tracking_id: trackingId,
    p_lines: lines,
    p_reason: trimmedReason,
  });

  if (error) {
    log.error('replaceAdminOrderLines failed', error);
    return { success: false, error: error.message };
  }

  const result = data as {
    success?: boolean;
    error?: string;
    subtotal?: number;
    shipping?: number;
    tax?: number;
    discount_amount?: number;
    total_amount?: number;
  } | null;

  if (!result?.success) {
    return {
      success: false,
      error: result?.error ?? 'Could not update order lines.',
    };
  }

  return {
    success: true,
    subtotal: Number(result.subtotal ?? 0),
    shipping: Number(result.shipping ?? 0),
    tax: Number(result.tax ?? 0),
    discountAmount: Number(result.discount_amount ?? 0),
    totalAmount: Number(result.total_amount ?? 0),
  };
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
    log.error('createOrderReference failed', error);
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

  if (error || !data) return null;
  return data as OrderReferenceRow;
}

export async function updateOrderStatus(
  orderReference: string,
  status: OrderStatus,
  client: SupabaseClient | null = supabase,
  opts?: { note?: string }
): Promise<boolean> {
  if (!client) return false;

  const { data: existing } = await client
    .from('payment_tracking')
    .select('id, payment_status')
    .eq('order_reference', orderReference)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    payment_status: status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'payment_received') {
    updates.payment_completed_at = new Date().toISOString();
  }

  const { error } = await client
    .from('payment_tracking')
    .update(updates)
    .eq('order_reference', orderReference);

  if (error) return false;

  await logAdminAction(
    {
      action: `order.status.${status}`,
      target_table: 'payment_tracking',
      target_id: existing?.id ?? orderReference,
      before: existing ? { payment_status: existing.payment_status } : null,
      after: { payment_status: status },
      note: opts?.note,
    },
    client
  );

  return true;
}

export async function cancelOrder(
  orderId: string,
  opts: { reason: string; refunded?: boolean },
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };
  const reason = opts.reason.trim();
  if (!reason) return { success: false, error: 'A reason is required.' };

  const { data: existing, error: readErr } = await client
    .from('payment_tracking')
    .select('id, order_reference, payment_status, admin_notes')
    .eq('id', orderId)
    .maybeSingle();
  if (readErr || !existing) {
    return { success: false, error: readErr?.message ?? 'Order not found.' };
  }
  if (existing.payment_status === 'cancelled') {
    return { success: false, error: 'Order is already cancelled.' };
  }

  const tag = opts.refunded ? 'CANCELLED + REFUND' : 'CANCELLED';
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const noteLine = `[${stamp}] ${tag}: ${reason}`;
  const nextNotes = existing.admin_notes
    ? `${existing.admin_notes}\n${noteLine}`
    : noteLine;

  const { error: updErr } = await client
    .from('payment_tracking')
    .update({
      payment_status: 'cancelled',
      admin_notes: nextNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updErr) {
    log.error('cancelOrder failed', updErr);
    return { success: false, error: updErr.message };
  }

  await logAdminAction(
    {
      action: opts.refunded ? 'order.refund' : 'order.cancel',
      target_table: 'payment_tracking',
      target_id: orderId,
      before: { payment_status: existing.payment_status },
      after: { payment_status: 'cancelled', refunded: !!opts.refunded },
      note: reason,
    },
    client
  );

  return { success: true };
}

export async function getAllOrders(
  limit = 50,
  offset = 0,
  client: SupabaseClient | null = supabase
): Promise<OrderReferenceRow[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('payment_tracking')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    log.error('getAllOrders failed', error);
    return [];
  }

  return (data as PaymentTrackingDbRow[]).map(paymentRowToOrder);
}

export async function getOrderById(
  id: string,
  client: SupabaseClient | null = supabase
): Promise<OrderReferenceRow | null> {
  if (!client) return null;
  const { data, error } = await client
    .from('payment_tracking')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) {
    if (error) log.error('getOrderById failed', error);
    return null;
  }
  return paymentRowToOrder(data as PaymentTrackingDbRow);
}

export async function getOrderByReference(
  reference: string,
  client: SupabaseClient | null = supabase
): Promise<OrderReferenceRow | null> {
  if (!client) return null;
  const { data, error } = await client
    .from('payment_tracking')
    .select('*')
    .eq('order_reference', reference)
    .maybeSingle();
  if (error || !data) {
    if (error) log.error('getOrderByReference failed', error);
    return null;
  }
  return paymentRowToOrder(data as PaymentTrackingDbRow);
}

export async function getRecentEmailFailures(
  hours = 72,
  client: SupabaseClient | null = supabase,
  limit = 10
): Promise<{ rows: RecentEmailFailure[]; count: number }> {
  if (!client) return { rows: [], count: 0 };
  const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error, count } = await client
    .from('email_logs')
    .select(
      'id, order_reference, recipient_email, email_type, status, error_message, created_at',
      { count: 'exact' }
    )
    .eq('status', 'failed')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (error.code === '42P01' || /relation .* does not exist/.test(error.message ?? '')) {
      return { rows: [], count: 0 };
    }
    log.warn('getRecentEmailFailures failed', error);
    return { rows: [], count: 0 };
  }
  return { rows: (data as RecentEmailFailure[]) ?? [], count: count ?? data?.length ?? 0 };
}

export async function getPaymentEventsByReference(
  orderReference: string,
  client: SupabaseClient | null = supabase
): Promise<PaymentEventRow[]> {
  if (!client) return [];

  const { data: orderRow, error: orderError } = await client
    .from('orders')
    .select('id')
    .eq('order_reference', orderReference)
    .maybeSingle();

  if (orderError || !orderRow?.id) {
    if (orderError?.code !== '42P01' && !/relation .* does not exist/.test(orderError?.message ?? '')) {
      log.warn('getPaymentEventsByReference order lookup', orderError);
    }
    return [];
  }

  const { data: attempts, error: attemptError } = await client
    .from('payment_attempts')
    .select('id')
    .eq('order_id', orderRow.id);

  if (attemptError || !attempts?.length) {
    if (attemptError?.code === '42P01' || /relation .* does not exist/.test(attemptError?.message ?? '')) {
      return [];
    }
    return [];
  }

  const attemptIds = attempts.map((a) => a.id as string);
  const { data: events, error: eventsError } = await client
    .from('payment_events')
    .select('id, payment_attempt_id, event_type, payload, created_at')
    .in('payment_attempt_id', attemptIds)
    .order('created_at', { ascending: false });

  if (eventsError) {
    if (eventsError.code === '42P01' || /relation .* does not exist/.test(eventsError.message ?? '')) {
      return [];
    }
    log.error('getPaymentEventsByReference failed', eventsError);
    return [];
  }

  return (events as PaymentEventRow[]) ?? [];
}

export async function getOrderStatusHistory(
  orderId: string,
  client: SupabaseClient | null = supabase
): Promise<OrderStatusHistoryRow[]> {
  if (!client) return [];
  const { data, error } = await client
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) {
    if (error.code === '42P01' || /relation .* does not exist/.test(error.message ?? '')) {
      return [];
    }
    log.error('getOrderStatusHistory failed', error);
    return [];
  }
  return (data as OrderStatusHistoryRow[]) ?? [];
}

export async function getOrderCounts(
  client: SupabaseClient | null = supabase
): Promise<OrderCounts> {
  const empty: OrderCounts = {
    total: 0,
    pending: 0,
    viewed_instructions: 0,
    payment_received: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  if (!client) return empty;

  const statuses: OrderStatus[] = [
    'pending',
    'viewed_instructions',
    'payment_received',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  try {
    const [totalRes, ...statusRes] = await Promise.all([
      client.from('payment_tracking').select('*', { count: 'exact', head: true }),
      ...statuses.map((s) =>
        client
          .from('payment_tracking')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', s)
      ),
    ]);

    const counts: OrderCounts = { ...empty, total: totalRes.count ?? 0 };
    statuses.forEach((s, i) => {
      counts[s] = statusRes[i].count ?? 0;
    });
    return counts;
  } catch (err) {
    log.error('getOrderCounts failed', err);
    return empty;
  }
}

export async function getOrdersByStatus(
  status: OrderStatus,
  client: SupabaseClient | null = supabase
): Promise<OrderReferenceRow[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('payment_tracking')
    .select('*')
    .eq('payment_status', status)
    .order('created_at', { ascending: false });

  if (error || !data) {
    log.error('getOrdersByStatus failed', error);
    return [];
  }

  return (data as PaymentTrackingDbRow[]).map(paymentRowToOrder);
}

export async function deleteOrder(
  orderId: string,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data: existing } = await client
    .from('payment_tracking')
    .select('id, order_reference, customer_email, customer_name, payment_status, total_amount, currency')
    .eq('id', orderId)
    .maybeSingle();

  const { error } = await client.from('payment_tracking').delete().eq('id', orderId);

  if (error) {
    log.error('deleteOrder failed', error);
    return { success: false, error: error.message };
  }

  await logAdminAction(
    {
      action: 'order.delete',
      target_table: 'payment_tracking',
      target_id: orderId,
      before: existing ?? null,
      after: null,
    },
    client
  );

  return { success: true };
}
