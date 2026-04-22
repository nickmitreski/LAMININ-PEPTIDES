import { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getAdminSupabase } from '../../lib/supabaseAdminClient';
import {
  getProductWithImages,
  updateProduct,
  saveProductImage,
  setPrimaryProductImage,
  deleteProductImageRecord,
} from '../../services/supabaseService';
import {
  uploadProductImage,
  deleteProductImage,
  validateImageFile,
  formatFileSize,
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
  images?: ProductImage[];
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

  // Load product data
  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getProductWithImages(productId, getAdminSupabase());

      if (result.success && result.product) {
        const prod = result.product;
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
      } else {
        setError(result.error || 'Failed to load product');
      }
    } catch (err) {
      setError('An error occurred while loading the product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProduct(
        productId,
        {
          peptide_name: peptideName,
          protein_name: proteinName,
          description: description || undefined,
          price: parseFloat(price),
          category: category || undefined,
          is_active: isActive,
          stock_quantity: stockQuantity ? parseInt(stockQuantity) : undefined,
          low_stock_threshold: lowStockThreshold
            ? parseInt(lowStockThreshold)
            : undefined,
          track_inventory: trackInventory,
        },
        getAdminSupabase()
      );

      if (result.success) {
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
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
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
            <Heading level={2}>Edit Product</Heading>
            <Text className="text-carbon-600 mt-1">
              {product?.cfg_code} - {product?.peptide_name}
            </Text>
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
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-sm text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <Text className="text-sm">{error}</Text>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-sm text-green-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <Text className="text-sm">{success}</Text>
            </div>
          )}

          {/* Product Information */}
          <div>
            <Heading level={3} className="mb-4">
              Product Information
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Product Name *
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
                  Protein Name *
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
                  CFG Code (Read-only)
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
                    Active Product
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing */}
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
                  Stock Quantity
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
                  Low Stock Alert
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
                    Track Inventory
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <Heading level={3} className="mb-4">
              Product Images
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
                        className="p-2 bg-white rounded hover:bg-red-50 transition-colors"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
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
              'Save Changes'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
