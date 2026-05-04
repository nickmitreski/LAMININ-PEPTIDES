import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Search,
  Plus,
  AlertTriangle,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  getAllProductMappings,
  deleteProduct,
  updateProduct,
} from '../services/supabaseService';
import AdminNavigation from '../components/admin/AdminNavigation';
import ProductEditor from '../components/admin/ProductEditor';
import CreateProductModal from '../components/admin/CreateProductModal';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/formatCurrency';

interface ProductMapping {
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
  created_at: string;
  updated_at: string;
}

const LOW_STOCK_THRESHOLD = 10;

export default function AdminProducts() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ProductMapping | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkToggling, setBulkToggling] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProductMappings(getAdminSupabase());
      setProducts(data);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    void loadProducts();
  }, [isAuthenticated, navigate, loadProducts]);

  // Auto-refresh on tab focus (catches changes from other admin pages)
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') void loadProducts();
    };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [loadProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.peptide_name.toLowerCase().includes(term) ||
        p.cfg_code.toLowerCase().includes(term) ||
        p.protein_name.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const onSaleProducts = products.filter(
    (p) => p.compare_at_price != null && p.compare_at_price > p.price
  ).length;
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= LOW_STOCK_THRESHOLD
  ).length;

  // Selection helpers
  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(filteredProducts.map((p) => p.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [filteredProducts]);

  const selectedCount = selectedIds.size;

  // Delete single product
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteProduct(deleteTarget.id, getAdminSupabase());
      if (result.success) {
        showToast(`Deleted product ${deleteTarget.cfg_code}`, 'success');
        setDeleteTarget(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        void loadProducts();
      } else {
        showToast(result.error || 'Failed to delete product', 'error');
      }
    } catch {
      showToast('An error occurred while deleting the product', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk toggle active/inactive
  const handleBulkToggle = async (makeActive: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkToggling(true);
    const db = getAdminSupabase();
    let success = 0;
    let failed = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const r = await updateProduct(id, { is_active: makeActive }, db);
        if (r.success) success += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkToggling(false);
    setSelectedIds(new Set());

    if (failed === 0) {
      showToast(
        `${success} product${success === 1 ? '' : 's'} set to ${makeActive ? 'active' : 'inactive'}`,
        'success'
      );
    } else {
      showToast(
        `${success} updated, ${failed} failed. Check logs.`,
        'error'
      );
    }
    void loadProducts();
  };

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <Heading level={1} className="mb-2">
              Product management
            </Heading>
            <Text className="text-carbon-600">
              CFG code to peptide product mappings. Manage pricing, sales, stock,
              and visibility.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="md" className="border-l-4 border-l-accent">
            <Text variant="small" muted className="mb-1">
              Total products
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {totalProducts}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-green-500">
            <Text variant="small" muted className="mb-1">
              Active
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {activeProducts}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-orange-500">
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="h-3.5 w-3.5 text-orange-500" />
              <Text variant="small" muted>
                On Sale
              </Text>
            </div>
            <Text variant="body" weight="semibold" className="text-2xl">
              {onSaleProducts}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-red-500">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              <Text variant="small" muted>
                Low Stock
              </Text>
            </div>
            <Text variant="body" weight="semibold" className="text-2xl">
              {lowStockProducts}
            </Text>
          </Card>
        </div>

        {/* Search */}
        <Card padding="md" className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by product name or CFG code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-sm border border-carbon-900/20 py-2 pl-10 pr-4 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </Card>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-accent-200 bg-accent-50 px-4 py-2.5">
            <Text variant="small" weight="medium" className="text-accent-800">
              {selectedCount} selected
            </Text>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear selection
              </Button>
              <button
                type="button"
                onClick={() => void handleBulkToggle(true)}
                disabled={bulkToggling}
                className="inline-flex items-center gap-2 rounded-sm bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                Set Active
              </button>
              <button
                type="button"
                onClick={() => void handleBulkToggle(false)}
                disabled={bulkToggling}
                className="inline-flex items-center gap-2 rounded-sm bg-neutral-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Set Inactive
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <Card padding="none">
          {loading ? (
            <div role="status" aria-busy="true" aria-label="Loading products">
              <div className="border-b border-carbon-900/10 bg-grey/30 px-6 py-3">
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="divide-y divide-carbon-900/10">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-6 px-6 py-4">
                    <Skeleton className="h-4 w-4" rounded="sm" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 flex-1 max-w-[14rem]" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-16" rounded="full" />
                    <Skeleton className="h-5 w-12" rounded="full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <Text variant="body" muted className="mb-1">
                {searchTerm ? 'No products match your search' : 'No products found'}
              </Text>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-accent-700 underline-offset-2 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-carbon-900/10 bg-grey/30">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded border-carbon-300 text-accent focus:ring-accent"
                        aria-label="Select all visible products"
                      />
                    </th>
                    <th className="px-6 py-3 text-left th-label">
                      CFG Code
                    </th>
                    <th className="px-6 py-3 text-left th-label">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left th-label">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left th-label">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left th-label">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left th-label">
                      Sale
                    </th>
                    <th className="px-6 py-3 text-right th-label">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-900/10">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedIds.has(product.id);
                    const isOnSale =
                      product.compare_at_price != null &&
                      product.compare_at_price > product.price;
                    const isLowStock =
                      product.stock_quantity <= LOW_STOCK_THRESHOLD;

                    return (
                      <tr
                        key={product.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-accent-50' : 'hover:bg-grey/20'
                        }`}
                      >
                        <td
                          className="px-4 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(product.id)}
                            className="h-4 w-4 cursor-pointer rounded border-carbon-300 text-accent focus:ring-accent"
                            aria-label={`Select ${product.cfg_code}`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Text
                            variant="small"
                            weight="medium"
                            className="font-mono"
                          >
                            {product.cfg_code}
                          </Text>
                        </td>
                        <td className="px-6 py-4">
                          <Text variant="small" weight="medium">
                            {product.peptide_name}
                          </Text>
                          {product.protein_name && (
                            <Text variant="caption" muted className="block">
                              {product.protein_name}
                            </Text>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {isOnSale ? (
                            <div>
                              <Text variant="small" weight="medium">
                                {formatPrice(product.price)}
                              </Text>
                              <Text
                                variant="caption"
                                muted
                                className="block line-through"
                              >
                                {formatPrice(product.compare_at_price!)}
                              </Text>
                            </div>
                          ) : (
                            <Text variant="small" weight="medium">
                              {formatPrice(product.price)}
                            </Text>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Text
                            variant="small"
                            weight="medium"
                            className={isLowStock ? 'text-red-600' : ''}
                          >
                            {product.stock_quantity}
                          </Text>
                          {isLowStock && (
                            <Text
                              variant="caption"
                              className="block text-red-500"
                            >
                              Low
                            </Text>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {product.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isOnSale ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                              <Tag className="h-3 w-3" />
                              {product.sale_label || 'SALE'}
                            </span>
                          ) : (
                            <Text variant="caption" muted>
                              —
                            </Text>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingProductId(product.id)}
                              className="inline-flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="rounded-sm border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Section>

      {/* Product Editor Modal */}
      {editingProductId && (
        <ProductEditor
          productId={editingProductId}
          onClose={() => setEditingProductId(null)}
          onSave={() => {
            setEditingProductId(null);
            loadProducts();
            showToast('Product updated', 'success');
          }}
        />
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadProducts();
            showToast('Product created', 'success');
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <Heading level={3} id="delete-product-title" className="mb-1">
                  Delete this product?
                </Heading>
                <Text variant="small" className="text-carbon-600">
                  This will permanently remove the product and all its images.
                  This cannot be undone.
                </Text>
              </div>
            </div>

            <div className="mb-6 rounded-sm bg-grey/30 p-3 text-sm">
              <div className="font-mono text-carbon-900">
                {deleteTarget.cfg_code}
              </div>
              <div className="text-carbon-600">
                {deleteTarget.peptide_name} — {formatPrice(deleteTarget.price)}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
