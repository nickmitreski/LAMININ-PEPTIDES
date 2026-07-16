import type { SupabaseClient } from '@supabase/supabase-js';
import { CFG_CODE_TO_PEPTIDE_ID } from '../data/productMappings';
import { supabase } from '../lib/supabase';

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export async function listCollections(
  client: SupabaseClient | null = supabase,
  includeInactive = false
): Promise<Collection[]> {
  if (!client) return [];
  let q = client.from('collections').select('*').order('sort_order', { ascending: true });
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error || !data) {
    console.error('[supabase] listCollections', error);
    return [];
  }
  return data as Collection[];
}

export async function adminListAllCollections(
  client: SupabaseClient | null
): Promise<Collection[]> {
  if (!client) return [];
  const { data, error } = await client
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data as Collection[];
}

export async function createCollectionRow(
  client: SupabaseClient | null,
  input: { slug: string; name: string; description?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!client) return { success: false, error: 'No client' };
  const slug = input.slug.trim().toLowerCase().replace(/\s+/g, '-');
  const { data, error } = await client
    .from('collections')
    .insert({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select('id')
    .single();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, id: data.id as string };
}

export async function updateCollectionRow(
  client: SupabaseClient | null,
  id: string,
  updates: { name?: string; description?: string | null; is_active?: boolean; sort_order?: number }
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;
  if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
  const { error } = await client.from('collections').update(payload).eq('id', id);
  if (error) {
    console.error('[supabase] updateCollectionRow', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function setProductCollections(
  productId: string,
  collectionIds: string[],
  client: SupabaseClient | null
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };

  const { data, error } = await client.rpc('set_product_collections', {
    p_product_id: productId,
    p_collection_ids: collectionIds,
  });

  if (error) {
    console.error('[supabase] setProductCollections', error);
    return { success: false, error: error.message };
  }

  const r = data as { success?: boolean; error?: string };
  if (r?.success === false) return { success: false, error: r.error };
  return { success: true };
}

export async function getCollectionIdsForProduct(
  productId: string,
  client: SupabaseClient | null
): Promise<string[]> {
  if (!client) return [];
  const { data, error } = await client
    .from('product_collection_members')
    .select('collection_id')
    .eq('product_id', productId);
  if (error || !data) return [];
  return data.map((r) => r.collection_id as string);
}

export async function getCollectionMetaBySlug(
  slug: string
): Promise<{ name: string; description: string | null } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('collections')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return { name: data.name as string, description: (data.description as string | null) ?? null };
}

export async function getPeptideIdsInCollectionSlug(slug: string): Promise<string[]> {
  if (!supabase) return [];
  const { data: col, error: cErr } = await supabase
    .from('collections')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (cErr || !col) return [];

  const { data: members, error: mErr } = await supabase
    .from('product_collection_members')
    .select('product_id')
    .eq('collection_id', col.id);
  if (mErr || !members?.length) return [];

  const ids = members.map((m) => m.product_id as string);
  const { data: pms, error: pErr } = await supabase
    .from('product_mappings')
    .select('cfg_code')
    .in('id', ids);
  if (pErr || !pms) return [];

  const out: string[] = [];
  for (const row of pms) {
    const cfg = row.cfg_code as string;
    const pid = CFG_CODE_TO_PEPTIDE_ID[cfg] ?? cfg.toLowerCase();
    out.push(pid);
  }
  return out;
}
