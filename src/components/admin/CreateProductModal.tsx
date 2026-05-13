import { useState, useEffect } from 'react';
import { X, Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getAdminSupabase } from '../../lib/supabaseAdminClient';
import { createProduct, suggestNextCfgCode } from '../../services/supabaseService';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';
import Card from '../ui/Card';

interface CreateProductModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES = ['Healing', 'Cognitive', 'Metabolic', 'Performance', 'Longevity'];

export default function CreateProductModal({
  onClose,
  onCreated,
}: CreateProductModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [cfgCode, setCfgCode] = useState('');
  const [peptideName, setPeptideName] = useState('');
  const [proteinName, setProteinName] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [saleLabel, setSaleLabel] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [cfgSuggestionFailed, setCfgSuggestionFailed] = useState(false);

  // Auto-suggest CFG code
  useEffect(() => {
    const loadSuggestion = async () => {
      try {
        const suggested = await suggestNextCfgCode(getAdminSupabase());
        setCfgCode(suggested);
        setCfgSuggestionFailed(false);
      } catch {
        setCfgCode('CFG-001');
        setCfgSuggestionFailed(true);
      }
    };
    void loadSuggestion();
  }, []);

  const handleSave = async () => {
    if (!peptideName.trim()) {
      setError('Product name is required');
      return;
    }
    if (!cfgCode.trim()) {
      setError('CFG code is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createProduct(
        {
          cfg_code: cfgCode.trim(),
          peptide_name: peptideName.trim(),
          protein_name: proteinName.trim() || undefined,
          price: price ? parseFloat(price) : 0,
          compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
          sale_label: saleLabel.trim() || null,
          description: description.trim() || undefined,
          category: category || undefined,
          stock_quantity: stockQuantity ? parseInt(stockQuantity) : 0,
          is_active: isActive,
        },
        getAdminSupabase()
      );

      if (result.success) {
        setSuccess('Product created successfully!');
        setTimeout(() => {
          onCreated();
        }, 800);
      } else {
        setError(result.error || 'Failed to create product');
      }
    } catch (err) {
      setError('An error occurred while creating the product');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-carbon-200">
          <div>
            <Heading level={2}>Add new product</Heading>
            <Text className="text-carbon-600 mt-1">
              Create a new product mapping
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
                  CFG Code *
                </label>
                <input
                  type="text"
                  value={cfgCode}
                  onChange={(e) => setCfgCode(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono"
                  placeholder="CFG-001"
                />
                {cfgSuggestionFailed && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-warning-text">
                    <AlertCircle className="h-3 w-3" />
                    Auto-suggest unavailable — verify this code isn't already in use.
                  </p>
                )}
              </div>

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
                  Protein Name
                </label>
                <input
                  type="text"
                  value={proteinName}
                  onChange={(e) => setProteinName(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g., BPC-157"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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

              <div className="flex items-center gap-4 pt-2">
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

          {/* Pricing */}
          <div>
            <Heading level={3} className="mb-4">
              Pricing
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Price (AUD)
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
            </div>
          </div>

          {/* Inventory */}
          <div>
            <Heading level={3} className="mb-4">
              Inventory
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-carbon-700 mb-1">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-carbon-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-carbon-200 bg-carbon-50">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !peptideName.trim() || !cfgCode.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
