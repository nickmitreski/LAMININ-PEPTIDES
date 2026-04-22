import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, CheckCircle, XCircle, Edit } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { getAllProductMappings } from '../services/supabaseService';
import AdminNavigation from '../components/admin/AdminNavigation';
import ProductEditor from '../components/admin/ProductEditor';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';

interface ProductMapping {
  id: string;
  cfg_code: string;
  peptide_name: string;
  protein_name: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level={1} className="mb-2">
              Product Mappings
            </Heading>
            <Text className="text-carbon-600">
              CFG code to protein product mappings
            </Text>
          </div>
          <Button variant="outline" size="sm" onClick={loadProducts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card padding="md" className="border-l-4 border-l-accent">
            <Text variant="small" muted className="mb-1">
              Total Products
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {products.length}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-green-500">
            <Text variant="small" muted className="mb-1">
              Active
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {products.filter((p) => p.is_active).length}
            </Text>
          </Card>
          <Card padding="md" className="border-l-4 border-l-red-500">
            <Text variant="small" muted className="mb-1">
              Inactive
            </Text>
            <Text variant="body" weight="semibold" className="text-2xl">
              {products.filter((p) => !p.is_active).length}
            </Text>
          </Card>
        </div>

        {/* Products Table */}
        <Card padding="none">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-accent-dark" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <Text variant="body" muted>
                No products found
              </Text>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-carbon-900/10 bg-grey/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      CFG Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Peptide Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Protein Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-900/10">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-grey/20">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text variant="small" weight="medium" className="font-mono">
                          {product.cfg_code}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="small" weight="medium">
                          {product.peptide_name}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="small">{product.protein_name}</Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text variant="small" weight="medium">
                          ${product.price.toFixed(2)}
                        </Text>
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
                      <td className="whitespace-nowrap px-6 py-4">
                        <Text variant="small">
                          {new Date(product.updated_at).toLocaleDateString()}
                        </Text>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProductId(product.id)}
                          className="inline-flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
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
            showToast('Product updated successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}
