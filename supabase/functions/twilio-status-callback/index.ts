import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function toDbStatus(raw: string): 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered' {
  const s = (raw || '').trim().toLowerCase();
  if (s === 'sent') return 'sent';
  if (s === 'delivered') return 'delivered';
  if (s === 'failed') return 'failed';
  if (s === 'undelivered') return 'undelivered';
  return 'pending';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (!supabaseUrl || !serviceKey) {
    console.error('twilio-status-callback: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response('Server misconfigured', { status: 500 });
  }

  const url = new URL(req.url);
  const expectedToken = Deno.env.get('TWILIO_STATUS_CALLBACK_TOKEN')?.trim();
  if (expectedToken) {
    const token = url.searchParams.get('token')?.trim();
    if (!token || token !== expectedToken) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const form = await req.formData();
  const messageSid = String(form.get('MessageSid') ?? '').trim();
  const messageStatus = String(form.get('MessageStatus') ?? '').trim();
  const errorCode = String(form.get('ErrorCode') ?? '').trim();
  const errorMessage = String(form.get('ErrorMessage') ?? '').trim();
  const to = String(form.get('To') ?? '').trim();
  const from = String(form.get('From') ?? '').trim();
  const trackingId = url.searchParams.get('tracking_id')?.trim() ?? null;

  if (!messageSid) {
    return new Response('Missing MessageSid', { status: 400 });
  }

  const dbStatus = toDbStatus(messageStatus);
  const sb = createClient(supabaseUrl, serviceKey);

  const finalError =
    errorCode || errorMessage
      ? [errorCode ? `Twilio ${errorCode}` : null, errorMessage || null].filter(Boolean).join(': ')
      : null;

  const metadataPatch: Record<string, unknown> = {
    callback_message_status: messageStatus || null,
    callback_error_code: errorCode || null,
    callback_to: to || null,
    callback_from: from || null,
    callback_at: new Date().toISOString(),
  };
  if (trackingId) metadataPatch.tracking_id = trackingId;

  const { data: existing, error: fetchErr } = await sb
    .from('sms_logs')
    .select('id, metadata')
    .eq('provider_message_id', messageSid)
    .maybeSingle();
  if (fetchErr) {
    console.error('twilio-status-callback fetch failed', fetchErr.message);
    return new Response('Fetch failed', { status: 500 });
  }
  if (!existing?.id) {
    console.error('twilio-status-callback missing row for sid', messageSid);
    return new Response('Row not found', { status: 404 });
  }

  const mergedMetadata =
    existing.metadata && typeof existing.metadata === 'object'
      ? { ...(existing.metadata as Record<string, unknown>), ...metadataPatch }
      : metadataPatch;

  const { error } = await sb
    .from('sms_logs')
    .update({
      status: dbStatus,
      error_message: finalError,
      delivered_at: dbStatus === 'delivered' ? new Date().toISOString() : null,
      metadata: mergedMetadata,
    })
    .eq('id', existing.id);

  if (error) {
    console.error('twilio-status-callback update failed', error.message);
    return new Response('Update failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
