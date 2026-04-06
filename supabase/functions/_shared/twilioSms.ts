export interface TwilioSmsResult {
  ok: boolean;
  mocked: boolean;
  twilio_sid?: string;
  error?: string;
}

/** Turn +61… or 04… into whatsapp:+61… for Twilio WhatsApp API. */
export function ensureWhatsAppAddress(input: string): string {
  const t = input.trim();
  if (/^whatsapp:/i.test(t)) return t;
  let d = t.replace(/\D/g, '');
  if (d.startsWith('0') && d.length >= 10 && d.startsWith('04')) {
    d = '61' + d.slice(1);
  }
  return `whatsapp:+${d}`;
}

/**
 * Sends SMS or WhatsApp via Twilio REST API, or logs only when mock is true.
 *
 * WhatsApp (sandbox or production):
 * - Set `TWILIO_USE_WHATSAPP=true`
 * - Set `TWILIO_FROM_NUMBER=whatsapp:+14155238886` (sandbox) or your approved WhatsApp sender
 * - Do **not** use `TWILIO_MESSAGING_SERVICE_SID` (MG…) for sandbox WhatsApp; use From only.
 *
 * **Session messages:** Freeform `Body` works when the user has messaged you within the last 24h
 * (user-initiated window). **Business-initiated** first contact usually needs an approved **template**
 * (ContentSid) in production — use Twilio Console templates or add Content API later.
 */
export async function sendTwilioSms(params: {
  toE164: string;
  body: string;
  mock: boolean;
}): Promise<TwilioSmsResult> {
  if (params.mock) {
    const useWa = Deno.env.get('TWILIO_USE_WHATSAPP') === 'true';
    const to = useWa ? ensureWhatsAppAddress(params.toE164) : params.toE164;
    console.log('[MOCK_SMS_DELIVERY] to=', to, 'body=', params.body);
    return { ok: true, mocked: true };
  }

  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const useWhatsApp = Deno.env.get('TWILIO_USE_WHATSAPP') === 'true';
  const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')?.trim();
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER')?.trim();
  const twilioFrom = messagingServiceSid || fromNumber || '';

  if (!twilioSid || !twilioToken || !twilioFrom) {
    return { ok: false, mocked: false, error: 'Twilio not configured' };
  }

  if (useWhatsApp && twilioFrom.startsWith('MG')) {
    return {
      ok: false,
      mocked: false,
      error:
        'TWILIO_USE_WHATSAPP: use TWILIO_FROM_NUMBER=whatsapp:+... (not Messaging Service SID) for sandbox.',
    };
  }

  const toAddress = useWhatsApp ? ensureWhatsAppAddress(params.toE164) : params.toE164;
  const fromFinal = useWhatsApp
    ? /^whatsapp:/i.test(twilioFrom)
      ? twilioFrom
      : ensureWhatsAppAddress(twilioFrom)
    : twilioFrom;

  try {
    const auth = btoa(`${twilioSid}:${twilioToken}`);
    const form = new URLSearchParams();
    if (!useWhatsApp && twilioFrom.startsWith('MG')) {
      form.set('MessagingServiceSid', twilioFrom);
    } else {
      form.set('From', fromFinal);
    }
    form.set('To', toAddress);
    form.set('Body', params.body);
    const tr = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const txt = await tr.text();
    if (!tr.ok) {
      console.error('Twilio non-OK', tr.status, txt);
      return { ok: false, mocked: false, error: txt.slice(0, 500) };
    }
    const j = JSON.parse(txt) as { sid?: string };
    return { ok: true, mocked: false, twilio_sid: j.sid };
  } catch (e) {
    console.error('Twilio failed', e);
    return {
      ok: false,
      mocked: false,
      error: e instanceof Error ? e.message : 'Twilio request failed',
    };
  }
}
