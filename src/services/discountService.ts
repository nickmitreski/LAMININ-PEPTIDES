import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DiscountValidation {
  valid: boolean;
  error?: string;
  discount_code_id?: string;
  code?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount?: number;
  description?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_redemptions: number | null;
  redemption_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscountRedemption {
  id: string;
  discount_code_id: string;
  order_reference: string;
  customer_email: string | null;
  discount_amount: number;
  created_at: string;
  // joined
  discount_code?: { code: string; discount_type: string; discount_value: number };
}

/** Validate a discount code against a subtotal. Called from checkout. */
export async function validateDiscountCode(
  code: string,
  subtotal: number
): Promise<DiscountValidation> {
  if (!supabase) return { valid: false, error: 'Service unavailable' };

  const { data, error } = await supabase.rpc('validate_discount_code', {
    p_code: code.trim(),
    p_subtotal: subtotal,
  });

  if (error) {
    console.error('[discount] validate error', error.message, error.code);
    return { valid: false, error: `Could not validate code (${error.code ?? 'network'})` };
  }

  return data as DiscountValidation;
}

/** Record a redemption after successful order. Called from checkout. */
export async function redeemDiscountCode(params: {
  discountCodeId: string;
  orderReference: string;
  customerEmail?: string;
  discountAmount: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Service unavailable' };

  const { data, error } = await supabase.rpc('redeem_discount_code', {
    p_discount_code_id: params.discountCodeId,
    p_order_reference: params.orderReference,
    p_customer_email: params.customerEmail || null,
    p_discount_amount: params.discountAmount,
  });

  if (error) {
    console.error('[discount] redeem error', error.message, error.code);
    return { success: false, error: `Could not redeem discount (${error.code ?? 'network'})` };
  }

  const result = data as { success?: boolean; error?: string };
  if (result && typeof result.success === 'boolean') {
    return {
      success: result.success,
      error: result.success ? undefined : result.error || 'Redemption declined',
    };
  }
  return { success: false, error: 'Invalid response from redeem' };
}

// ---- Admin functions ----

/** Admin: Get all discount codes */
export async function getAllDiscountCodes(
  client: SupabaseClient | null = supabase
): Promise<DiscountCode[]> {
  if (!client) {
    console.error('[discount] getAllDiscountCodes: no client');
    return [];
  }

  const { data, error } = await client
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[discount] getAllDiscountCodes failed:', error.message, error.code);
    return [];
  }

  return (data ?? []) as DiscountCode[];
}

/** Admin: Create a new discount code */
export async function createDiscountCode(
  code: Omit<DiscountCode, 'id' | 'redemption_count' | 'created_at' | 'updated_at'>,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client
    .from('discount_codes')
    .insert({
      code: code.code.toUpperCase().trim(),
      description: code.description,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_order_amount: code.min_order_amount || 0,
      max_discount_amount: code.max_discount_amount,
      max_redemptions: code.max_redemptions,
      valid_from: code.valid_from,
      valid_until: code.valid_until,
      is_active: code.is_active,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[discount] createDiscountCode', error);
    if (error.code === '23505') {
      return { success: false, error: 'A code with this name already exists' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/** Admin: Update a discount code */
export async function updateDiscountCode(
  id: string,
  updates: Partial<Pick<DiscountCode, 'code' | 'description' | 'discount_type' | 'discount_value' | 'min_order_amount' | 'max_discount_amount' | 'max_redemptions' | 'valid_from' | 'valid_until' | 'is_active'>>,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.code !== undefined) payload.code = updates.code.toUpperCase().trim();
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.discount_type !== undefined) payload.discount_type = updates.discount_type;
  if (updates.discount_value !== undefined) payload.discount_value = updates.discount_value;
  if (updates.min_order_amount !== undefined) payload.min_order_amount = updates.min_order_amount;
  if (updates.max_discount_amount !== undefined) payload.max_discount_amount = updates.max_discount_amount;
  if (updates.max_redemptions !== undefined) payload.max_redemptions = updates.max_redemptions;
  if (updates.valid_from !== undefined) payload.valid_from = updates.valid_from;
  if (updates.valid_until !== undefined) payload.valid_until = updates.valid_until;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;

  const { error } = await client
    .from('discount_codes')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('[discount] updateDiscountCode', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** Admin: Delete a discount code */
export async function deleteDiscountCode(
  id: string,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { error } = await client
    .from('discount_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[discount] deleteDiscountCode', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** Admin: Get redemptions for a specific discount code */
export async function getRedemptionsForCode(
  discountCodeId: string,
  client: SupabaseClient | null = supabase
): Promise<DiscountRedemption[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('discount_redemptions')
    .select('*, discount_code:discount_codes(code, discount_type, discount_value)')
    .eq('discount_code_id', discountCodeId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[discount] getRedemptionsForCode', error);
    return [];
  }

  return data as unknown as DiscountRedemption[];
}

/** Admin: Get all redemptions */
export async function getAllRedemptions(
  client: SupabaseClient | null = supabase
): Promise<DiscountRedemption[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('discount_redemptions')
    .select('*, discount_code:discount_codes(code, discount_type, discount_value)')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) {
    console.error('[discount] getAllRedemptions', error);
    return [];
  }

  return data as unknown as DiscountRedemption[];
}

/** Admin: redemptions in a date range (monthly export / affiliate reporting) */
export async function getRedemptionsInRange(
  startIso: string,
  endIsoExclusive: string,
  client: SupabaseClient | null = supabase
): Promise<DiscountRedemption[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('discount_redemptions')
    .select('*, discount_code:discount_codes(code, discount_type, discount_value)')
    .gte('created_at', startIso)
    .lt('created_at', endIsoExclusive)
    .order('created_at', { ascending: true })
    .limit(50000);

  if (error || !data) {
    console.error('[discount] getRedemptionsInRange', error);
    return [];
  }

  return data as unknown as DiscountRedemption[];
}
