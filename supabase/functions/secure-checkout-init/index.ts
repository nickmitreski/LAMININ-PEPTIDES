/**
 * Supabase Edge Function: create secure checkout session (hashed code), optional Resend/Twilio with payment link, optional partner notify.
 *
 * Flow when `PAYMENT_LINK_CREATE_URL` + `PAYMENT_LINK_BEARER` are set and `ENABLE_CODE_DELIVERY=true`:
 * 1) Insert session (hashed code)
 * 2) Call partner `create-payment-link` → get Square (or other) pay URL
 * 3) Send email/SMS with reference, plain code, amount, and link (“secure encrypted payment from …”)
 *
 * If payment link creation fails while delivery is enabled and a link was required, no email/SMS is sent and the function returns an error.
 *
 * Deploy: `npx supabase functions deploy secure-checkout-init --no-verify-jwt`
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-checkout-init-secret',
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

function randomDigits(length: number): string {
  const digits = '0123456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += digits[arr[i]! % 10];
  }
  return out;
}

function formatMoney(amount: number, currency: string): string {
  const cur = currency.trim().toUpperCase() || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
    }).format(amount);
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

  const secret = Deno.env.get('CHECKOUT_INIT_HMAC_SECRET');
  const clientSecret = req.headers.get('x-checkout-init-secret');
  if (secret && clientSecret !== secret) {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const peptide_order_id = body.peptide_order_id as string | undefined;
  const customer = body.customer as Record<string, string> | undefined;
  const totals = body.totals as Record<string, number> | undefined;
  const send_email = Boolean(body.send_email);
  const send_sms = Boolean(body.send_sms);
  const enriched_lines = body.enriched_lines;
  const peptide_items = body.peptide_items;
  const protein_items = body.protein_items;

  if (!peptide_order_id || !customer || !totals || typeof totals.grand_total !== 'number') {
    return jsonResponse({ ok: false, error: 'Missing required fields' }, 400);
  }

  if (!send_email && !send_sms) {
    return jsonResponse({ ok: false, error: 'No delivery channel' }, 400);
  }

  const wantEmail = send_email && Boolean(customer.email);
  const wantSms = send_sms && Boolean(customer.phone);

  const deliveryEnabled = Deno.env.get('ENABLE_CODE_DELIVERY') === 'true';
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID') ?? Deno.env.get('TWILIO_FROM_NUMBER');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ ok: false, error: 'Server misconfigured' }, 500);
  }

  const deliveryBrand =
    Deno.env.get('CHECKOUT_DELIVERY_BRAND')?.trim() || 'LAMININ';

  const plainCode = randomDigits(6);
  const code_hash = await sha256Hex(plainCode);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const sent_via: string[] = [];
  if (send_email && customer.email) sent_via.push('email');
  if (send_sms && customer.phone) sent_via.push('sms');

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: inserted, error: insertError } = await supabase
    .from('checkout_secure_sessions')
    .insert({
      peptide_order_id,
      code_hash,
      expires_at: expiresAt,
      grand_total: totals.grand_total,
      currency: 'USD',
      customer_email: wantEmail ? (customer.email ?? null) : null,
      customer_phone: wantSms ? (customer.phone ?? null) : null,
      customer_first_name: customer.first_name ?? null,
      customer_last_name: customer.last_name ?? null,
      enriched_lines: enriched_lines ?? [],
      peptide_items: peptide_items ?? null,
      protein_items: protein_items ?? null,
      totals: totals ?? null,
      sent_via,
      delivery_mock: true,
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    console.error(insertError);
    return jsonResponse({ ok: false, error: 'Could not create session' }, 500);
  }

  const sessionId = inserted.id as string;

  const paymentLinkCreateUrl = Deno.env.get('PAYMENT_LINK_CREATE_URL')?.trim();
  const paymentLinkBearer = Deno.env.get('PAYMENT_LINK_BEARER')?.trim();
  const paymentLinkSecretHeader = Deno.env.get('PAYMENT_LINK_SECRET_HEADER')?.trim();
  const paymentLinkCurrency = Deno.env.get('PAYMENT_LINK_CURRENCY')?.trim() || 'USD';
  const paymentLinkExpiration = Number(Deno.env.get('PAYMENT_LINK_EXPIRATION_MINUTES') ?? '15');

  let external_payment_url: string | null = null;
  let payment_link_id: string | null = null;

  const paymentLinkConfigured = Boolean(paymentLinkCreateUrl && paymentLinkBearer);
  /** When delivery is on and partner link is configured, we require a URL before emailing/texting. */
  const requirePaymentLinkForDelivery = deliveryEnabled && paymentLinkConfigured;

  if (paymentLinkConfigured) {
    try {
      const plHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${paymentLinkBearer}`,
      };
      if (paymentLinkSecretHeader) {
        plHeaders['x-payment-link-secret'] = paymentLinkSecretHeader;
      }
      const lines = Array.isArray(enriched_lines) ? enriched_lines : [];
      /** Partner GoForge/CoreForge treats `lamin` as strict: 6-digit code + reference. */
      const metaSource =
        Deno.env.get('PAYMENT_LINK_METADATA_SOURCE')?.trim() || 'lamin';
      const plBody = {
        amount: totals.grand_total,
        code: plainCode,
        reference: peptide_order_id,
        currency: paymentLinkCurrency,
        expirationMinutes: Number.isFinite(paymentLinkExpiration) ? paymentLinkExpiration : 15,
        metadata: {
          source: metaSource,
          customer_email: customer.email ?? null,
          customer_phone: customer.phone ?? null,
          enriched_lines: lines.slice(0, 50),
        },
      };
      const plRes = await fetch(paymentLinkCreateUrl!, {
        method: 'POST',
        headers: {
          ...plHeaders,
          'User-Agent': 'PaymentBridge/1.0',
        },
        body: JSON.stringify(plBody),
      });
      const plJson = (await plRes.json().catch(() => null)) as {
        payment_url?: string;
        payment_id?: string;
      } | null;
      if (plRes.ok && plJson?.payment_url && typeof plJson.payment_url === 'string') {
        external_payment_url = plJson.payment_url;
        payment_link_id = plJson.payment_id ?? null;
      } else {
        console.error(
          'create-payment-link non-OK',
          plRes.status,
          plJson ? JSON.stringify(plJson) : await plRes.text().catch(() => '')
        );
      }
    } catch (e) {
      console.error('create-payment-link failed', e);
    }
  }

  const allowDeliveryWithoutLink =
    Deno.env.get('ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK') === 'true';

  if (requirePaymentLinkForDelivery && !external_payment_url && !allowDeliveryWithoutLink) {
    await supabase.from('checkout_secure_sessions').delete().eq('id', sessionId);
    return jsonResponse(
      {
        ok: false,
        error:
          'Could not create payment link. Check partner create-payment-link and secrets; no message was sent.',
      },
      502
    );
  }

  if (external_payment_url) {
    await supabase
      .from('checkout_secure_sessions')
      .update({
        external_payment_url,
        partner_notified_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  }

  const amountLabel = formatMoney(totals.grand_total, paymentLinkCurrency);
  const includeLinkInMessages = Boolean(external_payment_url);

  const emailSubject = includeLinkInMessages
    ? `Your secure encrypted payment link from ${deliveryBrand}`
    : `Your ${deliveryBrand} payment code`;

  const emailText = includeLinkInMessages
    ? `Here is your link to the secure encrypted payment from ${deliveryBrand}.

Order reference: ${peptide_order_id}
Verification code: ${plainCode}
Amount: ${amountLabel}

Pay here (open this link on your phone or computer):
${external_payment_url}

Enter your verification code when prompted. This link and code expire in about 15 minutes.`
    : `Your verification code is ${plainCode}.

Order reference: ${peptide_order_id}
Amount: ${amountLabel}

Expires in 15 minutes.`;

  const smsBody = includeLinkInMessages
    ? `${deliveryBrand} — Secure pay ${amountLabel}. Ref ${peptide_order_id}. Code ${plainCode}. Link: ${external_payment_url}`
    : `${deliveryBrand} code: ${plainCode} (ref ${peptide_order_id}). Expires in 15 min.`;

  let emailSent = false;
  let smsSent = false;

  if (deliveryEnabled) {
    if (wantEmail && customer.email && resendKey) {
      try {
        const er = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM') ?? 'orders@example.com',
            to: [customer.email],
            subject: emailSubject,
            text: emailText,
          }),
        });
        emailSent = er.ok;
        if (!er.ok) console.error('Resend non-OK', await er.text());
      } catch (e) {
        console.error('Resend failed', e);
      }
    }

    if (wantSms && customer.phone && twilioSid && twilioToken && twilioFrom) {
      try {
        const auth = btoa(`${twilioSid}:${twilioToken}`);
        const form = new URLSearchParams();
        if (twilioFrom.startsWith('MG')) {
          form.set('MessagingServiceSid', twilioFrom);
        } else {
          form.set('From', twilioFrom);
        }
        form.set('To', customer.phone);
        form.set('Body', smsBody);
        const tr = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        });
        smsSent = tr.ok;
        if (!tr.ok) console.error('Twilio non-OK', await tr.text());
      } catch (e) {
        console.error('Twilio failed', e);
      }
    }
  }

  const partnerNotifyUrl = Deno.env.get('PAYMENT_LINK_PARTNER_NOTIFY_URL')?.trim();
  const partnerNotifySecret = Deno.env.get('PAYMENT_LINK_PARTNER_NOTIFY_SECRET')?.trim();
  let partner_payment_ui_notify_ok = false;
  if (partnerNotifyUrl && external_payment_url) {
    try {
      const nh: Record<string, string> = { 'Content-Type': 'application/json' };
      if (partnerNotifySecret) {
        nh.Authorization = `Bearer ${partnerNotifySecret}`;
      }
      const nRes = await fetch(partnerNotifyUrl, {
        method: 'POST',
        headers: nh,
        body: JSON.stringify({
          event: 'payment_link_ready',
          payment_url: external_payment_url,
          payment_id: payment_link_id,
          reference: peptide_order_id,
          amount: totals.grand_total,
          currency: paymentLinkCurrency,
          expires_at: expiresAt,
        }),
      });
      partner_payment_ui_notify_ok = nRes.ok;
      if (!nRes.ok) {
        console.error('PAYMENT_LINK_PARTNER_NOTIFY non-OK', nRes.status, await nRes.text().catch(() => ''));
      }
    } catch (e) {
      console.error('PAYMENT_LINK_PARTNER_NOTIFY failed', e);
    }
  }

  const omitPaymentUrlFromBrowser =
    Deno.env.get('PAYMENT_LINK_OMIT_URL_FROM_CLIENT') === 'true';
  const payment_portal_url_for_client = omitPaymentUrlFromBrowser
    ? null
    : external_payment_url;

  const partnerUrl = Deno.env.get('PARTNER_PAYMENT_NOTIFY_URL');
  const partnerSecret = Deno.env.get('PARTNER_PAYMENT_NOTIFY_SECRET');
  if (partnerUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (partnerSecret) {
        headers.Authorization = `Bearer ${partnerSecret}`;
      }
      const pr = await fetch(partnerUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          peptide_order_id,
          code: plainCode,
          expires_at: expiresAt,
          grand_total: totals.grand_total,
          customer: { email: customer.email, phone: customer.phone },
          enriched_lines,
          peptide_items,
          protein_items,
          totals,
          payment_url: external_payment_url,
        }),
      });
      const pj = (await pr.json().catch(() => null)) as {
        payment_url?: string;
        url?: string;
      } | null;
      const partnerPaymentUrl = pj?.payment_url ?? pj?.url ?? null;
      if (partnerPaymentUrl && !external_payment_url) {
        external_payment_url = partnerPaymentUrl;
        await supabase
          .from('checkout_secure_sessions')
          .update({
            external_payment_url,
            partner_notified_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }
    } catch (e) {
      console.error('Partner notify failed', e);
    }
  }

  const code_delivery_pending =
    (wantEmail && !emailSent) || (wantSms && !smsSent);

  const payment_link_in_delivery =
    includeLinkInMessages && deliveryEnabled && !code_delivery_pending;

  const delivery_mock =
    !deliveryEnabled ||
    (wantEmail && !emailSent) ||
    (wantSms && !smsSent);

  await supabase
    .from('checkout_secure_sessions')
    .update({ delivery_mock })
    .eq('id', sessionId);

  const exposeOtp = Deno.env.get('RETURN_CHECKOUT_OTP_IN_RESPONSE') === 'true';

  return jsonResponse({
    ok: true,
    sent_email: emailSent,
    sent_sms: smsSent,
    code_delivery_pending,
    delivery_enabled: deliveryEnabled,
    payment_portal_url: payment_portal_url_for_client,
    payment_link_created: Boolean(external_payment_url),
    payment_link_in_delivery,
    partner_payment_ui_notify_ok,
    ...(payment_link_id ? { payment_link_id } : {}),
    ...(exposeOtp ? { _debug_otp: plainCode } : {}),
  });
});
