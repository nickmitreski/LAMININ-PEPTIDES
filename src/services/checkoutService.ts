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

/**
 * Prefer the create-order Edge Function (service-role + normalized tables).
 * Falls back to the legacy upsert_payment_tracking RPC when the function or
 * migration is not deployed yet.
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

    const errMsg = fnError?.message ?? (fnData as { error?: string })?.error ?? '';
    const notDeployed =
      /not deployed|NOT_DEPLOYED|create_order not/i.test(errMsg) ||
      fnError?.name === 'FunctionsFetchError';

    if (!notDeployed && errMsg) {
      log.warn('create-order edge failed, trying RPC fallback', errMsg);
    }
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
