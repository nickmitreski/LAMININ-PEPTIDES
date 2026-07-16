import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Trash2,
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
import { useAdminAuth } from '../../context/AdminAuthContext';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import ProductEditorImageGallery from './ProductEditorImageGallery';
import {
  ProductEditorBasicInfo,
  ProductEditorPricing,
  ProductEditorInventory,
  ProductEditorStorefrontCopy,
  ProductEditorBundleCollections,
} from './ProductEditorSections';
import type { ProductEditorProduct, ProductImage } from './productEditorTypes';

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
  const { user: adminUser } = useAdminAuth();
  const [product, setProduct] = useState<ProductEditorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageDeleteTarget, setImageDeleteTarget] = useState<{ imageId: string; storagePath: string } | null>(null);
  const [imageDeleting, setImageDeleting] = useState(false);

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
        const prod: ProductEditorProduct = {
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
          const parsed = JSON.parse(bundleItemsJson.trim() || '[]');
          if (!Array.isArray(parsed)) {
            setError('Bundle items must be a JSON array');
            setSaving(false);
            return;
          }
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item || typeof item !== 'object') {
              setError(`Bundle item ${i + 1}: must be an object`);
              setSaving(false);
              return;
            }
            if (typeof item.cfg_code !== 'string' || !item.cfg_code.trim()) {
              setError(`Bundle item ${i + 1}: missing or invalid "cfg_code" (string required)`);
              setSaving(false);
              return;
            }
            if (item.qty !== undefined && (typeof item.qty !== 'number' || item.qty < 1)) {
              setError(`Bundle item ${i + 1}: "qty" must be a positive number`);
              setSaving(false);
              return;
            }
          }
          bundleParsed = parsed;
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
          p_admin_email: adminUser?.email ?? null,
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

  const handleDeleteImage = (imageId: string, storagePath: string) => {
    setImageDeleteTarget({ imageId, storagePath });
  };

  const performDeleteImage = async () => {
    const target = imageDeleteTarget;
    if (!target) return;
    setImageDeleting(true);
    try {
      // Delete from storage first — if this fails we still have the DB record
      // to retry later. The reverse (DB first) orphans the storage file.
      try {
        await deleteProductImage(target.storagePath);
      } catch (storageErr) {
        console.error('Storage delete failed, aborting image removal:', storageErr);
        setError('Could not delete image file from storage. Please try again.');
        setImageDeleting(false);
        setImageDeleteTarget(null);
        return;
      }

      // Storage succeeded — now remove the DB record
      const result = await deleteProductImageRecord(target.imageId, getAdminSupabase());

      if (result.success) {
        await loadProduct();
        setSuccess('Image deleted!');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        // Storage file gone but DB record remains — log for manual cleanup
        console.error('DB image record delete failed after storage delete:', result.error);
        setError('Image file deleted but record removal failed. Refresh to retry.');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setImageDeleting(false);
      setImageDeleteTarget(null);
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
    <>
    <Modal
      open={true}
      onClose={() => !saving && !deleting && onClose()}
      aria-label="Edit product"
      disableBackdropClose={saving || deleting}
      disableEscClose={saving || deleting}
      backdropClassName="bg-black/50 sm:p-4"
      className=""
    >
      <Card
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-carbon-200 bg-white p-4 sm:p-6 rounded-t-lg">
          <div className="min-w-0">
            <Heading level={2} className="truncate">Edit product</Heading>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Text className="truncate text-carbon-600">
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
                  className="inline-flex items-center gap-1 text-xs text-accent-600 transition-colors hover:text-accent-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview on site
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-sm p-1 text-carbon-600 transition-colors hover:bg-carbon-100 hover:text-carbon-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrolling body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
          <ProductEditorBasicInfo
            peptideName={peptideName}
            proteinName={proteinName}
            cfgCode={product?.cfg_code || ''}
            description={description}
            category={category}
            isActive={isActive}
            onPeptideName={setPeptideName}
            onProteinName={setProteinName}
            onDescription={setDescription}
            onCategory={setCategory}
            onIsActive={setIsActive}
          />

          <ProductEditorPricing
            price={price}
            compareAtPrice={compareAtPrice}
            saleLabel={saleLabel}
            sortOrder={sortOrder}
            onPrice={setPrice}
            onCompareAtPrice={setCompareAtPrice}
            onSaleLabel={setSaleLabel}
            onSortOrder={setSortOrder}
          />

          <ProductEditorInventory
            stockQuantity={stockQuantity}
            lowStockThreshold={lowStockThreshold}
            trackInventory={trackInventory}
            onStockQuantity={setStockQuantity}
            onLowStockThreshold={setLowStockThreshold}
            onTrackInventory={setTrackInventory}
          />

          <ProductEditorStorefrontCopy
            overviewText={overviewText}
            specificationsText={specificationsText}
            analyticalText={analyticalText}
            coaLinkUrl={coaLinkUrl}
            onOverview={setOverviewText}
            onSpecifications={setSpecificationsText}
            onAnalytical={setAnalyticalText}
            onCoaLink={setCoaLinkUrl}
          />

          <ProductEditorBundleCollections
            productType={productType}
            bundleItemsJson={bundleItemsJson}
            allCollections={allCollections}
            selectedCollectionIds={selectedCollectionIds}
            onProductType={setProductType}
            onBundleJson={setBundleItemsJson}
            onToggleCollection={(cid) =>
              setSelectedCollectionIds((prev) =>
                prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
              )
            }
          />

          <ProductEditorImageGallery
            images={product?.images}
            uploading={uploading}
            onFileSelect={(e) => void handleFileSelect(e)}
            onSetPrimary={(id) => void handleSetPrimary(id)}
            onDeleteImage={handleDeleteImage}
          />
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

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-carbon-200 bg-carbon-50 p-4 sm:p-6 rounded-b-lg">
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
    </Modal>
    <ConfirmDialog
      open={!!imageDeleteTarget}
      title="Delete this image?"
      message="The image file and its DB record will be permanently removed. This cannot be undone."
      confirmLabel="Delete image"
      tone="danger"
      loading={imageDeleting}
      onConfirm={() => void performDeleteImage()}
      onCancel={() => setImageDeleteTarget(null)}
    />
    </>
  );
}
