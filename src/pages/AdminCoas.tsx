import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  History,
  Loader2,
  PackageSearch,
  Plus,
  Search,
} from 'lucide-react';
import AdminNavigation from '../components/admin/AdminNavigation';
import AdminPageHeader from '../components/admin/AdminPageHeader';
import ProductEditor from '../components/admin/ProductEditor';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Section from '../components/layout/Section';
import { Text } from '../components/ui/Typography';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  formatCoaFileSize,
  listAllProductCoas,
  type AdminCoaRow,
} from '../services/coaAdminService';
import { getAllProductMappings } from '../services/productAdminService';
import { CFG_CODE_TO_PEPTIDE_ID } from '../data/productMappings';
import { getCoaDownload } from '../data/coaPdfs';

type ProductOption = Awaited<ReturnType<typeof getAllProductMappings>>[number];

export default function AdminCoas() {
  useDocumentTitle('Certificates', 'Manage product certificates of analysis and batch history.');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [coas, setCoas] = useState<AdminCoaRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const client = getAdminSupabase();
    if (!client) {
      setError('Admin session is unavailable. Sign in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [coaRows, productRows] = await Promise.all([
        listAllProductCoas(client),
        getAllProductMappings(client),
      ]);
      setCoas(coaRows);
      setProducts(productRows);
      setSelectedProductId((current) => current || productRows[0]?.id || '');
    } catch (loadError) {
      const detail = loadError instanceof Error ? loadError.message : 'Unknown error';
      setError(
        detail.includes('product_coas')
          ? 'The COA interface is ready, but its Supabase migration still needs to be deployed.'
          : `Could not load certificates: ${detail}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentByProduct = useMemo(
    () => new Set(coas.filter((coa) => coa.is_current).map((coa) => coa.product_id)),
    [coas]
  );
  const missingCount = products.filter((product) => {
    if (!product.is_active || currentByProduct.has(product.id) || product.coa_link_url) return false;
    const peptideId = CFG_CODE_TO_PEPTIDE_ID[product.cfg_code];
    return !peptideId || !getCoaDownload(peptideId);
  }).length;
  const currentCount = coas.filter((coa) => coa.is_current).length;
  const archivedCount = coas.filter((coa) => coa.status === 'archived').length;

  const filteredCoas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coas;
    return coas.filter((coa) =>
      [
        coa.product?.cfg_code,
        coa.product?.peptide_name,
        coa.batch_number,
        coa.lab_name,
        coa.file_name,
      ].some((value) => value?.toLowerCase().includes(term))
    );
  }, [coas, search]);

  const handleLogout = () => {
    void logout();
    navigate('/admin/login');
  };

  const openSelectedProduct = () => {
    if (!selectedProductId) return;
    setShowProductPicker(false);
    setEditingProductId(selectedProductId);
  };

  return (
    <div className="admin-page min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />
      <Section spacing="lg">
        <AdminPageHeader
          eyebrow="Catalog"
          title="Certificates"
          description="Manage current Certificates of Analysis, batch details, and archived document history across the catalog."
          actions={
            <Button onClick={() => setShowProductPicker((value) => !value)}>
              <Plus className="mr-2 h-4 w-4" /> Add certificate
            </Button>
          }
        />

        {showProductPicker ? (
          <Card padding="md" className="mb-5 border-accent-200 bg-accent-50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1">
                <span className="mb-1.5 block text-sm font-medium text-carbon-800">Choose a product</span>
                <select className="input bg-white" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.cfg_code} — {product.peptide_name}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={openSelectedProduct} disabled={!selectedProductId}>Continue to product editor</Button>
              <Button variant="outline" onClick={() => setShowProductPicker(false)}>Cancel</Button>
            </div>
          </Card>
        ) : null}

        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning-border bg-warning-light p-4 text-warning-text" role="alert">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Backend action required</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Card padding="md" className="border-carbon-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-light text-success"><CheckCircle2 className="h-5 w-5" /></div>
              <div><Text variant="caption" muted>Current certificates</Text><p className="text-2xl font-semibold text-carbon-950">{currentCount}</p></div>
            </div>
          </Card>
          <Card padding="md" className="border-carbon-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-carbon-100 text-carbon-600"><History className="h-5 w-5" /></div>
              <div><Text variant="caption" muted>Archived records</Text><p className="text-2xl font-semibold text-carbon-950">{archivedCount}</p></div>
            </div>
          </Card>
          <Card padding="md" className="border-carbon-200 bg-white">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${missingCount > 0 ? 'bg-warning-light text-warning' : 'bg-success-light text-success'}`}><PackageSearch className="h-5 w-5" /></div>
              <div><Text variant="caption" muted>Active products without a COA</Text><p className="text-2xl font-semibold text-carbon-950">{missingCount}</p></div>
            </div>
          </Card>
        </div>

        <Card padding="md" className="mb-4 border-carbon-200 bg-white">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-carbon-400" />
            <input type="search" className="input input-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, batch, laboratory or file…" aria-label="Search certificates" />
          </label>
        </Card>

        <Card padding="none" className="overflow-hidden border-carbon-200 bg-white">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-carbon-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading certificates…</div>
          ) : filteredCoas.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
              <FileCheck2 className="mb-3 h-10 w-10 text-carbon-300" />
              <p className="font-semibold text-carbon-800">No certificates found</p>
              <p className="mt-1 text-sm text-carbon-500">Upload a certificate from any product’s editor.</p>
            </div>
          ) : (
            <div className="divide-y divide-carbon-100">
              {filteredCoas.map((coa) => (
                <div key={coa.id} className="grid gap-3 p-4 transition-colors hover:bg-carbon-50/70 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-carbon-950">{coa.product?.peptide_name || 'Unknown product'}</p>
                      <span className="rounded bg-carbon-100 px-1.5 py-0.5 font-mono text-[0.65rem] text-carbon-600">{coa.product?.cfg_code || '—'}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${coa.is_current ? 'bg-success-muted text-success-text' : coa.status === 'archived' ? 'bg-carbon-100 text-carbon-600' : 'bg-warning-muted text-warning-text'}`}>{coa.is_current ? 'Current' : coa.status}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-carbon-500">{coa.file_name} · {formatCoaFileSize(coa.file_size)}</p>
                  </div>
                  <div className="text-xs text-carbon-500">
                    <p>{coa.batch_number || 'No batch number'}</p>
                    <p className="mt-1">{[coa.lab_name, coa.test_date].filter(Boolean).join(' · ') || 'Lab details not entered'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={coa.document_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-carbon-200 px-3 text-xs font-medium text-carbon-700 hover:bg-white"><ExternalLink className="h-3.5 w-3.5" /> View</a>
                    <button type="button" onClick={() => setEditingProductId(coa.product_id)} className="inline-flex min-h-10 items-center rounded-lg bg-carbon-950 px-3 text-xs font-medium text-white hover:bg-carbon-800">Manage</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>

      {editingProductId ? (
        <ProductEditor
          productId={editingProductId}
          initialTab="media"
          onClose={() => setEditingProductId(null)}
          onSave={() => {
            setEditingProductId(null);
            void loadData();
          }}
        />
      ) : null}
    </div>
  );
}
