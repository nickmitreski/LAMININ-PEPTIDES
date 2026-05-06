import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { getAdminSupabase } from '../../lib/supabaseAdminClient';
import {
  getProductWithImages,
  updateProduct,
  deleteProduct,
  saveProductImage,
  setPrimaryProductImage,
  deleteProductImageRecord,
  adminListAllCollections,
  getCollectionIdsForProduct,
  setProductCollections,
  type Collection,
} from '../../services/supabaseService';
import { CFG_CODE_TO_PEPTIDE_ID } from '../../data/productMappings';
import { getProductSlug } from '../../data/productContent';
import {
  uploadProductImage,
  deleteProductImage,
  validateImageFile,
} from '../../utils/imageUpload';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';
import Card from '../ui/Card';

interface ProductImage {
  id: string;
  image_url: string;
  storage_path: string;
  is_primary: boolean;
  display_order: number;
  file_name: string;
}

interface Product {
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

interface ProductEditorProps {
  productId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductEditor({
  productId,
  onClose,
  onSave,
}: ProductEditorProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [peptideName, setPeptideName] = useState('');
  const [proteinName, setProteinName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [trackInventory, setTrackInventory] = useState(true);
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [saleLabel, setSaleLabel] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [overviewText, setOverviewText] = useState('');
  const [specificationsText, setSpecificationsText] = useState('');
  const [analyticalText, setAnalyticalText] = useState('');
  const [coaLinkUrl, setCoaLinkUrl] = useState('');
  const [productType, setProductType] = useState<'standard' | 'bundle'>('standard');
  const [bundleItemsJson, setBundleItemsJson] = useState('[]');
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getProductWithImages(productId, getAdminSupabase());

      if (result.success && result.product) {
        const prod: Product = {
          id: result.product.id,
          cfg_code: result.product.cfg_code,
          peptide_name: result.product.peptide_name,
          protein_name: result.product.protein_name,
          description: result.product.description ?? undefined,
          price: result.product.price,
          category: result.product.category ?? undefined,
          is_active: result.product.is_active,
          stock_quantity: result.product.stock_quantity ?? undefined,
          low_stock_threshold: result.product.low_stock_threshold ?? undefined,
          track_inventory: result.product.track_inventory ?? undefined,
          compare_at_price: result.product.compare_at_price ?? undefined,
          sale_label: result.product.sale_label ?? undefined,
          sort_order: result.product.sort_order ?? undefined,
          images: (result.product.images as ProductImage[] | null) ?? undefined,
        };
        setProduct(prod);
        setPeptideName(prod.peptide_name || '');
        setProteinName(prod.protein_name || '');
        setDescription(prod.description || '');
        setPrice(prod.price?.toString() || '');
        setCategory(prod.category || '');
        setIsActive(prod.is_active ?? true);
        setStockQuantity(prod.stock_quantity?.toString() || '');
        setLowStockThreshold(prod.low_stock_threshold?.toString() || '10');
        setTrackInventory(prod.track_inventory ?? true);
        setCompareAtPrice(prod.compare_at_price?.toString() || '');
        setSaleLabel(prod.sale_label || '');
        setSortOrder(prod.sort_order?.toString() || '0');
        setOverviewText((result.product.overview_text as string | null) ?? '');
        setSpecificationsText((result.product.specifications_text as string | null) ?? '');
        setAnalyticalText((result.product.analytical_text as string | null) ?? '');
        setCoaLinkUrl((result.product.coa_link_url as string | null) ?? '');
        const pt =
          result.product.product_type === 'bundle' ? 'bundle' : 'standard';
        setProductType(pt);
        const bi = result.product.bundle_items;
        setBundleItemsJson(
          bi != null ? JSON.stringify(bi, null, 2) : '[]'
        );

        const db = getAdminSupabase();
        if (db) {
          const [cols, mids] = await Promise.all([
            adminListAllCollections(db),
            getCollectionIdsForProduct(productId, db),
          ]);
          setAllCollections(cols);
          setSelectedCollectionIds(mids);
        }
      } else {
        setError(result.error || 'Failed to load product');
      }
    } catch (err) {
      setError('An error occurred while loading the product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Load product data
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const db = getAdminSupabase();
      if (!db) {
        setError('Admin client not available. Please re-authenticate.');
        return;
      }
      const newStock = stockQuantity ? parseInt(stockQuantity) : undefined;
      const currentStock = product?.stock_quantity ?? 0;
      const stockChanged = newStock !== undefined && newStock !== currentStock;

      let bundleParsed: unknown = [];
      if (productType === 'bundle') {
        try {
          bundleParsed = JSON.parse(bundleItemsJson.trim() || '[]');
        } catch {
          setError('Bundle items must be valid JSON (array of {cfg_code, qty})');
          setSaving(false);
          return;
        }
      }

      // If stock changed, use adjust_inventory RPC for audit trail
      if (stockChanged && product?.cfg_code) {
        const delta = newStock - currentStock;
        const { error: invError } = await db.rpc('adjust_inventory', {
          p_cfg_code: product.cfg_code,
          p_quantity_change: delta,
          p_transaction_type: 'adjustment',
          p_notes: `Stock set to ${newStock} via Product Editor`,
          p_admin_email: null,
        });
        if (invError) {
          setError(`Inventory adjustment failed: ${invError.message}`);
          setSaving(false);
          return;
        }
      }

      const result = await updateProduct(
        productId,
        {
          peptide_name: peptideName,
          protein_name: proteinName,
          description: description || undefined,
          price: parseFloat(price),
          category: category || undefined,
          is_active: isActive,
          // stock_quantity is now handled by adjust_inventory above
          low_stock_threshold: lowStockThreshold
            ? parseInt(lowStockThreshold)
            : undefined,
          track_inventory: trackInventory,
          compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
          sale_label: saleLabel || null,
          sort_order: sortOrder ? parseInt(sortOrder) : 0,
          clear_compare_at_price: !compareAtPrice,
          clear_sale_label: !saleLabel,
          overview_text: overviewText.trim() || null,
          specifications_text: specificationsText.trim() || null,
          analytical_text: analyticalText.trim() || null,
          coa_link_url: coaLinkUrl.trim() || null,
          clear_coa_link_url: !coaLinkUrl.trim(),
          product_type: productType,
          bundle_items: productType === 'bundle' ? bundleParsed : [],
        },
        db
      );

      if (result.success) {
        const coll = await setProductCollections(productId, selectedCollectionIds, db);
        if (!coll.success) {
          setError(coll.error || 'Product saved but collections failed to update');
          setSaving(false);
          return;
        }
        setSuccess('Product updated successfully!');
        setTimeout(() => {
          onSave();
          onClose();
        }, 1000);
      } else {
        setError(result.error || 'Failed to update product');
      }
    } catch (err) {
      setError('An error occurred while saving');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }

        // Upload to storage
        const uploaded = await uploadProductImage(file, productId);

        // Save to database
        const isFirst = !product?.images || product.images.length === 0;
        await saveProductImage(
          productId,
          uploaded.url,
          uploaded.path,
          uploaded.fileName,
          uploaded.fileSize,
          isFirst, // Set as primary if it's the first image
          getAdminSupabase()
        );
      }

      // Reload product
      await loadProduct();
      setSuccess('Images uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      const result = await setPrimaryProductImage(
        imageId,
        productId,
        getAdminSupabase()
      );

      if (result.success) {
        await loadProduct();
        setSuccess('Primary image updated!');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || 'Failed to set primary image');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const handleDeleteImage = async (imageId: string, storagePath: string) => {
    if (!confirm('Delete this image? This cannot be undone.')) return;

    try {
      // Delete from database
      const result = await deleteProductImageRecord(imageId, getAdminSupabase());

      if (result.success) {
        // Delete from storage
        await deleteProductImage(storagePath);
        await loadProduct();
        setSuccess('Image deleted!');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || 'Failed to delete image');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent-600" />
          <Text className="mt-4">Loading product...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <div>
            <Heading level={2}>Edit product</Heading>
            <div className="flex items-center gap-3 mt-1">
              <Text className="text-carbon-600">
                {product?.cfg_code} - {product?.peptide_name}
              </Text>
              {product?.peptide_name && (
                <a
                  href={`/products/${getProductSlug(
                    CFG_CODE_TO_PEPTIDE_ID[product.cfg_code] ??
                      product.cfg_code.toLowerCase()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-800 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview on site
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-carbon-600 hover:text-carbon-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-error-light border border-error-border rounded-sm text-error-text">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <Text className="text-sm">{error}</Text>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-success-light border border-success-border rounded-sm text-success-text">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <Text className="text-sm">{success}</Text>
            </div>
          )}

          {/* Product information */}
          <div>
            <Heading level={3} className="mb-4">
              Product information
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Product name *
                </label>
                <input
                  type="text"
                  value={peptideName}
                  onChange={(e) => setPeptideName(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g., BPC-157 10mg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Protein name *
                </label>
                <input
                  type="text"
                  value={proteinName}
                  onChange={(e) => setProteinName(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g., BPC-157"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  CFG code (read-only)
                </label>
                <input
                  type="text"
                  value={product?.cfg_code || ''}
                  disabled
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm bg-carbon-50 text-carbon-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="Product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g., Peptides"
                />
              </div>

              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-accent-600 border-carbon-300 rounded focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-carbon-700">
                    Active product
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing & Sale */}
          <div>
            <Heading level={3} className="mb-4">
              Pricing
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Price (AUD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-carbon-600">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="99.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Compare-at Price (original before sale)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-carbon-600">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder="Leave empty if not on sale"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Sale Label
                </label>
                <input
                  type="text"
                  value={saleLabel}
                  onChange={(e) => setSaleLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g. SALE, 20% OFF"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <Heading level={3} className="mb-4">
              Inventory
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Stock quantity
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Low stock alert
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="10"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={trackInventory}
                    onChange={(e) => setTrackInventory(e.target.checked)}
                    className="w-4 h-4 text-accent-600 border-carbon-300 rounded focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-carbon-700">
                    Track inventory
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Storefront copy (PDP) */}
          <div>
            <Heading level={3} className="mb-4">
              Storefront copy
            </Heading>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Overview (plain text, line breaks preserved)
                </label>
                <textarea
                  value={overviewText}
                  onChange={(e) => setOverviewText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-base md:text-sm"
                  placeholder="Shown in product overview when set"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Specifications (optional override)
                </label>
                <textarea
                  value={specificationsText}
                  onChange={(e) => setSpecificationsText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-base md:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Analytical verification copy
                </label>
                <textarea
                  value={analyticalText}
                  onChange={(e) => setAnalyticalText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-base md:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  External COA URL (optional)
                </label>
                <input
                  type="url"
                  value={coaLinkUrl}
                  onChange={(e) => setCoaLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500 text-base md:text-sm min-h-11"
                  placeholder="https://…"
                />
              </div>
            </div>
          </div>

          {/* Bundle + collections */}
          <div>
            <Heading level={3} className="mb-4">
              Product type &amp; collections
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Type
                </label>
                <select
                  value={productType}
                  onChange={(e) =>
                    setProductType(e.target.value as 'standard' | 'bundle')
                  }
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500 min-h-11 text-base md:text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="bundle">Bundle</option>
                </select>
              </div>
              {productType === 'bundle' ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-carbon-700 mb-1">
                    Bundle items (JSON array)
                  </label>
                  <textarea
                    value={bundleItemsJson}
                    onChange={(e) => setBundleItemsJson(e.target.value)}
                    rows={4}
                    className="w-full font-mono text-sm px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    placeholder='[{"cfg_code":"CFG-031","qty":1}]'
                  />
                </div>
              ) : null}
            </div>
            <div className="mt-4">
              <Text variant="small" weight="medium" className="mb-2 block text-carbon-700">
                Collections
              </Text>
              <div className="max-h-40 overflow-y-auto rounded-sm border border-carbon-200 p-3 space-y-2">
                {allCollections.length === 0 ? (
                  <Text variant="caption" muted>
                    No collections yet — create them under Admin → Collections.
                  </Text>
                ) : (
                  allCollections.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollectionIds.includes(c.id)}
                        onChange={() =>
                          setSelectedCollectionIds((prev) =>
                            prev.includes(c.id)
                              ? prev.filter((x) => x !== c.id)
                              : [...prev, c.id]
                          )
                        }
                        className="rounded border-carbon-300 text-accent-600"
                      />
                      <span>
                        {c.name}{' '}
                        <span className="text-carbon-500 font-mono text-xs">
                          ({c.slug})
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <Heading level={3} className="mb-4">
              Product images
            </Heading>

            {/* Upload Area */}
            <div className="mb-4">
              <label className="block">
                <div className="border-2 border-dashed border-carbon-300 rounded-sm p-6 text-center cursor-pointer hover:border-accent-500 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-carbon-400" />
                  <Text className="text-carbon-600 mb-1">
                    {uploading
                      ? 'Uploading...'
                      : 'Click to upload or drag and drop'}
                  </Text>
                  <Text className="text-sm text-carbon-500">
                    PNG, JPG, WebP up to 5MB
                  </Text>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
            </div>

            {/* Image Gallery */}
            {product?.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group border-2 rounded-sm overflow-hidden ${
                      image.is_primary
                        ? 'border-accent-500'
                        : 'border-carbon-200'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.file_name}
                      className="w-full h-32 object-cover"
                    />

                    {image.is_primary && (
                      <div className="absolute top-2 left-2 bg-accent-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Primary
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!image.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(image.id)}
                          className="p-2 bg-white rounded hover:bg-accent-50 transition-colors"
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4 text-accent-600" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteImage(image.id, image.storage_path)
                        }
                        className="p-2 bg-white rounded hover:bg-error-light transition-colors"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-carbon-300 rounded-sm">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-carbon-300" />
                <Text className="text-carbon-500">No images yet</Text>
                <Text className="text-sm text-carbon-400">
                  Upload images to display them here
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="px-6 pb-6">
          <div className="border border-error-border rounded-sm p-4 bg-error-light/50">
            <Heading level={3} className="text-error-text mb-2 text-sm">
              Danger zone
            </Heading>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-sm border border-error-border bg-white px-3 py-1.5 text-sm font-medium text-error-dark transition-colors hover:bg-error-light"
              >
                <Trash2 className="w-4 h-4" />
                Delete this product
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Text variant="small" className="text-error-dark">
                  Are you sure? This cannot be undone.
                </Text>
                <button
                  type="button"
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const result = await deleteProduct(productId, getAdminSupabase());
                      if (result.success) {
                        onSave();
                        onClose();
                      } else {
                        setError(result.error || 'Failed to delete product');
                        setConfirmDelete(false);
                      }
                    } catch {
                      setError('An error occurred while deleting');
                      setConfirmDelete(false);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-sm bg-error px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-error-dark disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirm delete
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="text-sm text-carbon-600 hover:text-carbon-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-carbon-200 bg-carbon-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !peptideName || !price}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
