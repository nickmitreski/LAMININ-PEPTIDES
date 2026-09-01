import { supabase } from '../lib/supabase';
import { createLogger } from '../lib/logger';
import {
  createPaymentTracking,
  type BankTransferPaymentData,
  type ServerTotalsResult,
} from './bankTransferPayment';

const log = createLogger('checkout');

export type CreateOrderResult = {
  success: boolean;
  trackingId?: string;
  orderId?: string;
  orderReference?: string;
  error?: string;
  serverTotals?: ServerTotalsResult;
  via?: 'edge' | 'rpc';
};

function mapServerTotals(raw: Record<string, unknown> | undefined): ServerTotalsResult {
  const serverTotal = typeof raw?.serverTotal === 'number' ? raw.serverTotal : undefined;
  return {
    available: typeof serverTotal === 'number',
    serverTotal,
    serverSubtotal: typeof raw?.serverSubtotal === 'number' ? raw.serverSubtotal : undefined,
    serverShipping: typeof raw?.serverShipping === 'number' ? raw.serverShipping : undefined,
    serverTax: typeof raw?.serverTax === 'number' ? raw.serverTax : undefined,
    serverDiscount: typeof raw?.serverDiscount === 'number' ? raw.serverDiscount : undefined,
    tamperDetected: raw?.tamperDetected === true,
    clientTotalWas: typeof raw?.clientTotalWas === 'number' ? raw.clientTotalWas : undefined,
  };
}

type FunctionInvokeError = {
  name?: string;
  message?: string;
  context?: Response | { clone?: () => Response; json?: () => Promise<unknown> };
};

async function extractFunctionErrorDetail(error: unknown): Promise<{
  message?: string;
  code?: string;
}> {
  const fnError = error as FunctionInvokeError | null;
  const context = fnError?.context;
  if (!context) return {};

  try {
    const response =
      typeof (context as Response).clone === 'function'
        ? (context as Response).clone()
        : context;
    if (typeof response.json !== 'function') return {};
    const body = (await response.json()) as { error?: unknown; detail?: unknown; code?: unknown };
    const message =
      typeof body?.error === 'string'
        ? body.error
        : typeof body?.detail === 'string'
          ? body.detail
          : undefined;
    return {
      message,
      code: typeof body?.code === 'string' ? body.code : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Prefer the create-order Edge Function (service-role + normalized tables).
 * Falls back to the legacy upsert_payment_tracking RPC only when the function
 * is genuinely unavailable. Business/database failures are returned directly
 * so the real cause is not hidden by a second write attempt.
 */
export async function createCheckoutOrder(
  data: BankTransferPaymentData
): Promise<CreateOrderResult> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { data: fnData, error: fnError } = await supabase.functions.invoke('create-order', {
      body: {
        orderReference: data.orderReference,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        cartItems: data.cartItems,
        subtotal: data.subtotal,
        shipping: data.shipping,
        tax: data.tax,
        totalAmount: data.totalAmount,
        currency: data.currency ?? 'AUD',
        discountCode: data.discountCode ?? null,
        discountAmount: data.discountAmount ?? 0,
        idempotencyKey: data.idempotencyKey ?? null,
      },
    });

    if (!fnError && fnData && (fnData as { success?: boolean }).success) {
      const r = fnData as Record<string, unknown>;
      return {
        success: true,
        trackingId: typeof r.trackingId === 'string' ? r.trackingId : undefined,
        orderId: typeof r.orderId === 'string' ? r.orderId : undefined,
        orderReference:
          typeof r.orderReference === 'string' ? r.orderReference : data.orderReference,
        serverTotals: mapServerTotals(r.serverTotals as Record<string, unknown> | undefined),
        via: 'edge',
      };
    }

    const fnBody = fnData as { error?: string; code?: string } | null;
    const detail = await extractFunctionErrorDetail(fnError);
    const errMsg =
      detail.message ?? fnBody?.error ?? fnError?.message ?? 'Order creation failed';
    const errorCode = detail.code ?? fnBody?.code;
    const notDeployed =
      errorCode === 'NOT_DEPLOYED' ||
      /not deployed|NOT_DEPLOYED|create_order not|function .* not found/i.test(errMsg) ||
      fnError?.name === 'FunctionsFetchError' ||
      fnError?.name === 'FunctionsRelayError';

    if (!notDeployed) {
      log.error('create-order edge failed', errMsg);
      return { success: false, error: errMsg, orderReference: data.orderReference, via: 'edge' };
    }
    log.warn('create-order edge unavailable, trying RPC fallback', errMsg);
  } catch (err) {
    log.warn('create-order edge exception, trying RPC fallback', err);
  }

  const legacy = await createPaymentTracking(data);
  return {
    success: legacy.success,
    trackingId: legacy.trackingId,
    error: legacy.error,
    serverTotals: legacy.serverTotals,
    orderReference: data.orderReference,
    via: 'rpc',
  };
}
