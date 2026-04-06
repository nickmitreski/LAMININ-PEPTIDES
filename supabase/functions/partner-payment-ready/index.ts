/**
 * COREFORGE / payment-site webhook: after creating the hosted pay page, call this with
 * `payment_url` + `verification_code` (option B). LAMIN verifies code against `code_hash`,
 * stores the URL, sends SMS (or mocks SMS when MOCK_SMS_DELIVERY=true).
 *
 * Deploy: npx supabase functions deploy partner-payment-ready --no-verify-jwt
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { timingSafeEqualHex } from '../_shared/timingSafe.ts';
import { sendTwilioSms } from '../_shared/twilioSms.ts';

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

async function sha256Hex(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatVerificationCode(code: string): string {
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
  return code;
}

/** Best-effort E.164; AU mobiles often stored as 04xx — map to +61. */
function toE164(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('+')) return t;
  const d = t.replace(/\D/g, '');
  if (d.startsWith('04') && d.length >= 10) return `+61${d.slice(1)}`;
  if (d.startsWith('61')) return `+${d}`;
  return `+${d}`;
}

function formatMoney(amount: number, currency: string): string {
  const cur = currency.trim().toUpperCase() || 'AUD';
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: cur }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  const expected = Deno.env.get('PARTNER_PAYMENT_READY_SECRET')?.trim();
  const auth = req.headers.get('Authorization')?.trim() ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!expected || token !== expected) {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const peptide_order_id = body.peptide_order_id as string | undefined;
  const payment_url = body.payment_url as string | undefined;
  const verification_code = body.verification_code as string | undefined;
  const payment_id = body.payment_id as string | undefined;

  if (!peptide_order_id?.trim()) {
    return jsonResponse({ ok: false, error: 'Missing peptide_order_id' }, 400);
  }
  if (!payment_url?.trim() || !payment_url.startsWith('https://')) {
    return jsonResponse({ ok: false, error: 'Missing or invalid payment_url (https required)' }, 400);
  }
  if (!verification_code?.trim()) {
    return jsonResponse({ ok: false, error: 'Missing verification_code' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ ok: false, error: 'Server misconfigured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: row, error: fetchErr } = await supabase
    .from('checkout_secure_sessions')
    .select(
      'id, code_hash, customer_phone, customer_first_name, customer_last_name, grand_total, currency, external_payment_url, partner_pay_link_sms_sent_at'
    )
    .eq('peptide_order_id', peptide_order_id)
    .maybeSingle();

  if (fetchErr || !row) {
    console.error(fetchErr);
    return jsonResponse({ ok: false, error: 'Session not found' }, 404);
  }

  const codeHash = row.code_hash as string;
  const incomingHash = await sha256Hex(verification_code.trim());
  if (!timingSafeEqualHex(incomingHash.toLowerCase(), codeHash.toLowerCase())) {
    return jsonResponse({ ok: false, error: 'Invalid verification_code' }, 403);
  }

  const existingUrl = row.external_payment_url as string | null;
  const smsSentAt = row.partner_pay_link_sms_sent_at as string | null;

  if (smsSentAt) {
    return jsonResponse({
      ok: true,
      duplicate: true,
      message: 'SMS already sent for this session',
      payment_url_stored: existingUrl,
    });
  }

  if (existingUrl && existingUrl !== payment_url.trim()) {
    return jsonResponse(
      { ok: false, error: 'Session already has a different payment URL' },
      409
    );
  }

  const phone = (row.customer_phone as string | null)?.trim();
  if (!phone) {
    return jsonResponse(
      { ok: false, error: 'No customer_phone on session; cannot send SMS' },
      422
    );
  }

  const mockSms = Deno.env.get('MOCK_SMS_DELIVERY') === 'true';
  const deliveryBrand = Deno.env.get('CHECKOUT_DELIVERY_BRAND')?.trim() || 'LAMININ';
  const first = (row.customer_first_name as string | null)?.trim() ?? '';
  const last = (row.customer_last_name as string | null)?.trim() ?? '';
  const name = [first, last].filter(Boolean).join(' ') || 'Customer';
  const amount = Number(row.grand_total);
  const currency = (row.currency as string) || 'AUD';
  const amountLabel = formatMoney(amount, currency);
  const formattedCode = formatVerificationCode(verification_code.trim());

  const smsBody =
    `Hi ${name}, pay securely via COREFORGE (${deliveryBrand}). Ref: ${peptide_order_id}. ` +
    `Amount: ${amountLabel}. Code: ${formattedCode}. Open: ${payment_url.trim()}`;

  const smsResult = await sendTwilioSms({
    toE164: toE164(phone),
    body: smsBody,
    mock: mockSms,
  });

  if (!smsResult.ok) {
    return jsonResponse(
      { ok: false, error: 'SMS failed', detail: smsResult.error ?? 'unknown' },
      502
    );
  }

  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from('checkout_secure_sessions')
    .update({
      external_payment_url: payment_url.trim(),
      partner_notified_at: now,
      partner_pay_link_sms_sent_at: now,
      delivery_mock: mockSms,
    })
    .eq('id', row.id);

  if (upErr) {
    console.error(upErr);
    return jsonResponse({ ok: false, error: 'Could not update session' }, 500);
  }

  return jsonResponse({
    ok: true,
    sms_sent: !smsResult.mocked,
    sms_mocked: smsResult.mocked,
    sms_preview: smsBody,
    twilio_sid: smsResult.twilio_sid ?? null,
    payment_id: payment_id ?? null,
  });
});
