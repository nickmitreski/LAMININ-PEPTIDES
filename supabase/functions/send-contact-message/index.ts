/**
 * Supabase Edge Function: send-contact-message
 *
 * Receives contact form submissions and forwards them to the support inbox via Resend.
 * Sends a confirmation auto-reply to the customer so they know we received the message.
 *
 * Required secrets (set in Supabase Dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY        – Resend API key (re_xxxx)
 *   RESEND_FROM           – Verified sender email (e.g. info@lamininpeplab.com.au)
 *   CONTACT_INBOX         – Optional override; defaults to RESEND_FROM
 *   RESEND_TEST_RECIPIENT – Optional override inbox for staging/testing
 *
 * Deploy: npx supabase functions deploy send-contact-message --no-verify-jwt
 */

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

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

const FALLBACK_INBOX = 'info@lamininpeplab.com.au';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAdminEmail(data: ContactRequest): { html: string; text: string; subject: string } {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = escapeHtml(data.phone || '(not provided)');
  const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br>');

  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 20px;">New website enquiry</h2>
    <p style="margin: 4px 0 0; color: #666; font-size: 13px;">Submitted via the laminin contact form</p>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr>
      <td style="padding: 6px 0; color: #666; width: 120px;">From</td>
      <td style="padding: 6px 0; font-weight: 600;">${safeName}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #666;">Email</td>
      <td style="padding: 6px 0;"><a href="mailto:${safeEmail}" style="color: #1a1a1a;">${safeEmail}</a></td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #666;">Phone</td>
      <td style="padding: 6px 0;">${safePhone}</td>
    </tr>
  </table>
  <div style="margin-top: 24px; padding: 16px; background: #f7f7f5; border-radius: 6px; line-height: 1.6;">
    ${safeMessage}
  </div>
  <p style="margin-top: 24px; font-size: 12px; color: #999;">
    Reply directly to this email to respond to ${safeName}.
  </p>
</div>`;

  const text = `New website enquiry

From: ${data.name}
Email: ${data.email}
Phone: ${data.phone || '(not provided)'}

Message:
${data.message}

—
Reply directly to this email to respond to ${data.name}.`;

  return {
    html,
    text,
    subject: `Website enquiry from ${data.name}`,
  };
}

function buildCustomerAutoReply(data: ContactRequest): { html: string; text: string; subject: string } {
  const safeName = escapeHtml(data.name);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br>');

  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1a1a1a;">
    <h1 style="margin: 0; font-size: 24px;">Laminin</h1>
    <p style="margin: 8px 0 0; color: #666; font-size: 14px;">Research peptides</p>
  </div>
  <div style="padding: 30px 0;">
    <h2 style="font-size: 18px; margin: 0 0 12px;">We've received your message</h2>
    <p style="color: #444; font-size: 14px; line-height: 1.6;">
      Hi ${safeName},<br><br>
      Thanks for getting in touch. A member of our team will respond within 24 hours during business days.
    </p>
  </div>
  <div style="background: #f7f7f5; border-radius: 8px; padding: 16px; line-height: 1.6; font-size: 14px; color: #444;">
    <p style="margin: 0 0 6px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your message</p>
    ${safeMessage}
  </div>
  <p style="margin-top: 24px; font-size: 13px; color: #555; line-height: 1.6;">
    If you need to add anything else, simply reply to this email.
  </p>
  <div style="text-align: center; padding: 20px 0; margin-top: 30px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
    <p style="margin: 0;">Laminin Pep Lab · info@lamininpeplab.com.au</p>
    <p style="margin: 8px 0 0; font-size: 11px; color: #bbb;">All products are intended for laboratory research use only.</p>
  </div>
</div>`;

  const text = `Hi ${data.name},

Thanks for getting in touch. A member of our team will respond within 24 hours during business days.

Your message:
${data.message}

If you need to add anything else, simply reply to this email.

— Laminin Pep Lab
info@lamininpeplab.com.au`;

  return {
    html,
    text,
    subject: 'We received your enquiry — Laminin Pep Lab',
  };
}

async function sendViaResend(payload: {
  apiKey: string;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${payload.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      reply_to: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  return { ok: res.ok, status: res.status, body: data };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  let body: ContactRequest;
  try {
    body = (await req.json()) as ContactRequest;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const message = (body.message || '').trim();

  if (!name || !email || !message) {
    return jsonResponse(
      { ok: false, error: 'Name, email, and message are required.' },
      400
    );
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ ok: false, error: 'Please provide a valid email address.' }, 400);
  }

  if (message.length > 5000) {
    return jsonResponse({ ok: false, error: 'Message is too long (maximum 5000 characters).' }, 400);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return jsonResponse({ ok: false, error: 'RESEND_API_KEY not configured' }, 500);
  }

  const fromEmail = Deno.env.get('RESEND_FROM') ?? FALLBACK_INBOX;
  const testRecipient = Deno.env.get('RESEND_TEST_RECIPIENT');
  const supportInbox = testRecipient || Deno.env.get('CONTACT_INBOX') || fromEmail || FALLBACK_INBOX;
  const customerInbox = testRecipient || email;

  const data: ContactRequest = { name, email, phone, message };

  const adminEmail = buildAdminEmail(data);
  const customerEmail = buildCustomerAutoReply(data);

  const [adminResult, customerResult] = await Promise.allSettled([
    sendViaResend({
      apiKey,
      from: fromEmail,
      to: supportInbox,
      replyTo: email,
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    }),
    sendViaResend({
      apiKey,
      from: fromEmail,
      to: customerInbox,
      subject: customerEmail.subject,
      html: customerEmail.html,
      text: customerEmail.text,
    }),
  ]);

  const adminOk = adminResult.status === 'fulfilled' && adminResult.value.ok;
  const adminError =
    adminResult.status === 'rejected'
      ? String(adminResult.reason)
      : adminResult.value.ok
      ? null
      : JSON.stringify(adminResult.value.body);

  if (!adminOk) {
    return jsonResponse(
      { ok: false, error: 'Failed to deliver your message. Please email us directly.', detail: adminError },
      502
    );
  }

  const customerOk = customerResult.status === 'fulfilled' && customerResult.value.ok;

  return jsonResponse({
    ok: true,
    admin_delivered: true,
    confirmation_sent: customerOk,
  });
});
