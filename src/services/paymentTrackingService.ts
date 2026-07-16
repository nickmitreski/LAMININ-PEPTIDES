import type { SupabaseClient } from '@supabase/supabase-js';
import { logAdminAction } from './auditLog';
import type { PaymentTrackingRow } from './orderTypes';

export async function getPaymentTrackingMap(
  client: SupabaseClient | null
): Promise<Map<string, PaymentTrackingRow>> {
  const map = new Map<string, PaymentTrackingRow>();
  if (!client) return map;

  const { data, error } = await client
    .from('payment_tracking')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[supabase] getPaymentTrackingMap', error);
    return map;
  }

  for (const row of data as PaymentTrackingRow[]) {
    map.set(row.order_reference, row);
  }
  return map;
}

export async function markPaymentReceived(
  trackingId: string,
  adminEmail: string,
  notes: string | null,
  client: SupabaseClient | null
): Promise<{
  success: boolean;
  error?: string;
  notifySmsError?: string;
  notifySmsSkipped?: boolean;
  notifySmsSkipReason?: string;
}> {
  if (!client) return { success: false, error: 'No client' };

  const { error } = await client.rpc('mark_payment_received', {
    p_tracking_id: trackingId,
    p_admin_email: adminEmail,
    p_notes: notes,
  });

  if (error) {
    console.error('[supabase] markPaymentReceived', error);
    return { success: false, error: error.message };
  }

  await logAdminAction(
    {
      action: 'order.mark_paid',
      target_table: 'payment_tracking',
      target_id: trackingId,
      after: { payment_status: 'payment_received' },
      note: notes ?? `via ${adminEmail}`,
    },
    client
  );

  try {
    const { data, error: fnError } = await client.functions.invoke('notify-payment-received', {
      body: { tracking_id: trackingId },
    });
    if (fnError) {
      console.error('[supabase] notify-payment-received', fnError);
      return { success: true, notifySmsError: fnError.message };
    }
    const payload = data as {
      ok?: boolean;
      skipped?: boolean;
      reason?: string;
      error?: string;
      detail?: string;
    } | null;
    if (payload?.skipped) {
      return {
        success: true,
        notifySmsSkipped: true,
        notifySmsSkipReason: payload.reason,
      };
    }
    if (payload && payload.ok === false) {
      const detail = [payload.error, payload.detail].filter(Boolean).join(': ');
      return { success: true, notifySmsError: detail || 'notify-payment-received failed' };
    }
  } catch (e) {
    console.error('[supabase] notify-payment-received', e);
    return {
      success: true,
      notifySmsError: e instanceof Error ? e.message : 'notify-payment-received invoke failed',
    };
  }

  return { success: true };
}

export async function archivePayment(
  trackingId: string,
  adminEmail: string,
  client: SupabaseClient | null
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };

  const { error } = await client.rpc('archive_payment', {
    p_tracking_id: trackingId,
    p_admin_email: adminEmail,
  });

  if (error) {
    console.error('[supabase] archivePayment', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
