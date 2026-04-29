/**
 * After admin marks a bank-transfer payment as received, sends a short thank-you SMS
 * via Twilio (same credentials as checkout). Not used for CoreForge pay-link flows.
 *
 * Auth: caller must present a valid Supabase JWT for a user with app_metadata.admin truthy.
 *
 * Deploy: npx supabase functions deploy notify-payment-received --no-verify-jwt
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { sendTwilioSms } from '../_shared/twilioSms.ts';
import { webhookRateLimiter, getClientIp } from '../_shared/rateLimit.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isTruthyAdminFlag(meta: Record<string, unknown> | undefined): boolean {
  const v = meta?.admin;
  if (v === true || v === 1) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1' || s === 'yes';
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const clientIp = getClientIp(req);
    if (!webhookRateLimiter.check(clientIp)) {
      return jsonResponse({ ok: false, error: 'Rate limit exceeded. Try again shortly.' }, 429);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error('notify-payment-received: missing SUPABASE_URL, SUPABASE_ANON_KEY, or service role');
      return jsonResponse({ ok: false, error: 'Server misconfigured' }, 500);
    }

    const authHeader = req.headers.get('Authorization')?.trim() ?? '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!jwt) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
    if (
      userErr ||
      !userData.user?.email ||
      !isTruthyAdminFlag(userData.user.app_metadata as Record<string, unknown>)
    ) {
      return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
    }

    const trackingId = (body.tracking_id as string | undefined)?.trim();
    if (!trackingId) {
      return jsonResponse({ ok: false, error: 'Missing tracking_id' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: row, error: fetchErr } = await supabase
      .from('payment_tracking')
      .select('id, order_reference, customer_phone, payment_status')
      .eq('id', trackingId)
      .maybeSingle();

    if (fetchErr || !row) {
      console.error('notify-payment-received fetch', fetchErr);
      return jsonResponse({ ok: false, error: 'Payment record not found' }, 404);
    }

    if (row.payment_status !== 'payment_received') {
      return jsonResponse(
        { ok: false, error: 'Payment is not marked as received yet' },
        400
      );
    }

    const phone = (row.customer_phone as string | null)?.trim();
    if (!phone) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: 'no_phone',
      });
    }

    const mockSms = Deno.env.get('MOCK_SMS_DELIVERY') === 'true';
    const brand = Deno.env.get('CHECKOUT_DELIVERY_BRAND')?.trim() || 'Laminin';
    const ref = (row.order_reference as string | undefined)?.trim() || trackingId;
    const smsBody = `Thank you for your order from ${brand}. Your order reference ID is ${ref}.`;

    const smsResult = await sendTwilioSms({
      toE164: phone,
      body: smsBody,
      mock: mockSms,
    });

    // Log to sms_logs table for debugging
    await supabase.from('sms_logs').insert({
      recipient_phone: phone,
      recipient_name: null,
      message_body: smsBody,
      message_type: 'payment_received',
      status: smsResult.ok ? 'sent' : 'failed',
      provider: 'twilio',
      provider_message_id: smsResult.twilio_sid ?? null,
      error_message: smsResult.ok ? null : (smsResult.error ?? 'unknown'),
      metadata: { mock: mockSms, order_reference: ref },
      sent_at: smsResult.ok ? new Date().toISOString() : null,
    }).then(() => {}).catch((e) => console.error('sms_logs insert failed', e));

    if (!smsResult.ok) {
      console.error('notify-payment-received Twilio error', smsResult.error);
      return jsonResponse({
        ok: false,
        error: 'SMS failed',
        detail: smsResult.error ?? 'unknown',
      });
    }

    return jsonResponse({
      ok: true,
      sms_sent: !smsResult.mocked,
      sms_mocked: smsResult.mocked,
      twilio_sid: smsResult.twilio_sid ?? null,
    });
  } catch (e) {
    console.error('notify-payment-received unhandled', e);
    return jsonResponse(
      {
        ok: false,
        error: 'Internal error',
        detail: e instanceof Error ? e.message : String(e),
      },
      500
    );
  }
});
