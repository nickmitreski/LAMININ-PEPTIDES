import type { SupabaseClient } from '@supabase/supabase-js';
import { logAdminAction } from './auditLog';

const COA_BUCKET = 'coa-documents';
const MAX_COA_BYTES = 10 * 1024 * 1024;
const ALLOWED_COA_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

export type CoaStatus = 'draft' | 'published' | 'archived';

export interface ProductCoa {
  id: string;
  product_id: string;
  title: string;
  batch_number: string | null;
  lab_name: string | null;
  test_date: string | null;
  expires_at: string | null;
  document_url: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  status: CoaStatus;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminCoaRow extends ProductCoa {
  product: {
    cfg_code: string;
    peptide_name: string;
  } | null;
}

export interface CreateCoaInput {
  productId: string;
  file: File;
  title?: string;
  batchNumber?: string;
  labName?: string;
  testDate?: string;
  expiresAt?: string;
  notes?: string;
  makeCurrent?: boolean;
}

function safeFileName(value: string): string {
  const parts = value.split('.');
  const extension = parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : '';
  const base = parts
    .join('.')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'certificate'}${extension}`;
}

export function validateCoaFile(file: File): string | null {
  if (!ALLOWED_COA_TYPES.has(file.type)) {
    return 'Upload a PDF, PNG, or JPG certificate.';
  }
  if (file.size <= 0 || file.size > MAX_COA_BYTES) {
    return 'Certificate files must be 10MB or smaller.';
  }
  return null;
}

export async function listProductCoas(
  productId: string,
  client: SupabaseClient
): Promise<ProductCoa[]> {
  const { data, error } = await client
    .from('product_coas')
    .select('*')
    .eq('product_id', productId)
    .order('is_current', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductCoa[]) ?? [];
}

export async function listAllProductCoas(
  client: SupabaseClient
): Promise<AdminCoaRow[]> {
  const { data, error } = await client
    .from('product_coas')
    .select('*, product:product_mappings(cfg_code, peptide_name)')
    .order('is_current', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as AdminCoaRow[]) ?? [];
}

export async function setCurrentProductCoa(
  coaId: string,
  productId: string,
  client: SupabaseClient
): Promise<{ success: boolean; error?: string; document_url?: string }> {
  const { data, error } = await client.rpc('set_current_product_coa', {
    p_coa_id: coaId,
    p_product_id: productId,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success: boolean; error?: string; document_url?: string };
  if (result.success) {
    await logAdminAction(
      {
        action: 'coa.set_current',
        target_table: 'product_coas',
        target_id: coaId,
        after: { product_id: productId },
      },
      client
    );
  }
  return result;
}

export async function archiveProductCoa(
  coa: ProductCoa,
  client: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await client.rpc('archive_product_coa', {
    p_coa_id: coa.id,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success: boolean; error?: string };
  if (result.success) {
    await logAdminAction(
      {
        action: 'coa.archive',
        target_table: 'product_coas',
        target_id: coa.id,
        before: { status: coa.status, is_current: coa.is_current },
        after: { status: 'archived', is_current: false },
      },
      client
    );
  }
  return result;
}

export async function restoreProductCoa(
  coa: ProductCoa,
  client: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const { error } = await client
    .from('product_coas')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', coa.id);
  if (error) return { success: false, error: error.message };
  await logAdminAction(
    {
      action: 'coa.restore',
      target_table: 'product_coas',
      target_id: coa.id,
      before: { status: coa.status },
      after: { status: 'draft' },
    },
    client
  );
  return { success: true };
}

export async function uploadProductCoa(
  input: CreateCoaInput,
  client: SupabaseClient
): Promise<{ success: boolean; coa?: ProductCoa; error?: string }> {
  const validationError = validateCoaFile(input.file);
  if (validationError) return { success: false, error: validationError };

  const filename = safeFileName(input.file.name);
  const path = `products/${input.productId}/${Date.now()}-${filename}`;
  const { error: uploadError } = await client.storage
    .from(COA_BUCKET)
    .upload(path, input.file, {
      cacheControl: '3600',
      contentType: input.file.type,
      upsert: false,
    });
  if (uploadError) return { success: false, error: uploadError.message };

  const { data: publicUrlData } = client.storage.from(COA_BUCKET).getPublicUrl(path);
  const { data, error: insertError } = await client
    .from('product_coas')
    .insert({
      product_id: input.productId,
      title: input.title?.trim() || 'Certificate of Analysis',
      batch_number: input.batchNumber?.trim() || null,
      lab_name: input.labName?.trim() || null,
      test_date: input.testDate || null,
      expires_at: input.expiresAt || null,
      document_url: publicUrlData.publicUrl,
      storage_path: path,
      file_name: input.file.name,
      file_size: input.file.size,
      mime_type: input.file.type,
      notes: input.notes?.trim() || null,
      status: 'draft',
      is_current: false,
    })
    .select('*')
    .single();

  if (insertError || !data) {
    await client.storage.from(COA_BUCKET).remove([path]);
    return { success: false, error: insertError?.message || 'Could not save certificate.' };
  }

  const coa = data as ProductCoa;
  if (input.makeCurrent !== false) {
    const current = await setCurrentProductCoa(coa.id, input.productId, client);
    if (!current.success) {
      return {
        success: false,
        coa,
        error: `Certificate uploaded as a draft, but could not publish it: ${current.error}`,
      };
    }
    coa.status = 'published';
    coa.is_current = true;
  }

  await logAdminAction(
    {
      action: 'coa.upload',
      target_table: 'product_coas',
      target_id: coa.id,
      after: {
        product_id: input.productId,
        file_name: input.file.name,
        batch_number: input.batchNumber || null,
      },
    },
    client
  );
  return { success: true, coa };
}

export function formatCoaFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
