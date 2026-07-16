import { PRODUCT_MAPPINGS, type ProductMapping } from '../data/productMappings';
import { supabase } from '../lib/supabase';

function mappingsFromRows(
  rows: {
    cfg_code: string;
    peptide_name: string;
    protein_name: string;
    price: number;
  }[]
): Record<string, ProductMapping> {
  const out: Record<string, ProductMapping> = {};
  for (const r of rows) {
    out[r.cfg_code] = {
      peptideName: r.peptide_name,
      proteinName: r.protein_name,
      price: Number(r.price),
    };
  }
  return out;
}

export async function getProductMappings(): Promise<Record<string, ProductMapping>> {
  if (!supabase) {
    return { ...PRODUCT_MAPPINGS };
  }

  const { data, error } = await supabase
    .from('product_mappings')
    .select('cfg_code, peptide_name, protein_name, price')
    .eq('is_active', true);

  if (error || !data?.length) {
    return { ...PRODUCT_MAPPINGS };
  }

  return mappingsFromRows(data);
}
