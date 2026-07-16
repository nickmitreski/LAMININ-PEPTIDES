/**
 * Server-authoritative checkout via Edge Function.
 *
 * Deploy: npx supabase functions deploy create-order --no-verify-jwt
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders } from '../_shared/cors.ts';
import { createRateLimiter, getClientIp } from '../_shared/rateLimit.ts';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function isValidEmail(email: string): boolean {
  const t = email.trim();
  return t.length > 0 && EMAIL_RE.test(t);
}

function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { success: false, error: 'Method not allowed' }, 405);
  }

  const ip = getClientIp(req);
  if (!limiter.check(ip)) {
    return jsonResponse(req, { success: false, error: 'Rate limited' }, 429);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(req, { success: false, error: 'Checkout not configured' }, 500);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return jsonResponse(req, { success: false, error: 'Invalid JSON' }, 400);
  }

  const payload = body as Record<string, unknown>;
  const orderReference = String(payload.orderReference ?? '').trim().slice(0, 40);
  const customerEmail = String(payload.customerEmail ?? '').trim().slice(0, 200);
  const customerName = String(payload.customerName ?? '').trim().slice(0, 200);
  const customerPhone = String(payload.customerPhone ?? '').trim().slice(0, 40);
  const cartItems = payload.cartItems;
  const idempotencyKey = String(payload.idempotencyKey ?? '').trim().slice(0, 80) || null;

  if (!orderReference || !customerName) {
    return jsonResponse(req, { success: false, error: 'Missing order reference or customer name' }, 400);
  }
  if (!isValidEmail(customerEmail)) {
    return jsonResponse(req, { success: false, error: 'Valid email required' }, 400);
  }
  if (!isValidPhone(customerPhone)) {
    return jsonResponse(req, { success: false, error: 'Valid phone required' }, 400);
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return jsonResponse(req, { success: false, error: 'Cart is empty' }, 400);
  }

  const customerAddress = payload.customerAddress;
  if (!customerAddress || typeof customerAddress !== 'object') {
    return jsonResponse(req, { success: false, error: 'Shipping address required' }, 400);
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.rpc('create_order', {
    p_order_reference: orderReference,
    p_customer_email: customerEmail,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_address: customerAddress,
    p_cart_items: cartItems,
    p_subtotal: Number(payload.subtotal ?? 0),
    p_shipping: Number(payload.shipping ?? 0),
    p_tax: Number(payload.tax ?? 0),
    p_total_amount: Number(payload.totalAmount ?? 0),
    p_currency: String(payload.currency ?? 'AUD').slice(0, 8),
    p_discount_code: payload.discountCode ? String(payload.discountCode).slice(0, 64) : null,
    p_discount_amount: Number(payload.discountAmount ?? 0),
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const msg = error.message ?? 'create_order failed';
    if (/function .* does not exist/i.test(msg) || error.code === '42883') {
      return jsonResponse(req, { success: false, error: 'create_order not deployed', code: 'NOT_DEPLOYED' }, 503);
    }
    return jsonResponse(req, { success: false, error: msg }, 500);
  }

  const result = data as Record<string, unknown> | null;
  if (!result?.success) {
    return jsonResponse(req, { success: false, error: String(result?.error ?? 'Order creation failed') }, 400);
  }

  return jsonResponse(req, {
    success: true,
    trackingId: result.tracking_id,
    orderId: result.order_id,
    orderReference: result.order_reference ?? orderReference,
    replay: result.replay === true,
    serverTotals: {
      available: typeof result.server_total === 'number',
      serverTotal: result.server_total,
      serverSubtotal: result.server_subtotal,
      serverShipping: result.server_shipping,
      serverTax: result.server_tax,
      serverDiscount: result.server_discount,
      tamperDetected: result.tamper_detected === true,
      clientTotalWas: result.client_total_was,
    },
  });
});
