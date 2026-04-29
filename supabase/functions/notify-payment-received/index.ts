/**
 * After admin marks a bank-transfer payment as received, sends a short thank-you SMS
 * via Twilio (same credentials as checkout). Not used for CoreForge pay-link flows.
 *
 * Auth: caller must present a valid Supabase JWT for a user with app_metadata.admin truthy.
 *
 * Deploy: npx supabase functions deploy notify-payment-received --no-verify-jwt
 *
 * Telemetry: every invocation writes one row to `sms_logs` with `status` reflecting the
 * outcome (`attempt`, `sent`, `failed`, `skipped`, or `auth_fail`/`bad_request`/etc.) so
 * you can audit / debug from the dashboard even when the function returns early.
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

type LogPayload = {
  status: string;
  phase: string;
  detail?: string | null;
  trackingId?: string | null;
  phone?: string | null;
  body?: string | null;
  twilioSid?: string | null;
  mock?: boolean;
  orderRef?: string | null;
  adminEmail?: string | null;
  ip?: string;
};

async function writeSmsLog(
  supabaseUrl: string | undefined,
  serviceKey: string | undefined,
  payload: LogPayload
): Promise<void> {
  if (!supabaseUrl || !serviceKey) return;
  try {
    const sb = createClient(supabaseUrl, serviceKey);
    const { error } = await sb.from('sms_logs').insert({
      // recipient_phone + message_body are NOT NULL on the existing table.
      // For pre-send phases (attempt, auth_fail, bad_request, etc.) we don't yet
      // have a real phone/body, so use '-' as a safe placeholder.
      recipient_phone: payload.phone ?? '-',
      recipient_name: null,
      message_body: payload.body ?? '-',
      message_type: 'payment_received',
      status: payload.status,
      provider: 'twilio',
      provider_message_id: payload.twilioSid ?? null,
      error_message: payload.detail ?? null,
      metadata: {
        phase: payload.phase,
        mock: payload.mock ?? false,
        order_reference: payload.orderRef ?? null,
        tracking_id: payload.trackingId ?? null,
        admin_email: payload.adminEmail ?? null,
        ip: payload.ip ?? null,
      },
      sent_at: payload.status === 'sent' ? new Date().toISOString() : null,
    });
    if (error) {
      console.error('sms_logs insert failed', error.message, error.details);
    }
  } catch (e) {
    console.error('sms_logs insert threw', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  const clientIp = getClientIp(req);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();

  // Heartbeat row: written for every invocation so empty `sms_logs` means "function wasn't called",
  // not "function bailed silently". Updated below with the actual outcome at exit.
  await writeSmsLog(supabaseUrl, serviceKey, {
    status: 'attempt',
    phase: 'received',
    ip: clientIp,
  });

  try {
    if (!webhookRateLimiter.check(clientIp)) {
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'rate_limited',
        phase: 'rate_limit',
        detail: 'Per-IP rate limit exceeded',
        ip: clientIp,
      });
      return jsonResponse(
        { ok: false, error: 'Rate limit exceeded. Try again shortly.' },
        429
      );
    }

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error(
        'notify-payment-received: missing SUPABASE_URL, SUPABASE_ANON_KEY, or service role'
      );
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'misconfigured',
        phase: 'env_check',
        detail:
          'Missing one of SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY',
        ip: clientIp,
      });
      return jsonResponse({ ok: false, error: 'Server misconfigured' }, 500);
    }

    const authHeader = req.headers.get('Authorization')?.trim() ?? '';
    const jwt = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (!jwt) {
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'auth_fail',
        phase: 'jwt',
        detail: 'No Authorization header',
        ip: clientIp,
      });
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
    if (
      userErr ||
      !userData.user?.email ||
      !isTruthyAdminFlag(userData.user.app_metadata as Record<string, unknown>)
    ) {
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'forbidden',
        phase: 'admin_check',
        detail: userErr
          ? userErr.message
          : !userData.user?.email
          ? 'No email on JWT user'
          : 'app_metadata.admin not truthy',
        adminEmail: userData?.user?.email ?? null,
        ip: clientIp,
      });
      return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
    }

    const adminEmail = userData.user.email;

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'bad_request',
        phase: 'parse_body',
        detail: 'Invalid JSON body',
        adminEmail,
        ip: clientIp,
      });
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
    }

    const trackingId = (body.tracking_id as string | undefined)?.trim();
    if (!trackingId) {
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'bad_request',
        phase: 'validate_input',
        detail: 'Missing tracking_id',
        adminEmail,
        ip: clientIp,
      });
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
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'not_found',
        phase: 'fetch_payment',
        detail: fetchErr?.message ?? 'Row not found',
        trackingId,
        adminEmail,
        ip: clientIp,
      });
      return jsonResponse(
        { ok: false, error: 'Payment record not found' },
        404
      );
    }

    if (row.payment_status !== 'payment_received') {
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'wrong_status',
        phase: 'status_check',
        detail: `payment_status=${row.payment_status}`,
        trackingId,
        orderRef: (row.order_reference as string | undefined) ?? null,
        adminEmail,
        ip: clientIp,
      });
      return jsonResponse(
        { ok: false, error: 'Payment is not marked as received yet' },
        400
      );
    }

    const phone = (row.customer_phone as string | null)?.trim();
    const ref =
      (row.order_reference as string | undefined)?.trim() || trackingId;

    if (!phone) {
      await writeSmsLog(supabaseUrl, serviceKey, {
        status: 'skipped',
        phase: 'phone_check',
        detail: 'Customer has no phone on payment_tracking',
        trackingId,
        orderRef: ref,
        adminEmail,
        ip: clientIp,
      });
      return jsonResponse({ ok: true, skipped: true, reason: 'no_phone' });
    }

    const mockSms = Deno.env.get('MOCK_SMS_DELIVERY') === 'true';
    const brand = Deno.env.get('CHECKOUT_DELIVERY_BRAND')?.trim() || 'Laminin';
    const smsBody = `Thank you for your order from ${brand}. Your order reference ID is ${ref}.`;

    const smsResult = await sendTwilioSms({
      toE164: phone,
      body: smsBody,
      mock: mockSms,
    });

    await writeSmsLog(supabaseUrl, serviceKey, {
      status: smsResult.ok ? 'sent' : 'failed',
      phase: 'twilio',
      detail: smsResult.ok ? null : smsResult.error ?? 'unknown',
      trackingId,
      phone,
      body: smsBody,
      twilioSid: smsResult.twilio_sid ?? null,
      mock: mockSms,
      orderRef: ref,
      adminEmail,
      ip: clientIp,
    });

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
    await writeSmsLog(supabaseUrl, serviceKey, {
      status: 'error',
      phase: 'unhandled',
      detail: e instanceof Error ? e.message : String(e),
      ip: clientIp,
    });
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
