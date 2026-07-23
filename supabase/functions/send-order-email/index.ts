/**
 * Supabase Edge Function: send-order-email
 *
 * Sends payment instruction emails via Resend after order creation.
 * Logs every email to the `email_logs` table.
 *
 * Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY       – Resend API key (re_xxxx)
 *   RESEND_FROM          – Verified sender email (e.g. orders@lamininpeptides.com)
 *   RESEND_TEST_RECIPIENT – Optional override inbox for staging/testing
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN – optional; WhatsApp order alerts
 *   TWILIO_WHATSAPP_FROM – e.g. whatsapp:+61400000000 (Twilio WhatsApp sender)
 *     Alternate secret name: TWILIO_FROM_NUMBER
 *   TWILIO_ORDER_NOTIFY_TO – e.g. whatsapp:+61400000001 (your phone for alerts)
 *     Alternate secret name: ADMIN_WHATSAPP_NUMBER
 *   SUPABASE_URL         – Auto-provided
 *   SUPABASE_SERVICE_ROLE_KEY – Auto-provided
 *
 * Deploy: npx supabase functions deploy send-order-email --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { resolveEmailRouting } from './recipientRouting.ts';

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

/**
 * Bank details — fallback values used when the public.bank_details row is
 * missing (pre-migration) or when the supabase client init fails. The
 * authoritative copy lives in the DB and is editable from /admin/settings.
 */
const FALLBACK_BANK_BSB = '013402';
const FALLBACK_BANK_ACCOUNT = '807892935';
const FALLBACK_BANK_NAME = 'MJCA Group';

interface ResolvedBankDetails {
  bsb: string;
  account_number: string;
  account_name: string;
}

async function loadBankDetails(
  supabaseUrl: string | undefined,
  serviceKey: string | undefined
): Promise<ResolvedBankDetails> {
  if (!supabaseUrl || !serviceKey) {
    return {
      bsb: FALLBACK_BANK_BSB,
      account_number: FALLBACK_BANK_ACCOUNT,
      account_name: FALLBACK_BANK_NAME,
    };
  }
  try {
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await sb
      .from('bank_details')
      .select('bsb, account_number, account_name')
      .eq('singleton', true)
      .maybeSingle();
    if (error || !data) {
      return {
        bsb: FALLBACK_BANK_BSB,
        account_number: FALLBACK_BANK_ACCOUNT,
        account_name: FALLBACK_BANK_NAME,
      };
    }
    return {
      bsb: String(data.bsb ?? FALLBACK_BANK_BSB),
      account_number: String(data.account_number ?? FALLBACK_BANK_ACCOUNT),
      account_name: String(data.account_name ?? FALLBACK_BANK_NAME),
    };
  } catch {
    return {
      bsb: FALLBACK_BANK_BSB,
      account_number: FALLBACK_BANK_ACCOUNT,
      account_name: FALLBACK_BANK_NAME,
    };
  }
}

interface OrderEmailRequest {
  order_reference: string;
  /** Optional — payment instructions email is skipped when missing or invalid */
  customer_email?: string;
  customer_name: string;
  total_amount: number;
  currency?: string;
  /** Customer phone (shown in admin WhatsApp alert) */
  customer_phone?: string;
  /** invoice | payment_reminder | payment_followup */
  email_type?: string;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Payment deadline policy. Customers have 48 hours to complete the bank
 * transfer; after that the order is treated as abandoned and admin can cancel.
 * The deadline is shown in the customer's local time on the storefront, but in
 * the email we display Australian Eastern time because that's where the bank
 * is. Keep this in sync with `PAYMENT_DEADLINE_HOURS` in src/lib/shippingPolicy.ts.
 */
const PAYMENT_DEADLINE_HOURS = 48;

function formatDeadlineAEST(fromIso: string | undefined): string {
  const base = fromIso ? new Date(fromIso) : new Date();
  const due = new Date(base.getTime() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000);
  try {
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Australia/Sydney',
      timeZoneName: 'short',
    }).format(due);
  } catch {
    return due.toISOString();
  }
}

function buildEmailHtml(vars: {
  customer_name: string;
  order_reference: string;
  total_amount: string;
  bsb: string;
  account_number: string;
  account_name: string;
  payment_deadline: string;
}): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1a1a1a;">
    <h1 style="margin: 0; font-size: 24px;">Laminin</h1>
    <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Research Peptides</p>
  </div>

  <div style="padding: 30px 0;">
    <h2 style="font-size: 20px; margin: 0 0 10px;">Payment Instructions</h2>
    <p style="color: #444; font-size: 14px; line-height: 1.6;">
      Hi ${vars.customer_name},<br><br>
      Thank you for your order. Please complete your payment using the details below.
    </p>
  </div>

  <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Order Reference</p>
    <p style="margin: 0; font-size: 22px; font-weight: bold; font-family: monospace;">${vars.order_reference}</p>
    <p style="margin: 10px 0 0; font-size: 12px; color: #555;"><strong>Important:</strong> Use this reference when making your payment</p>
  </div>

  <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 5px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Amount to Pay</p>
    <p style="margin: 0; font-size: 28px; font-weight: bold;">${vars.total_amount}</p>
  </div>

  <div style="margin: 20px 0;">
    <h3 style="font-size: 16px; margin: 0 0 15px;">Bank Account Details</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e5e5; background: #fafafa; font-size: 12px; color: #666; text-transform: uppercase; width: 140px;">BSB</td>
        <td style="padding: 12px; border: 1px solid #e5e5e5; font-size: 14px; font-weight: 600; font-family: monospace;">${vars.bsb}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e5e5; background: #fafafa; font-size: 12px; color: #666; text-transform: uppercase;">Account Number</td>
        <td style="padding: 12px; border: 1px solid #e5e5e5; font-size: 14px; font-weight: 600; font-family: monospace;">${vars.account_number}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e5e5; background: #fafafa; font-size: 12px; color: #666; text-transform: uppercase;">Account Name</td>
        <td style="padding: 12px; border: 1px solid #e5e5e5; font-size: 14px; font-weight: 600;">${vars.account_name}</td>
      </tr>
    </table>
  </div>

  <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991b1b;">Reference Requirement</p>
    <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.5;">
      When completing payment, include your <strong>invoice reference number only</strong> as the payment reference. No additional information is to be included. Payments submitted without the correct reference may result in delays.
    </p>
  </div>

  <div style="background: #fffbeb; border: 2px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #92400e;">Please complete payment within ${PAYMENT_DEADLINE_HOURS} hours</p>
    <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
      Payment due by <strong>${vars.payment_deadline}</strong>.<br>
      Orders without payment by this time may be cancelled. If you need more time, reply to this email and we'll hold your order.
    </p>
  </div>

  <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">Processing</p>
    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">
      Orders are processed once payment has been received and confirmed. We will notify you when your order is being prepared for shipment.
    </p>
  </div>

  <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999;">
      Questions? Contact us at <a href="mailto:info@lamininpeplab.com.au" style="color: #1a1a1a;">info@lamininpeplab.com.au</a>
    </p>
    <p style="margin: 8px 0 0; font-size: 11px; color: #bbb;">All products are intended for laboratory research use only.</p>
  </div>
</div>`;
}

function buildEmailText(vars: {
  customer_name: string;
  order_reference: string;
  total_amount: string;
  bsb: string;
  account_number: string;
  account_name: string;
  payment_deadline: string;
}): string {
  return `PAYMENT INSTRUCTIONS

Hi ${vars.customer_name},

Thank you for your order. Please complete your payment using the details below.

YOUR ORDER REFERENCE: ${vars.order_reference}
Important: Use this reference when making your payment

AMOUNT TO PAY: ${vars.total_amount}

BANK ACCOUNT DETAILS
BSB: ${vars.bsb}
Account Number: ${vars.account_number}
Account Name: ${vars.account_name}

REFERENCE REQUIREMENT
When completing payment, include your invoice reference number only as the payment reference. No additional information is to be included.

PAYMENT DEADLINE
Please complete payment within ${PAYMENT_DEADLINE_HOURS} hours.
Payment due by ${vars.payment_deadline}.
Orders without payment by this time may be cancelled. If you need more time, reply to this email and we'll hold your order.

PROCESSING
Orders are processed once payment has been received and confirmed. We will notify you when your order is being prepared for shipment.

Questions? Contact us at info@lamininpeplab.com.au`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Twilio WhatsApp API expects whatsapp:+E164; accept bare +61… and legacy secret names. */
function normalizeWhatsAppAddress(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (s.toLowerCase().startsWith('whatsapp:')) return s;
  if (s.startsWith('+')) return `whatsapp:${s}`;
  return s;
}

async function sendTwilioWhatsAppOrderAlert(opts: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const url =
    `https://api.twilio.com/2010-04-01/Accounts/${opts.accountSid}/Messages.json`;
  const auth = btoa(`${opts.accountSid}:${opts.authToken}`);
  const params = new URLSearchParams({
    From: opts.from,
    To: opts.to,
    Body: opts.body,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = (await res.json().catch(() => null)) as {
    sid?: string;
    message?: string;
    code?: number;
  } | null;

  if (!res.ok) {
    const msg = data?.message || `Twilio HTTP ${res.status}`;
    console.error('Twilio WhatsApp error:', msg, data);
    return { ok: false, error: msg };
  }
  return { ok: true, sid: data?.sid };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  // Parse request
  let body: OrderEmailRequest;
  try {
    body = (await req.json()) as OrderEmailRequest;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const {
    order_reference,
    customer_email,
    customer_name,
    customer_phone,
    total_amount,
    currency = 'AUD',
    email_type = 'invoice',
  } = body;

  if (
    !order_reference ||
    total_amount === undefined ||
    total_amount === null ||
    Number.isNaN(Number(total_amount))
  ) {
    return jsonResponse({ ok: false, error: 'Missing required fields: order_reference, total_amount' }, 400);
  }

  const trimmedEmail = typeof customer_email === 'string' ? customer_email.trim() : '';
  const shouldSendEmail = EMAIL_RE.test(trimmedEmail);

  if (shouldSendEmail && !Deno.env.get('RESEND_API_KEY')) {
    return jsonResponse({ ok: false, error: 'RESEND_API_KEY not configured' }, 500);
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM') ?? 'onboarding@resend.dev';
  const testRecipientOverride = Deno.env.get('RESEND_TEST_RECIPIENT');
  const routing = shouldSendEmail
    ? resolveEmailRouting(trimmedEmail, testRecipientOverride)
    : {
        deliveryEmail: '',
        routedToTestInbox: false,
      };
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const amountFormatted = formatMoney(Number(total_amount), currency);
  // Use `now` rather than the order's created_at so the deadline always reflects
  // "from when the customer reads this email". The function fires synchronously
  // after order creation so the drift is sub-second.
  const paymentDeadline = formatDeadlineAEST(new Date().toISOString());
  const bankDetails = await loadBankDetails(supabaseUrl, serviceKey);
  const templateVars = {
    customer_name: customer_name || 'Customer',
    order_reference,
    total_amount: amountFormatted,
    bsb: bankDetails.bsb,
    account_number: bankDetails.account_number,
    account_name: bankDetails.account_name,
    payment_deadline: paymentDeadline,
  };

  const subject =
    email_type === 'payment_reminder' || email_type === 'payment_followup'
      ? `Laminin - Payment reminder for Order ${order_reference}`
      : `Laminin - Payment Instructions for Order ${order_reference}`;
  const htmlBody = buildEmailHtml(templateVars);
  const textBody = buildEmailText(templateVars);

  let resendId: string | null = null;
  let emailStatus: 'sent' | 'failed' | 'skipped' = shouldSendEmail ? 'failed' : 'skipped';
  let errorMessage: string | null = null;

  if (shouldSendEmail && resendKey) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [routing.deliveryEmail],
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      const resendData =
        await resendRes.json().catch(() => null) as { id?: string; message?: string } | null;

      if (resendRes.ok && resendData?.id) {
        resendId = resendData.id;
        emailStatus = 'sent';
      } else {
        errorMessage = resendData?.message || `Resend returned ${resendRes.status}`;
        console.error('Resend error:', errorMessage);
      }
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : 'Resend request failed';
      console.error('Resend exception:', e);
    }
  }

  if (supabaseUrl && serviceKey && shouldSendEmail && routing.deliveryEmail) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.rpc('log_email_sent', {
        p_template_name:
          email_type === 'payment_reminder' || email_type === 'payment_followup'
            ? 'payment_reminder'
            : 'payment_instructions',
        p_recipient_email: routing.deliveryEmail,
        p_recipient_name: customer_name || null,
        p_subject: subject,
        p_body_html: htmlBody,
        p_body_text: textBody,
        p_status: emailStatus,
        p_resend_id: resendId,
        p_order_reference: order_reference,
        p_error_message: errorMessage,
      });
    } catch (logErr) {
      console.error('Failed to log email:', logErr);
    }
  }

  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFromRaw =
    Deno.env.get('TWILIO_WHATSAPP_FROM')?.trim() ||
    Deno.env.get('TWILIO_FROM_NUMBER')?.trim() ||
    '';
  const twilioToRaw =
    Deno.env.get('TWILIO_ORDER_NOTIFY_TO')?.trim() ||
    Deno.env.get('ADMIN_WHATSAPP_NUMBER')?.trim() ||
    '';
  const twilioFrom = normalizeWhatsAppAddress(twilioFromRaw);
  const twilioTo = normalizeWhatsAppAddress(twilioToRaw);
  const twilioConfigured = !!(
    twilioSid?.trim() &&
    twilioToken?.trim() &&
    twilioFrom &&
    twilioTo
  );

  let whatsappSent = false;
  let whatsappError: string | null = null;
  let whatsappSid: string | undefined;

  const phoneLine =
    typeof customer_phone === 'string' && customer_phone.trim()
      ? customer_phone.trim()
      : '—';

  const waBody = [
    `New order ${order_reference}`,
    customer_name?.trim() || 'Customer',
    `${amountFormatted} ${currency}`,
    `Phone: ${phoneLine}`,
    `Email: ${shouldSendEmail ? trimmedEmail : 'not provided'}`,
  ].join('\n');

  if (twilioConfigured && twilioSid && twilioToken && twilioFrom && twilioTo) {
    const wa = await sendTwilioWhatsAppOrderAlert({
      accountSid: twilioSid,
      authToken: twilioToken,
      from: twilioFrom,
      to: twilioTo,
      body: waBody,
    });
    whatsappSent = wa.ok;
    whatsappError = wa.error ?? null;
    whatsappSid = wa.sid;
    if (!wa.ok) console.error('WhatsApp notify failed:', wa.error);
  }

  const emailOk = !shouldSendEmail || emailStatus === 'sent';
  const whatsappOk = !twilioConfigured || whatsappSent;

  const ok = emailOk && whatsappOk;

  return jsonResponse({
    ok,
    email_sent: emailStatus === 'sent',
    email_skipped: emailStatus === 'skipped',
    resend_id: resendId,
    delivered_to: shouldSendEmail ? routing.deliveryEmail : null,
    routed_to_test_inbox: shouldSendEmail ? routing.routedToTestInbox : false,
    error: errorMessage,
    whatsapp_sent: whatsappSent,
    whatsapp_sid: whatsappSid ?? null,
    whatsapp_error: whatsappError,
    twilio_configured: twilioConfigured,
  });
});
