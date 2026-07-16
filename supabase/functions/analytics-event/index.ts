import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders } from '../_shared/cors.ts';
import { createRateLimiter, getClientIp } from '../_shared/rateLimit.ts';

const limiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 180,
});

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function h(req: Request, name: string): string | null {
  return req.headers.get(name)?.trim() || null;
}

function readGeo(req: Request) {
  return {
    country:
      h(req, 'cf-ipcountry') ||
      h(req, 'x-vercel-ip-country') ||
      h(req, 'x-country-code'),
    region:
      h(req, 'x-vercel-ip-country-region') ||
      h(req, 'x-region') ||
      h(req, 'cf-region'),
    city:
      h(req, 'x-vercel-ip-city') ||
      h(req, 'x-city') ||
      h(req, 'cf-ipcity'),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { ok: false, error: 'Method not allowed' }, 405);
  }

  const ip = getClientIp(req);
  if (!limiter.check(ip)) {
    return jsonResponse(req, { ok: false, error: 'Rate limited' }, 429);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(req, { ok: false, error: 'Analytics not configured' }, 500);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return jsonResponse(req, { ok: false, error: 'Invalid JSON' }, 400);
  }

  const payload = body as Record<string, unknown>;
  const sessionId = String(payload.session_id || '').slice(0, 80);
  const eventName = String(payload.event_name || '').slice(0, 80);

  if (!sessionId || !eventName) {
    return jsonResponse(req, { ok: false, error: 'Missing session_id or event_name' }, 400);
  }

  const geo = readGeo(req);
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await sb.from('analytics_events').insert({
    session_id: sessionId,
    event_name: eventName,
    path: typeof payload.path === 'string' ? payload.path.slice(0, 400) : null,
    page_title: typeof payload.page_title === 'string' ? payload.page_title.slice(0, 300) : null,
    referrer: typeof payload.referrer === 'string' ? payload.referrer.slice(0, 600) : null,
    user_agent: h(req, 'user-agent'),
    country: geo.country,
    region: geo.region,
    city: geo.city,
    timezone: typeof payload.timezone === 'string' ? payload.timezone.slice(0, 80) : null,
    local_time: typeof payload.local_time === 'string' ? payload.local_time : null,
    duration_ms: typeof payload.duration_ms === 'number' ? Math.round(payload.duration_ms) : null,
    cart_item_count:
      typeof payload.cart_item_count === 'number' ? Math.round(payload.cart_item_count) : null,
    cart_total: typeof payload.cart_total === 'number' ? payload.cart_total : null,
    element_tag: typeof payload.element_tag === 'string' ? payload.element_tag.slice(0, 40) : null,
    element_text:
      typeof payload.element_text === 'string' ? payload.element_text.slice(0, 160) : null,
    element_role:
      typeof payload.element_role === 'string' ? payload.element_role.slice(0, 80) : null,
    element_href:
      typeof payload.element_href === 'string' ? payload.element_href.slice(0, 600) : null,
    click_x: typeof payload.click_x === 'number' ? Math.round(payload.click_x) : null,
    click_y: typeof payload.click_y === 'number' ? Math.round(payload.click_y) : null,
    scroll_y: typeof payload.scroll_y === 'number' ? Math.round(payload.scroll_y) : null,
    viewport_width:
      typeof payload.viewport_width === 'number' ? Math.round(payload.viewport_width) : null,
    viewport_height:
      typeof payload.viewport_height === 'number' ? Math.round(payload.viewport_height) : null,
    metadata:
      payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  });

  if (error) {
    console.error('analytics-event insert failed', error);
    return jsonResponse(req, { ok: false, error: 'Insert failed' }, 500);
  }

  return jsonResponse(req, { ok: true });
});
