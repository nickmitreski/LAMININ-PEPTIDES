export interface ProductImage {
  id: string;
  image_url: string;
  storage_path: string;
  is_primary: boolean;
  display_order: number;
  file_name: string;
}

export interface ProductEditorProduct {
  id: string;
  cfg_code: string;
  peptide_name: string;
  protein_name: string;
  description?: string;
  price: number;
  category?: string;
  is_active: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  compare_at_price?: number | null;
  sale_label?: string | null;
  sort_order?: number;
  images?: ProductImage[];
  overview_text?: string | null;
  specifications_text?: string | null;
  analytical_text?: string | null;
  coa_link_url?: string | null;
  product_type?: string | null;
  bundle_items?: unknown;
}
