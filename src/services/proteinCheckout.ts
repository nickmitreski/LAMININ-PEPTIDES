import type { CartItem } from '../types/cart';
import {
  getCfgCodeForPeptideId,
  mapPeptideToProtein as mapCfgToProduct,
  type ProductMapping,
} from '../data/productMappings';
import {
  createOrderReference,
  createCustomer,
  getProductMappings,
} from './supabaseService';

const LS_ORDER_KEY = 'laminin-checkout-orders';
const LS_LAST_KEY = 'laminin-last-peptide-order-id';

export function checkoutLog(message: string, data?: unknown): void {
  const line = `[protein-checkout] ${message}`;
  if (import.meta.env.DEV) {
    console.log(line, data ?? '');
  }
}

export function generatePeptideOrderId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PEP-${y}${m}${day}-${rand}`;
}

export { mapPeptideToProtein } from '../data/productMappings';

export interface PeptideLinePayload {
  cfg_code: string;
  peptide_display_name: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface ProteinLinePayload {
  cfg_code: string;
  protein_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CheckoutPayload {
  peptide_order_id: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  peptide_items: PeptideLinePayload[];
  protein_items: ProteinLinePayload[];
  totals: { subtotal: number; shipping: number; tax: number; grand_total: number };
}

function saveOrderReferenceLocal(payload: CheckoutPayload): void {
  try {
    const raw = localStorage.getItem(LS_ORDER_KEY);
    const list: CheckoutPayload[] = raw ? JSON.parse(raw) : [];
    list.push(payload);
    localStorage.setItem(LS_ORDER_KEY, JSON.stringify(list.slice(-50)));
    localStorage.setItem(LS_LAST_KEY, payload.peptide_order_id);
  } catch {
    /* ignore quota */
  }
}

export async function createOrderReferenceRecord(
  payload: CheckoutPayload
): Promise<{ supabaseRowId: string | null }> {
  saveOrderReferenceLocal(payload);

  await createCustomer({
    email: payload.customer.email,
    first_name: payload.customer.first_name,
    last_name: payload.customer.last_name,
    phone: payload.customer.phone,
  });

  const row = await createOrderReference({
    peptide_order_id: payload.peptide_order_id,
    customer_email: payload.customer.email,
    customer_name: `${payload.customer.first_name} ${payload.customer.last_name}`.trim(),
    customer_first_name: payload.customer.first_name,
    customer_last_name: payload.customer.last_name,
    customer_phone: payload.customer.phone,
    customer_address: payload.customer.address,
    customer_city: payload.customer.city,
    customer_state: payload.customer.state,
    customer_postcode: payload.customer.postcode,
    customer_country: payload.customer.country,
    total_price: payload.totals.grand_total,
    peptide_items: payload.peptide_items,
    protein_items: payload.protein_items,
    status: 'pending',
  });

  return { supabaseRowId: row?.id ?? null };
}

/** Builds bridge line items from cart + mappings (exported for tests and diagnostics). */
export function buildCheckoutCartLines(
  items: CartItem[],
  mappings: Record<string, ProductMapping>
): {
  peptide_items: PeptideLinePayload[];
  protein_items: ProteinLinePayload[];
} {
  const peptide_items: PeptideLinePayload[] = [];
  const protein_items: ProteinLinePayload[] = [];

  for (const item of items) {
    const cfg = getCfgCodeForPeptideId(item.peptideId);
    if (!cfg) {
      throw new Error(`No CFG mapping for product: ${item.peptideId}`);
    }
    const mapped = mapCfgToProduct(cfg, mappings);
    if (!mapped) {
      throw new Error(`Unknown CFG code: ${cfg}`);
    }

    const variantSuffix = item.variantId ? ` (${item.variantId})` : '';
    const peptide_display_name = `${item.name}${variantSuffix}`;

    const unit_price = item.price;
    const line_total = unit_price * item.quantity;

    peptide_items.push({
      cfg_code: cfg,
      peptide_display_name,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price,
      line_total,
    });

    protein_items.push({
      cfg_code: cfg,
      protein_name: mapped.proteinName,
      quantity: item.quantity,
      unit_price,
      line_total,
    });
  }

  return { peptide_items, protein_items };
}

const DEFAULT_API_PATH = '/api/peptide-bridge/checkout';

async function postWithRetry(
  url: string,
  body: unknown,
  apiKey: string | undefined,
  attempts = import.meta.env.MODE === 'test' ? 1 : 3
): Promise<Response> {
  const timeoutMs = import.meta.env.MODE === 'test' ? 5_000 : 25_000;
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      return res;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      checkoutLog(`API attempt ${i + 1} failed`, lastErr.message);
      const backoffMs = import.meta.env.MODE === 'test' ? 0 : 600 * (i + 1);
      if (backoffMs > 0) {
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastErr ?? new Error('Network error');
}

export interface RedirectResult {
  redirectUrl: string;
  peptide_order_id: string;
}

/** Build checkout payload (new order id) without persisting or redirecting. */
export async function buildCheckoutPayload(
  items: CartItem[],
  customer: CheckoutPayload['customer'],
  totals: CheckoutPayload['totals']
): Promise<CheckoutPayload> {
  const mappings = await getProductMappings();
  const { peptide_items, protein_items } = buildCheckoutCartLines(items, mappings);
  const peptide_order_id = generatePeptideOrderId();
  return {
    peptide_order_id,
    customer,
    peptide_items,
    protein_items,
    totals,
  };
}

/**
 * Partner redirect only — caller must have already called `createOrderReferenceRecord(payload)`.
 */
export async function completeProteinCheckoutRedirect(
  payload: CheckoutPayload
): Promise<RedirectResult> {
  checkoutLog('order payload', payload);

  const baseUrl = (import.meta.env.VITE_PROTEIN_STORE_URL as string | undefined)
    ?.trim()
    .replace(/\/$/, '');
  /**
   * Exposed to the browser bundle — treat as publishable only. For sensitive partner secrets,
   * prefer a Supabase Edge Function (or server) that injects the key and proxies this POST.
   */
  const apiKey = import.meta.env.VITE_PROTEIN_STORE_API_KEY as string | undefined;
  const softLaunch = import.meta.env.VITE_CHECKOUT_SOFT_LAUNCH === 'true';

  const orderConfirmWithFlag = (id: string) =>
    `${window.location.origin}/order-confirmation?order_id=${encodeURIComponent(id)}&pending_payment=1`;

  if (!baseUrl || softLaunch) {
    if (softLaunch) {
      checkoutLog('VITE_CHECKOUT_SOFT_LAUNCH — skipping partner redirect');
    } else {
      checkoutLog('VITE_PROTEIN_STORE_URL missing — using return-only flow');
    }
    return {
      redirectUrl: orderConfirmWithFlag(payload.peptide_order_id),
      peptide_order_id: payload.peptide_order_id,
    };
  }

  const apiUrl = `${baseUrl}${DEFAULT_API_PATH}`;

  let redirectUrl = `${baseUrl}/checkout?ref=${encodeURIComponent(payload.peptide_order_id)}`;

  try {
    const res = await postWithRetry(apiUrl, payload, apiKey);
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as {
        redirect_url?: string;
        checkout_url?: string;
        url?: string;
      } | null;
      const fromBody =
        json?.redirect_url ?? json?.checkout_url ?? json?.url;
      if (fromBody && typeof fromBody === 'string') {
        redirectUrl = fromBody;
      }
    } else {
      checkoutLog('Protein API non-OK', res.status);
    }
  } catch (e) {
    checkoutLog('Protein API unavailable — continuing to fallback redirect', e);
  }

  return { redirectUrl, peptide_order_id: payload.peptide_order_id };
}

/**
 * Builds payload, persists order (localStorage + Supabase), POSTs to protein store, returns redirect URL.
 */
export async function redirectToProteinStore(
  items: CartItem[],
  customer: CheckoutPayload['customer'],
  totals: CheckoutPayload['totals']
): Promise<RedirectResult> {
  const payload = await buildCheckoutPayload(items, customer, totals);
  await createOrderReferenceRecord(payload);
  return completeProteinCheckoutRedirect(payload);
}

export function getLastPeptideOrderIdFromStorage(): string | null {
  try {
    return localStorage.getItem(LS_LAST_KEY);
  } catch {
    return null;
  }
}

export function getLocalOrderSnapshot(
  peptideOrderId: string
): CheckoutPayload | null {
  try {
    const raw = localStorage.getItem(LS_ORDER_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as CheckoutPayload[];
    return (
      list.find((o) => o.peptide_order_id === peptideOrderId) ?? null
    );
  } catch {
    return null;
  }
}
