import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Heading, Text } from '../components/ui/Typography';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminNavigation from '../components/admin/AdminNavigation';
import { formatPrice } from '../lib/formatCurrency';

interface Product {
  id: string;
  cfg_code: string;
  peptide_name: string;
  protein_name: string;
  price: number;
  stock_quantity: number;
  track_inventory: boolean;
  low_stock_threshold: number;
}

interface InventoryTransaction {
  id: string;
  product_cfg_code: string;
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  notes: string | null;
  created_by_email: string | null;
  created_at: string;
}

type AdjustmentMode = 'add' | 'subtract' | 'set';

export default function AdminInventory() {
  const navigate = useNavigate();
  const { logout, user: adminUser } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Transaction history
  const [history, setHistory] = useState<InventoryTransaction[]>([]);

  // Low stock alerts
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  // Adjustment form
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>('');
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');

  // Load all products with inventory data
  const loadProducts = async () => {
    setLoading(true);

    const db = getAdminSupabase();
    if (!db) {
      console.error('Supabase not configured');
      setLoading(false);
      return;
    }

    const { data, error } = await db
      .from('product_mappings')
      .select('id, cfg_code, peptide_name, protein_name, price, stock_quantity, track_inventory, low_stock_threshold')
      .eq('is_active', true)
      .order('peptide_name');

    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data || []);

      // Find low stock products
      const lowStock = (data || []).filter(
        (p: Product) => p.track_inventory && p.stock_quantity <= p.low_stock_threshold
      );
      setLowStockProducts(lowStock);
    }

    setLoading(false);
  };

  // Load transaction history for selected product
  const loadHistory = async (cfgCode: string) => {
    const db = getAdminSupabase();
    if (!db) return;

    setLoadingHistory(true);

    const { data, error } = await db.rpc('get_inventory_history', {
      p_cfg_code: cfgCode,
      p_limit: 50
    });

    if (error) {
      console.error('Error loading history:', error);
    } else {
      setHistory(data || []);
    }

    setLoadingHistory(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-refresh on tab focus (catches stock changes from Products page)
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') void loadProducts();
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadHistory(selectedProduct.cfg_code);
    } else {
      setHistory([]);
    }
  }, [selectedProduct]);

  // Handle inventory adjustment
  const handleAdjustment = async () => {
    const db = getAdminSupabase();
    if (!selectedProduct || !db) return;

    const qty = parseInt(adjustmentQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    let quantityChange = 0;
    let transactionType = '';

    switch (adjustmentMode) {
      case 'add':
        quantityChange = qty;
        transactionType = 'restock';
        break;
      case 'subtract':
        quantityChange = -qty;
        transactionType = 'sale';
        break;
      case 'set':
        quantityChange = qty - selectedProduct.stock_quantity;
        transactionType = 'adjustment';
        break;
    }

    setSaving(true);

    const { error } = await db.rpc('adjust_inventory', {
      p_cfg_code: selectedProduct.cfg_code,
      p_quantity_change: quantityChange,
      p_transaction_type: transactionType,
      p_notes: adjustmentNotes.trim() || null,
      p_admin_email: adminUser?.email ?? 'admin'
    });

    if (error) {
      console.error('Error adjusting inventory:', error);
      alert('❌ Failed to adjust inventory: ' + error.message);
    } else {
      // Reload data
      await loadProducts();

      // Find and update selected product
      const updatedProduct = products.find(p => p.cfg_code === selectedProduct.cfg_code);
      if (updatedProduct) {
        const { data: refreshedData } = await db
          .from('product_mappings')
          .select('id, cfg_code, peptide_name, protein_name, price, stock_quantity, track_inventory, low_stock_threshold')
          .eq('cfg_code', selectedProduct.cfg_code)
          .single();

        if (refreshedData) {
          setSelectedProduct(refreshedData);
        }
      }

      await loadHistory(selectedProduct.cfg_code);

      // Reset form
      setAdjustmentQuantity('');
      setAdjustmentNotes('');

      alert('✅ Inventory updated successfully');
    }

    setSaving(false);
  };

  // Get display name for product
  const getProductDisplayName = (product: Product) => {
    return product.peptide_name || product.protein_name;
  };

  // Get stock level color
  const getStockColor = (product: Product) => {
    if (!product.track_inventory) return 'text-neutral-500';
    if (product.stock_quantity === 0) return 'text-error';
    if (product.stock_quantity <= product.low_stock_threshold) return 'text-amber-600';
    return 'text-success';
  };

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section background="white" spacing="lg">
        <Container size="lg">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Heading level={3} className="mb-2">
                Inventory management
              </Heading>
              <Text variant="small" muted className="max-w-xl">
                Real-time inventory tracking powered by the Supabase database with full transaction history and low-stock alerts.
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/library')}
              >
                View library
              </Button>
            </div>
          </div>

          {/* Low Stock Alert Banner */}
          {lowStockProducts.length > 0 && (
            <div className="mb-6 rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <Text className="font-bold text-amber-900">
                    Low stock alert
                  </Text>
                  <Text variant="small" className="text-amber-800 mt-1">
                    {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low:
                  </Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lowStockProducts.slice(0, 5).map((p) => {
                      return (
                        <button
                          key={p.cfg_code}
                          onClick={() => setSelectedProduct(p)}
                          className="rounded bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
                        >
                          {getProductDisplayName(p)} - {p.stock_quantity} left
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product List */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-carbon-900/10 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-carbon-900/10 bg-grey/50 px-4 py-3">
                  <Text className="font-bold uppercase tracking-wide text-carbon-900">
                    Products ({products.length})
                  </Text>
                </div>
                <div className="max-h-[600px] overflow-y-auto divide-y divide-carbon-900/5">
                  {loading ? (
                    <div role="status" aria-busy="true" aria-label="Loading products">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <Skeleton className="h-9 w-9" rounded="sm" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                      No products found
                    </div>
                  ) : (
                    products.map((product) => {
                      const isSelected = selectedProduct?.cfg_code === product.cfg_code;

                      return (
                        <button
                          key={product.cfg_code}
                          onClick={() => setSelectedProduct(product)}
                          className={`w-full px-4 py-3 text-left hover:bg-grey/30 transition-colors ${
                            isSelected ? 'bg-grey/60 border-l-4 border-carbon-900' : ''
                          }`}
                        >
                          <Text className="font-medium text-carbon-900 text-sm">
                            {getProductDisplayName(product)}
                          </Text>
                          <Text variant="caption" muted className="mt-0.5">
                            {product.cfg_code}
                          </Text>
                          <div className="mt-1">
                            <Text variant="caption" className={`font-bold ${getStockColor(product)}`}>
                              Stock: {product.stock_quantity}
                              {product.stock_quantity <= product.low_stock_threshold && ' ⚠️'}
                            </Text>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Stock Adjustment Panel + History */}
            <div className="lg:col-span-2 space-y-6">
              {selectedProduct ? (
                <>
                  {/* Product Info */}
                  <div className="rounded-xl border border-carbon-900/10 bg-white shadow-sm p-6">
                    <div className="mb-4">
                      <Heading level={4} className="mb-1">
                        {getProductDisplayName(selectedProduct)}
                      </Heading>
                      <Text variant="small" muted>
                        {selectedProduct.cfg_code} • {formatPrice(Number(selectedProduct.price))} AUD
                      </Text>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-grey/30">
                      <div>
                        <Text variant="caption" muted className="uppercase tracking-wide">Current stock</Text>
                        <Text className={`text-2xl font-bold mt-1 ${getStockColor(selectedProduct)}`}>
                          {selectedProduct.stock_quantity}
                        </Text>
                      </div>
                      <div>
                        <Text variant="caption" muted className="uppercase tracking-wide">Low stock alert</Text>
                        <Text className="text-2xl font-bold mt-1 text-carbon-900">
                          {selectedProduct.low_stock_threshold}
                        </Text>
                      </div>
                      <div>
                        <Text variant="caption" muted className="uppercase tracking-wide">Tracking</Text>
                        <Text className="text-2xl font-bold mt-1 text-carbon-900">
                          {selectedProduct.track_inventory ? '✓' : '✗'}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Adjustment Controls */}
                  <div className="rounded-xl border border-carbon-900/10 bg-white shadow-sm p-6">
                    <Text className="font-bold uppercase tracking-wide text-carbon-900 mb-4">
                      Adjust stock
                    </Text>

                    {/* Mode Selection */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setAdjustmentMode('add')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          adjustmentMode === 'add'
                            ? 'bg-green-600 text-white'
                            : 'bg-grey/50 text-carbon-900 hover:bg-grey'
                        }`}
                      >
                        ➕ Add stock
                      </button>
                      <button
                        onClick={() => setAdjustmentMode('subtract')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          adjustmentMode === 'subtract'
                            ? 'bg-error text-white'
                            : 'bg-grey/50 text-carbon-900 hover:bg-grey'
                        }`}
                      >
                        ➖ Remove stock
                      </button>
                      <button
                        onClick={() => setAdjustmentMode('set')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          adjustmentMode === 'set'
                            ? 'bg-blue-600 text-white'
                            : 'bg-grey/50 text-carbon-900 hover:bg-grey'
                        }`}
                      >
                        🔢 Set exact
                      </button>
                    </div>

                    {/* Quantity Input */}
                    <div className="mb-4">
                      <label className="block mb-2">
                        <Text variant="small" className="font-medium text-carbon-900">
                          Quantity {adjustmentMode === 'set' ? '(new total)' : '(change amount)'}
                        </Text>
                      </label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        className="w-full rounded-lg border border-carbon-900/15 bg-white px-4 py-2.5 text-carbon-900"
                        value={adjustmentQuantity}
                        placeholder={adjustmentMode === 'set' ? 'Enter new total quantity' : 'Enter quantity to adjust'}
                        onChange={(e) => setAdjustmentQuantity(e.target.value)}
                      />
                      {adjustmentMode === 'set' && adjustmentQuantity && (
                        <Text variant="caption" muted className="mt-1">
                          Will change by: {parseInt(adjustmentQuantity) - selectedProduct.stock_quantity}
                        </Text>
                      )}
                    </div>

                    {/* Notes Input */}
                    <div className="mb-4">
                      <label className="block mb-2">
                        <Text variant="small" className="font-medium text-carbon-900">
                          Notes (optional)
                        </Text>
                      </label>
                      <textarea
                        rows={2}
                        className="w-full rounded-lg border border-carbon-900/15 bg-white px-4 py-2.5 text-carbon-900 text-sm"
                        value={adjustmentNotes}
                        placeholder="e.g., New shipment arrived, Damaged inventory removed, etc."
                        onChange={(e) => setAdjustmentNotes(e.target.value)}
                      />
                    </div>

                    {/* Apply Button */}
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleAdjustment}
                      disabled={saving || !adjustmentQuantity}
                      className="w-full"
                    >
                      {saving ? 'Updating...' : 'Apply adjustment'}
                    </Button>
                  </div>

                  {/* Transaction History */}
                  <div className="rounded-xl border border-carbon-900/10 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-carbon-900/10 bg-grey/50 px-4 py-3">
                      <Text className="font-bold uppercase tracking-wide text-carbon-900">
                        Transaction history
                      </Text>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {loadingHistory ? (
                        <div
                          role="status"
                          aria-busy="true"
                          aria-label="Loading transaction history"
                          className="divide-y divide-carbon-900/5"
                        >
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2 px-4 py-3">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                              <Skeleton className="h-3 w-3/4" />
                            </div>
                          ))}
                        </div>
                      ) : history.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                          No transaction history yet
                        </div>
                      ) : (
                        <div className="divide-y divide-carbon-900/5">
                          {history.map((transaction) => (
                            <div key={transaction.id} className="px-4 py-3 hover:bg-grey/20">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-lg ${
                                    transaction.quantity_change > 0 ? 'text-success' : 'text-error'
                                  }`}>
                                    {transaction.quantity_change > 0 ? '↑' : '↓'}
                                  </span>
                                  <Text className="font-medium text-carbon-900 text-sm capitalize">
                                    {transaction.transaction_type.replace('_', ' ')}
                                  </Text>
                                </div>
                                <Text variant="caption" muted>
                                  {new Date(transaction.created_at).toLocaleDateString()} {new Date(transaction.created_at).toLocaleTimeString()}
                                </Text>
                              </div>
                              <div className="ml-7 space-y-0.5">
                                <Text variant="caption" className="text-neutral-700">
                                  Change: <span className={`font-bold ${transaction.quantity_change > 0 ? 'text-success' : 'text-error'}`}>
                                    {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                                  </span>
                                  {' • '}
                                  Before: <span className="font-medium">{transaction.quantity_before}</span>
                                  {' → '}
                                  After: <span className="font-medium">{transaction.quantity_after}</span>
                                </Text>
                                {transaction.notes && (
                                  <Text variant="caption" muted>
                                    📝 {transaction.notes}
                                  </Text>
                                )}
                                {transaction.created_by_email && (
                                  <Text variant="caption" muted>
                                    By: {transaction.created_by_email}
                                  </Text>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-carbon-900/10 bg-white shadow-sm p-12 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <Heading level={4} className="mb-2">
                    Select a product
                  </Heading>
                  <Text variant="small" muted>
                    Choose a product from the list to view details and adjust inventory
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
