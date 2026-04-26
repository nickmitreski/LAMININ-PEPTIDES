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

/** Bank details — same values the email template uses */
const BANK_BSB = '013402';
const BANK_ACCOUNT = '807892935';
const BANK_NAME = 'MJCA Group';

interface OrderEmailRequest {
  order_reference: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  currency?: string;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function buildEmailHtml(vars: {
  customer_name: string;
  order_reference: string;
  total_amount: string;
  bsb: string;
  account_number: string;
  account_name: string;
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

  <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">Processing</p>
    <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">
      Orders are processed once payment has been received and confirmed. We will notify you when your order is being prepared for shipment.
    </p>
  </div>

  <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #999;">
      Questions? Contact us at <a href="mailto:support@lamininpeptides.com" style="color: #1a1a1a;">support@lamininpeptides.com</a>
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

PROCESSING
Orders are processed once payment has been received and confirmed. We will notify you when your order is being prepared for shipment.

Questions? Contact us at support@lamininpeptides.com`;
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

  const { order_reference, customer_email, customer_name, total_amount, currency = 'AUD' } = body;

  if (!order_reference || !customer_email || !total_amount) {
    return jsonResponse({ ok: false, error: 'Missing required fields: order_reference, customer_email, total_amount' }, 400);
  }

  // Check secrets
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    return jsonResponse({ ok: false, error: 'RESEND_API_KEY not configured' }, 500);
  }

  const fromEmail = Deno.env.get('RESEND_FROM') ?? 'onboarding@resend.dev';
  const testRecipientOverride = Deno.env.get('RESEND_TEST_RECIPIENT');
  const routing = resolveEmailRouting(customer_email, testRecipientOverride);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Build email content
  const amountFormatted = formatMoney(total_amount, currency);
  const templateVars = {
    customer_name: customer_name || 'Customer',
    order_reference,
    total_amount: amountFormatted,
    bsb: BANK_BSB,
    account_number: BANK_ACCOUNT,
    account_name: BANK_NAME,
  };

  const subject = `Laminin - Payment Instructions for Order ${order_reference}`;
  const htmlBody = buildEmailHtml(templateVars);
  const textBody = buildEmailText(templateVars);

  // Send via Resend
  let resendId: string | null = null;
  let emailStatus: 'sent' | 'failed' = 'failed';
  let errorMessage: string | null = null;

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

    const resendData = await resendRes.json().catch(() => null) as { id?: string; message?: string } | null;

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

  // Log to email_logs table
  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.rpc('log_email_sent', {
        p_template_name: 'payment_instructions',
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
      // Don't fail the request if logging fails — email was still sent
      console.error('Failed to log email:', logErr);
    }
  }

  return jsonResponse({
    ok: emailStatus === 'sent',
    email_sent: emailStatus === 'sent',
    resend_id: resendId,
    delivered_to: routing.deliveryEmail,
    routed_to_test_inbox: routing.routedToTestInbox,
    error: errorMessage,
  });
});
