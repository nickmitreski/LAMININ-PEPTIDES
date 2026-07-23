/**
 * Supabase Edge Function: payment-reminders
 *
 * Lists unpaid invoices due for day-3 / day-6 reminders and emails them.
 * Invoke on a schedule (Supabase cron / GitHub Action / external scheduler):
 *
 *   curl -X POST "$SUPABASE_URL/functions/v1/payment-reminders" \
 *     -H "Authorization: Bearer $SERVICE_OR_CRON_SECRET"
 *
 * Optional header: x-cron-secret must match PAYMENT_REMINDER_CRON_SECRET when set.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  const cronSecret = Deno.env.get('PAYMENT_REMINDER_CRON_SECRET');
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret') || '';
    if (provided !== cronSecret) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'Not configured' }, 500);
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Service role bypasses jwt_is_admin — call the list via SQL directly.
  const { data: dueRows, error: listError } = await sb
    .from('payment_tracking')
    .select(
      'id, order_reference, customer_email, customer_name, customer_phone, total_amount, payment_reminder_count, last_payment_reminder_at, created_at, payment_status'
    )
    .in('payment_status', ['pending', 'viewed_instructions'])
    .lt('payment_reminder_count', 2);

  if (listError) {
    return json({ ok: false, error: listError.message }, 500);
  }

  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const due = (dueRows ?? []).filter((row) => {
    const created = new Date(row.created_at).getTime();
    const last = row.last_payment_reminder_at
      ? new Date(row.last_payment_reminder_at).getTime()
      : created;
    if (row.payment_reminder_count === 0) return now - created >= threeDaysMs;
    if (row.payment_reminder_count === 1) return now - last >= threeDaysMs;
    return false;
  });

  const results: Array<{ order_reference: string; ok: boolean; error?: string }> = [];

  for (const row of due) {
    if (!row.customer_email) {
      results.push({
        order_reference: row.order_reference,
        ok: false,
        error: 'no email',
      });
      continue;
    }

    const { data: emailData, error: emailError } = await sb.functions.invoke(
      'send-order-email',
      {
        body: {
          order_reference: row.order_reference,
          customer_email: row.customer_email,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone ?? '',
          total_amount: Number(row.total_amount ?? 0),
          currency: 'AUD',
          email_type: 'payment_reminder',
        },
      }
    );

    if (emailError || emailData?.ok !== true) {
      results.push({
        order_reference: row.order_reference,
        ok: false,
        error: emailError?.message || emailData?.error || 'email failed',
      });
      continue;
    }

    await sb
      .from('payment_tracking')
      .update({
        payment_reminder_count: Math.min(2, Number(row.payment_reminder_count ?? 0) + 1),
        last_payment_reminder_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    results.push({ order_reference: row.order_reference, ok: true });
  }

  return json({
    ok: true,
    due: due.length,
    sent: results.filter((r) => r.ok).length,
    results,
  });
});
