import type { SupabaseClient } from '@supabase/supabase-js';
import { appendImageCacheVersion } from '../lib/imageUrl';
import { supabase } from '../lib/supabase';
import { createLogger } from '../lib/logger';
import { CFG_CODE_TO_PEPTIDE_ID } from '../data/productMappings';
import { logAdminAction } from './auditLog';
import {
  getCollectionIdsForProduct,
  setProductCollections,
} from './collectionsService';

const log = createLogger('products');

export async function getAllProductMappings(
  client: SupabaseClient | null = supabase
): Promise<
  Array<{
    id: string;
    cfg_code: string;
    peptide_name: string;
    protein_name: string;
    price: number;
    is_active: boolean;
    compare_at_price: number | null;
    sale_label: string | null;
    sort_order: number;
    description: string | null;
    category: string | null;
    stock_quantity: number;
    coa_link_url: string | null;
    created_at: string;
    updated_at: string;
  }>
> {
  if (!client) return [];

  const { data, error } = await client
    .from('product_mappings')
    .select('*')
    .order('cfg_code', { ascending: true });

  if (error || !data) {
    log.error('getAllProductMappings failed', error);
    return [];
  }

  return data;
}

export type AdminProductWithImages = {
  id: string;
  cfg_code: string;
  peptide_name: string;
  protein_name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  is_active: boolean;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
  track_inventory?: boolean | null;
  compare_at_price?: number | null;
  sale_label?: string | null;
  sort_order?: number | null;
  overview_text?: string | null;
  specifications_text?: string | null;
  analytical_text?: string | null;
  coa_link_url?: string | null;
  product_type?: string | null;
  bundle_items?: unknown;
  images?: Array<Record<string, unknown>> | null;
};

export async function getProductWithImages(
  productId: string,
  client: SupabaseClient | null = supabase
): Promise<{
  success: boolean;
  product?: AdminProductWithImages;
  error?: string;
}> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('get_product_with_images', {
    p_product_id: productId,
  });

  if (error) {
    log.error('getProductWithImages failed', error);
    return { success: false, error: error.message };
  }

  return data as {
    success: boolean;
    product?: AdminProductWithImages;
    error?: string;
  };
}

export async function updateProduct(
  productId: string,
  updates: {
    peptide_name?: string;
    protein_name?: string;
    description?: string;
    price?: number;
    category?: string;
    is_active?: boolean;
    stock_quantity?: number;
    low_stock_threshold?: number;
    track_inventory?: boolean;
    compare_at_price?: number | null;
    sale_label?: string | null;
    sort_order?: number;
    clear_compare_at_price?: boolean;
    clear_sale_label?: boolean;
    overview_text?: string | null;
    specifications_text?: string | null;
    analytical_text?: string | null;
    coa_link_url?: string | null;
    clear_coa_link_url?: boolean;
    product_type?: 'standard' | 'bundle';
    bundle_items?: unknown;
  },
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('update_product', {
    p_product_id: productId,
    p_peptide_name: updates.peptide_name || null,
    p_protein_name: updates.protein_name || null,
    p_description: updates.description || null,
    p_price: updates.price ?? null,
    p_category: updates.category || null,
    p_is_active: updates.is_active !== undefined ? updates.is_active : null,
    p_stock_quantity: updates.stock_quantity !== undefined ? updates.stock_quantity : null,
    p_low_stock_threshold: updates.low_stock_threshold ?? null,
    p_track_inventory: updates.track_inventory !== undefined ? updates.track_inventory : null,
    p_compare_at_price: updates.compare_at_price ?? null,
    p_sale_label: updates.sale_label ?? null,
    p_sort_order: updates.sort_order ?? null,
    p_clear_compare_at_price: updates.clear_compare_at_price ?? false,
    p_clear_sale_label: updates.clear_sale_label ?? false,
    p_overview_text: updates.overview_text ?? null,
    p_specifications_text: updates.specifications_text ?? null,
    p_analytical_text: updates.analytical_text ?? null,
    p_coa_link_url: updates.coa_link_url ?? null,
    p_clear_coa_link_url: updates.clear_coa_link_url ?? false,
    p_product_type: updates.product_type ?? null,
    p_bundle_items: updates.bundle_items !== undefined ? updates.bundle_items : null,
  });

  if (error) {
    log.error('updateProduct failed', error);
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (result.success) {
    await logAdminAction(
      {
        action: 'product.edit',
        target_table: 'product_mappings',
        target_id: productId,
        after: updates,
      },
      client
    );
  }
  return result;
}

export async function saveProductImage(
  productId: string,
  imageUrl: string,
  storagePath: string,
  fileName: string,
  fileSize: number,
  isPrimary: boolean = false,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: imageUrl,
      storage_path: storagePath,
      file_name: fileName,
      file_size: fileSize,
      is_primary: isPrimary,
    })
    .select('id')
    .single();

  if (error) {
    log.error('saveProductImage failed', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function setPrimaryProductImage(
  imageId: string,
  productId: string,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('set_primary_product_image', {
    p_image_id: imageId,
    p_product_id: productId,
  });

  if (error) {
    log.error('setPrimaryProductImage failed', error);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; error?: string };
}

export async function deleteProductImageRecord(
  imageId: string,
  client: SupabaseClient | null = supabase
): Promise<{ success: boolean; storage_path?: string; error?: string }> {
  if (!client) return { success: false, error: 'No database client' };

  const { data, error } = await client.rpc('delete_product_image', {
    p_image_id: imageId,
  });

  if (error) {
    log.error('deleteProductImageRecord failed', error);
    return { success: false, error: error.message };
  }

  return data as { success: boolean; storage_path?: string; error?: string };
}

type EmbeddedProductImages = {
  id?: string;
  image_url: string;
  is_primary: boolean | null;
  display_order: number | null;
  updated_at?: string | null;
};

type ProductMappingImagesRow = {
  cfg_code: string;
  product_images: EmbeddedProductImages[] | EmbeddedProductImages | null;
};

function cacheVersionToken(row: EmbeddedProductImages): string {
  const u = row.updated_at;
  if (u) {
    const ms = Date.parse(u);
    if (!Number.isNaN(ms)) return String(ms);
  }
  const id = row.id?.trim();
  if (id) return id;
  return '0';
}

function pickBestProductImage(
  raw: EmbeddedProductImages[] | EmbeddedProductImages | null | undefined
): { url: string; versionToken: string } | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => {
    const ap = a.is_primary === true ? 1 : 0;
    const bp = b.is_primary === true ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });
  const chosen = sorted[0];
  const url = chosen?.image_url?.trim();
  if (!url) return null;
  return { url, versionToken: cacheVersionToken(chosen) };
}

export async function fetchShopPrimaryImageOverrides(): Promise<Record<string, string>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('product_mappings')
    .select(
      'cfg_code, product_images ( id, image_url, is_primary, display_order, updated_at )'
    )
    .eq('is_active', true);

  if (error) {
    log.error('fetchShopPrimaryImageOverrides failed', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return {};
  }

  const out: Record<string, string> = {};
  for (const row of (data ?? []) as ProductMappingImagesRow[]) {
    const picked = pickBestProductImage(row.product_images);
    if (!picked) continue;
    const peptideId = CFG_CODE_TO_PEPTIDE_ID[row.cfg_code] ?? row.cfg_code.toLowerCase();
    out[peptideId] = appendImageCacheVersion(picked.url, picked.versionToken);
  }
  return out;
}

export async function createProduct(
  data: {
    cfg_code: string;
    peptide_name: string;
    protein_name?: string;
    price?: number;
    description?: string;
    category?: string;
    is_active?: boolean;
    stock_quantity?: number;
    compare_at_price?: number | null;
    sale_label?: string | null;
    sort_order?: number;
    overview_text?: string | null;
    specifications_text?: string | null;
    analytical_text?: string | null;
    coa_link_url?: string | null;
    product_type?: 'standard' | 'bundle';
    bundle_items?: unknown;
  },
  client: SupabaseClient | null
): Promise<{ success: boolean; product_id?: string; cfg_code?: string; error?: string }> {
  if (!client) return { success: false, error: 'No client' };

  const { data: result, error } = await client.rpc('create_product', {
    p_cfg_code: data.cfg_code,
    p_peptide_name: data.peptide_name,
    p_protein_name: data.protein_name ?? '',
    p_price: data.price ?? 0,
    p_description: data.description ?? '',
    p_category: data.category ?? '',
    p_is_active: data.is_active ?? true,
    p_stock_quantity: data.stock_quantity ?? 0,
    p_compare_at_price: data.compare_at_price ?? null,
    p_sale_label: data.sale_label ?? null,
    p_sort_order: data.sort_order ?? 0,
    p_overview_text: data.overview_text ?? null,
    p_specifications_text: data.specifications_text ?? null,
    p_analytical_text: data.analytical_text ?? null,
    p_coa_link_url: data.coa_link_url ?? null,
    p_product_type: data.product_type ?? 'standard',
    p_bundle_items: data.bundle_items ?? [],
  });

  if (error) {
    log.error('createProduct failed', error);
    return { success: false, error: error.message };
  }

  const r = result as { success: boolean; product_id?: string; cfg_code?: string; error?: string };
  if (r.success && r.product_id) {
    await logAdminAction(
      {
        action: 'product.create',
        target_table: 'product_mappings',
        target_id: r.product_id,
        after: { cfg_code: data.cfg_code, peptide_name: data.peptide_name, price: data.price },
      },
      client
    );
  }
  return r;
}

export async function deleteProduct(
  productId: string,
  client: SupabaseClient | null
): Promise<{ success: boolean; error?: string }> {
  if (!client) return { success: false, error: 'No client' };

  const { data: existing } = await client
    .from('product_mappings')
    .select('cfg_code, peptide_name, protein_name, price, is_active')
    .eq('id', productId)
    .maybeSingle();

  const [{ data: imageRows }, { data: coaRows }] = await Promise.all([
    client.from('product_images').select('storage_path').eq('product_id', productId),
    client.from('product_coas').select('storage_path').eq('product_id', productId),
  ]);

  const imagePaths = (imageRows ?? [])
    .map((row) => row.storage_path as string)
    .filter(Boolean);
  const coaPaths = (coaRows ?? [])
    .map((row) => row.storage_path as string)
    .filter(Boolean);

  let removableImagePaths = imagePaths;
  if (imagePaths.length > 0) {
    const { data: sharedRows } = await client
      .from('product_images')
      .select('storage_path')
      .in('storage_path', imagePaths)
      .neq('product_id', productId);
    const sharedPaths = new Set((sharedRows ?? []).map((row) => row.storage_path as string));
    removableImagePaths = imagePaths.filter((path) => !sharedPaths.has(path));
  }

  const { data: result, error } = await client.rpc('delete_product', {
    p_product_id: productId,
  });

  if (error) {
    log.error('deleteProduct failed', error);
    return { success: false, error: error.message };
  }

  const r = result as { success: boolean; error?: string };

  if (r.success) {
    const cleanupTasks: Array<Promise<unknown>> = [];
    if (removableImagePaths.length > 0) {
      cleanupTasks.push(client.storage.from('product-images').remove(removableImagePaths));
    }
    if (coaPaths.length > 0) {
      cleanupTasks.push(client.storage.from('coa-documents').remove(coaPaths));
    }
    if (cleanupTasks.length > 0) {
      const cleanupResults = await Promise.allSettled(cleanupTasks);
      const cleanupFailed = cleanupResults.some((cleanup) => {
        if (cleanup.status === 'rejected') return true;
        const value = cleanup.value as { error?: unknown } | null;
        return Boolean(value?.error);
      });
      if (cleanupFailed) {
        log.warn('Product deleted but one or more storage files need manual cleanup');
      }
    }

    await logAdminAction(
      {
        action: 'product.delete',
        target_table: 'product_mappings',
        target_id: productId,
        before: existing ?? null,
        after: null,
      },
      client
    );
  }

  return r;
}

export async function duplicateProduct(
  productId: string,
  client: SupabaseClient | null
): Promise<{ success: boolean; product_id?: string; cfg_code?: string; error?: string }> {
  if (!client) return { success: false, error: 'No client' };
  const [sourceResult, collectionIds, nextCfg] = await Promise.all([
    getProductWithImages(productId, client),
    getCollectionIdsForProduct(productId, client),
    suggestNextCfgCode(client),
  ]);

  const source = sourceResult.product;
  if (!sourceResult.success || !source) {
    return { success: false, error: sourceResult.error || 'Product not found' };
  }

  const created = await createProduct(
    {
      cfg_code: nextCfg,
      peptide_name: `${source.peptide_name} (Copy)`,
      protein_name: source.protein_name,
      price: source.price,
      description: source.description ?? undefined,
      category: source.category ?? undefined,
      is_active: false,
      stock_quantity: source.stock_quantity ?? 0,
      compare_at_price: source.compare_at_price ?? null,
      sale_label: source.sale_label ?? null,
      sort_order: source.sort_order ?? 0,
      overview_text: source.overview_text ?? null,
      specifications_text: source.specifications_text ?? null,
      analytical_text: source.analytical_text ?? null,
      product_type: source.product_type === 'bundle' ? 'bundle' : 'standard',
      bundle_items: source.bundle_items ?? [],
    },
    client
  );

  if (!created.success || !created.product_id) return created;
  const collections = await setProductCollections(created.product_id, collectionIds, client);
  if (!collections.success) {
    return {
      success: true,
      product_id: created.product_id,
      cfg_code: created.cfg_code,
      error: 'Product copied, but collections need to be assigned manually.',
    };
  }

  await logAdminAction(
    {
      action: 'product.duplicate',
      target_table: 'product_mappings',
      target_id: created.product_id,
      after: { source_product_id: productId, media_copied: false },
      note: 'Images and COAs intentionally require new files to avoid shared storage references.',
    },
    client
  );

  return created;
}

export async function suggestNextCfgCode(client: SupabaseClient | null): Promise<string> {
  if (!client) return 'CFG-001';

  const { data, error } = await client.rpc('suggest_next_cfg_code');
  if (error || !data) return 'CFG-001';
  return data as string;
}

export async function fetchProductSaleInfo(): Promise<
  Record<string, { compareAtPrice: number; saleLabel: string | null }>
> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('product_mappings')
    .select('cfg_code, price, compare_at_price, sale_label')
    .eq('is_active', true)
    .not('compare_at_price', 'is', null);

  if (error || !data) return {};

  const out: Record<string, { compareAtPrice: number; saleLabel: string | null }> = {};
  for (const row of data) {
    if (row.compare_at_price && row.compare_at_price > row.price) {
      out[row.cfg_code] = {
        compareAtPrice: Number(row.compare_at_price),
        saleLabel: row.sale_label,
      };
    }
  }
  return out;
}

export type LiveCatalogEntry = {
  price: number;
  isActive: boolean;
  name: string;
  proteinName: string;
  description: string | null;
  category: string | null;
  stockQuantity: number;
  overviewText: string | null;
  specificationsText: string | null;
  analyticalText: string | null;
  coaLinkUrl: string | null;
  productType: 'standard' | 'bundle';
  bundleItems: Array<{ cfg_code: string; qty: number }>;
};

function parseBundleItemsJson(raw: unknown): Array<{ cfg_code: string; qty: number }> {
  if (!raw || !Array.isArray(raw)) return [];
  const out: Array<{ cfg_code: string; qty: number }> = [];
  for (const x of raw) {
    if (x && typeof x === 'object' && 'cfg_code' in x) {
      const cfg = String((x as { cfg_code: string }).cfg_code).trim();
      const qty = Math.max(1, Math.floor(Number((x as { qty?: number }).qty) || 1));
      if (cfg) out.push({ cfg_code: cfg, qty });
    }
  }
  return out;
}

export async function fetchLiveProductCatalog(): Promise<Record<string, LiveCatalogEntry>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('product_mappings')
    .select(
      'cfg_code, peptide_name, protein_name, description, category, price, is_active, stock_quantity, overview_text, specifications_text, analytical_text, coa_link_url, product_type, bundle_items'
    );

  if (error || !data) return {};

  const out: Record<string, LiveCatalogEntry> = {};
  for (const row of data as Array<Record<string, unknown>>) {
    const cfg = String(row.cfg_code);
    const pt = row.product_type === 'bundle' ? 'bundle' : 'standard';
    out[cfg] = {
      price: Number(row.price),
      isActive: Boolean(row.is_active),
      name: String(row.peptide_name ?? ''),
      proteinName: String(row.protein_name ?? ''),
      description: (row.description as string | null) ?? null,
      category: (row.category as string | null) ?? null,
      stockQuantity: Number(row.stock_quantity ?? 0),
      overviewText: (row.overview_text as string | null) ?? null,
      specificationsText: (row.specifications_text as string | null) ?? null,
      analyticalText: (row.analytical_text as string | null) ?? null,
      coaLinkUrl: (row.coa_link_url as string | null) ?? null,
      productType: pt,
      bundleItems: parseBundleItemsJson(row.bundle_items),
    };
  }
  return out;
}
