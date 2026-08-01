import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Copy,
  Check,
  X,
  Percent,
  DollarSign,
  Users,
  Download,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import {
  getAllDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  getRedemptionsForCode,
  getRedemptionsInRange,
  type DiscountCode,
  type DiscountRedemption,
} from '../services/discountService';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { Heading, Text } from '../components/ui/Typography';
import { useToast } from '../context/ToastContext';
import AdminNavigation from '../components/admin/AdminNavigation';
import { formatPrice } from '../lib/formatCurrency';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function utcMonthBounds(ym: string): { startIso: string; endIsoExclusive: string } {
  const [y, m] = ym.split('-').map(Number);
  return {
    startIso: new Date(Date.UTC(y, m - 1, 1)).toISOString(),
    endIsoExclusive: new Date(Date.UTC(y, m, 1)).toISOString(),
  };
}

function csvEscape(cell: string | number | null | undefined): string {
  const s = cell == null ? '' : String(cell);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type ModalMode = 'create' | 'edit' | null;

const EMPTY_FORM: Omit<DiscountCode, 'id' | 'redemption_count' | 'created_at' | 'updated_at'> = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: null,
  max_redemptions: null,
  valid_from: new Date().toISOString().slice(0, 16),
  valid_until: null,
  is_active: true,
};

export default function AdminDiscounts() {
  useDocumentTitle("Discount Codes", "Create and manage discount codes.");
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { showToast } = useToast();

  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redemptions viewer
  const [viewingRedemptions, setViewingRedemptions] = useState<DiscountCode | null>(null);
  const [redemptions, setRedemptions] = useState<DiscountRedemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  // Clipboard
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [exportingCsv, setExportingCsv] = useState(false);

  const loadCodes = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const db = getAdminSupabase();
        const data = await getAllDiscountCodes(db);
        if (isMountedRef.current) setCodes(data);
      } catch {
        if (isMountedRef.current && !silent) {
          showToast('Failed to load discount codes', 'error');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    isMountedRef.current = true;
    void loadCodes();
    return () => { isMountedRef.current = false; };
  }, [loadCodes]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleExportRedemptionsCsv = async () => {
    setExportingCsv(true);
    try {
      const db = getAdminSupabase();
      const { startIso, endIsoExclusive } = utcMonthBounds(exportMonth);
      const rows = await getRedemptionsInRange(startIso, endIsoExclusive, db);
      const lines: string[] = [
        [
          'created_at',
          'order_reference',
          'customer_email',
          'discount_code',
          'discount_type',
          'discount_value',
          'discount_amount',
        ].join(','),
      ];
      for (const r of rows) {
        lines.push(
          [
            csvEscape(r.created_at),
            csvEscape(r.order_reference),
            csvEscape(r.customer_email),
            csvEscape(r.discount_code?.code),
            csvEscape(r.discount_code?.discount_type),
            csvEscape(r.discount_code?.discount_value),
            csvEscape(r.discount_amount),
          ].join(',')
        );
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `discount-redemptions-${exportMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`Exported ${rows.length} redemption row(s)`, 'success');
    } catch {
      showToast('CSV export failed', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  const openCreate = () => {
    setFormData({ ...EMPTY_FORM, valid_from: new Date().toISOString().slice(0, 16) });
    setEditingId(null);
    setModalMode('create');
  };

  const openEdit = (code: DiscountCode) => {
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_order_amount: code.min_order_amount,
      max_discount_amount: code.max_discount_amount,
      max_redemptions: code.max_redemptions,
      valid_from: code.valid_from ? new Date(code.valid_from).toISOString().slice(0, 16) : '',
      valid_until: code.valid_until ? new Date(code.valid_until).toISOString().slice(0, 16) : null,
      is_active: code.is_active,
    });
    setEditingId(code.id);
    setModalMode('edit');
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      showToast('Code is required', 'error');
      return;
    }
    if (formData.discount_value <= 0) {
      showToast('Discount value must be greater than 0', 'error');
      return;
    }

    setSaving(true);
    const db = getAdminSupabase();

    try {
      if (modalMode === 'create') {
        const result = await createDiscountCode(formData, db);
        if (result.success) {
          showToast(`Code "${formData.code}" created`, 'success');
          setModalMode(null);
          void loadCodes({ silent: true });
        } else {
          showToast(result.error || 'Failed to create code', 'error');
        }
      } else if (modalMode === 'edit' && editingId) {
        const result = await updateDiscountCode(editingId, formData, db);
        if (result.success) {
          showToast('Code updated', 'success');
          setModalMode(null);
          void loadCodes({ silent: true });
        } else {
          showToast(result.error || 'Failed to update code', 'error');
        }
      }
    } catch {
      showToast('An error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    const db = getAdminSupabase();
    const result = await updateDiscountCode(code.id, { is_active: !code.is_active }, db);
    if (result.success) {
      showToast(`Code ${code.is_active ? 'disabled' : 'enabled'}`, 'success');
      void loadCodes({ silent: true });
    } else {
      showToast(result.error || 'Failed to toggle code', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const db = getAdminSupabase();
    const result = await deleteDiscountCode(deleteTarget.id, db);
    if (result.success) {
      showToast(`Deleted code "${deleteTarget.code}"`, 'success');
      setDeleteTarget(null);
      void loadCodes({ silent: true });
    } else {
      showToast(result.error || 'Failed to delete code', 'error');
    }
    setIsDeleting(false);
  };

  const openRedemptions = async (code: DiscountCode) => {
    setViewingRedemptions(code);
    setRedemptionsLoading(true);
    const db = getAdminSupabase();
    const data = await getRedemptionsForCode(code.id, db);
    setRedemptions(data);
    setRedemptionsLoading(false);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1500);
    } catch {
      showToast('Could not copy', 'error');
    }
  };

  // Stats
  const activeCount = codes.filter((c) => c.is_active).length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.redemption_count, 0);

  return (
    <div className="admin-page min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Heading level={1} className="mb-1">Discount Codes</Heading>
            <Text className="text-carbon-600">
              Create and manage promotional discount codes for checkout.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {refreshing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-accent-700">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Refreshing…
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => void loadCodes()} disabled={loading || refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New code
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card padding="md">
            <Text variant="caption" muted className="mb-1 block uppercase tracking-wider">Total codes</Text>
            <Text variant="body" weight="semibold" className="text-2xl">{codes.length}</Text>
          </Card>
          <Card padding="md">
            <Text variant="caption" muted className="mb-1 block uppercase tracking-wider">Active</Text>
            <Text variant="body" weight="semibold" className="text-2xl text-success-dark">{activeCount}</Text>
          </Card>
          <Card padding="md">
            <Text variant="caption" muted className="mb-1 block uppercase tracking-wider">Total uses</Text>
            <Text variant="body" weight="semibold" className="text-2xl">{totalRedemptions}</Text>
          </Card>
          <Card padding="md">
            <Text variant="caption" muted className="mb-1 block uppercase tracking-wider">Inactive</Text>
            <Text variant="body" weight="semibold" className="text-2xl text-neutral-500">{codes.length - activeCount}</Text>
          </Card>
        </div>

        <Card padding="md" className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Heading level={4} className="mb-1 text-base">
                Redemption export
              </Heading>
              <Text variant="caption" muted>
                Download all discount redemptions for a calendar month (UTC boundaries).
              </Text>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="export-month" className="mb-1 block text-xs font-medium text-carbon-600">
                  Month
                </label>
                <input
                  id="export-month"
                  type="month"
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="min-h-11 rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={exportingCsv}
                onClick={() => void handleExportRedemptionsCsv()}
                className="touch-manipulation inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exportingCsv ? 'Exporting…' : 'Download CSV'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Codes table */}
        <Card padding="none">
          {loading ? (
            <div role="status" aria-busy="true" aria-label="Loading discount codes">
              <div className="border-b border-carbon-900/10 bg-grey/30 px-6 py-3">
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="divide-y divide-carbon-900/10">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-6 px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 flex-1 max-w-[10rem]" />
                    <Skeleton className="h-5 w-20" rounded="full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ) : codes.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <Text variant="body" muted className="mb-1">No discount codes yet</Text>
              <Button variant="outline" size="sm" onClick={openCreate} className="mt-3">
                <Plus className="mr-2 h-4 w-4" /> Create your first code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-carbon-900/10 bg-grey/30">
                  <tr>
                    <th className="px-6 py-3 text-left th-label">Code</th>
                    <th className="px-6 py-3 text-left th-label">Discount</th>
                    <th className="px-6 py-3 text-left th-label">Status</th>
                    <th className="px-6 py-3 text-left th-label">Uses</th>
                    <th className="px-6 py-3 text-left th-label">Valid</th>
                    <th className="px-6 py-3 text-left th-label">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-900/10">
                  {codes.map((code) => {
                    const isExpired = code.valid_until && new Date(code.valid_until) < new Date();
                    const isMaxedOut = code.max_redemptions !== null && code.redemption_count >= code.max_redemptions;

                    return (
                      <tr key={code.id} className="hover:bg-grey/20 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-carbon-900">{code.code}</span>
                            <button
                              type="button"
                              onClick={() => void handleCopyCode(code.code)}
                              className="rounded p-1 text-neutral-400 transition-colors hover:bg-grey/40 hover:text-carbon-700"
                              title="Copy code"
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          {code.description && (
                            <Text variant="caption" muted className="mt-0.5 block max-w-[14rem] truncate">
                              {code.description}
                            </Text>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {code.discount_type === 'percentage' ? (
                              <Percent className="h-3.5 w-3.5 text-accent-600" />
                            ) : (
                              <DollarSign className="h-3.5 w-3.5 text-accent-600" />
                            )}
                            <span className="text-sm font-medium">
                              {code.discount_type === 'percentage'
                                ? `${code.discount_value}%`
                                : formatPrice(code.discount_value)}
                            </span>
                            {code.min_order_amount > 0 && (
                              <span className="text-xs text-neutral-500">
                                (min {formatPrice(code.min_order_amount)})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {!code.is_active ? (
                            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-carbon-900">
                              Disabled
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center rounded-full border border-error-border bg-error-muted px-2.5 py-0.5 text-xs font-medium text-error-text">
                              Expired
                            </span>
                          ) : isMaxedOut ? (
                            <span className="inline-flex items-center rounded-full border border-warning-border bg-warning-muted px-2.5 py-0.5 text-xs font-medium text-warning-text">
                              Maxed out
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-success-border bg-success-muted px-2.5 py-0.5 text-xs font-medium text-success-text">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            type="button"
                            onClick={() => void openRedemptions(code)}
                            className="text-sm text-accent-700 underline-offset-2 hover:underline"
                          >
                            {code.redemption_count}
                            {code.max_redemptions !== null ? ` / ${code.max_redemptions}` : ''}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-carbon-700">
                          {code.valid_until ? (
                            <span title={`${formatDateTime(code.valid_from)} — ${formatDateTime(code.valid_until)}`}>
                              {formatDate(code.valid_from)} — {formatDate(code.valid_until)}
                            </span>
                          ) : (
                            <span title={`From ${formatDateTime(code.valid_from)}`}>
                              {formatDate(code.valid_from)} — No expiry
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleToggleActive(code)}
                              className="rounded-sm border border-carbon-900/20 p-2 text-carbon-900 transition-colors hover:bg-grey/30 hover:text-carbon-900"
                              title={code.is_active ? 'Disable' : 'Enable'}
                            >
                              {code.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(code)}
                              className="rounded-sm border border-carbon-900/20 p-2 text-carbon-900 transition-colors hover:bg-grey/30 hover:text-carbon-900"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void openRedemptions(code)}
                              className="rounded-sm border border-carbon-900/20 p-2 text-carbon-900 transition-colors hover:bg-grey/30 hover:text-carbon-900"
                              title="View uses"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(code)}
                              className="rounded-sm border border-error-border p-2 text-error transition-colors hover:bg-error-light hover:text-error-dark"
                              title="Delete"
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

      {/* Create / Edit Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !saving && setModalMode(null)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <Heading level={3}>
                {modalMode === 'create' ? 'Create discount code' : 'Edit discount code'}
              </Heading>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="rounded p-1 text-neutral-400 hover:text-carbon-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. WELCOME10"
                  className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 font-mono text-sm uppercase tracking-wider focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                  Description (internal note)
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Welcome offer for new customers"
                  className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                    Type
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      }))
                    }
                    className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                    Value
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                    Min order ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, min_order_amount: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                    Max discount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_discount_amount ?? ''}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        max_discount_amount: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    placeholder="No cap"
                    className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                  Max redemptions
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.max_redemptions ?? ''}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      max_redemptions: e.target.value ? parseInt(e.target.value, 10) : null,
                    }))
                  }
                  placeholder="Unlimited"
                  className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                    Valid from
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.valid_from ? formData.valid_from.slice(0, 16) : ''}
                    onChange={(e) => setFormData((f) => ({ ...f, valid_from: e.target.value }))}
                    className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-carbon-900">
                    Valid until
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.valid_until ? formData.valid_until.slice(0, 16) : ''}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        valid_until: e.target.value || null,
                      }))
                    }
                    className="w-full rounded-sm border border-carbon-900/20 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-900"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Leave blank for no expiry</p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-carbon-300 text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-carbon-900">Active (customers can use this code)</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setModalMode(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
                {saving ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                ) : modalMode === 'create' ? (
                  <><Plus className="mr-2 h-4 w-4" /> Create code</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" /> Save changes</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-error-muted">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div>
                <Heading level={3} className="mb-1">Delete this code?</Heading>
                <Text variant="small" className="text-carbon-600">
                  This will permanently remove the discount code and all its redemption records.
                </Text>
              </div>
            </div>
            <div className="mb-6 rounded-sm bg-grey/30 p-3">
              <span className="font-mono text-sm font-semibold text-carbon-900">{deleteTarget.code}</span>
              <span className="ml-2 text-xs text-carbon-600">
                ({deleteTarget.redemption_count} redemption{deleteTarget.redemption_count !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-sm bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 className="mr-2 h-4 w-4" /> Delete code</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redemptions viewer */}
      {viewingRedemptions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewingRedemptions(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Heading level={3} className="mb-1">
                  Redemptions — <span className="font-mono">{viewingRedemptions.code}</span>
                </Heading>
                <Text variant="small" muted>
                  {viewingRedemptions.discount_type === 'percentage'
                    ? `${viewingRedemptions.discount_value}% off`
                    : `${formatPrice(viewingRedemptions.discount_value)} off`}
                  {' · '}{viewingRedemptions.redemption_count} total use{viewingRedemptions.redemption_count !== 1 ? 's' : ''}
                </Text>
              </div>
              <button
                type="button"
                onClick={() => setViewingRedemptions(null)}
                className="rounded p-1 text-neutral-400 hover:text-carbon-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {redemptionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : redemptions.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
                <Text muted>No redemptions yet</Text>
              </div>
            ) : (
              <div className="-mx-3 overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead className="border-b border-carbon-900/10">
                    <tr>
                      <th className="px-3 py-2 text-left th-label">Order</th>
                      <th className="px-3 py-2 text-left th-label">Customer</th>
                      <th className="px-3 py-2 text-left th-label">Saved</th>
                      <th className="px-3 py-2 text-left th-label">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon-900/10">
                    {redemptions.map((r) => (
                      <tr key={r.id}>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-sm">{r.order_reference}</td>
                        <td className="px-3 py-3 text-sm text-carbon-700">{r.customer_email || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-success-dark">
                          &minus;{formatPrice(r.discount_amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm text-carbon-700">
                          {formatDateTime(r.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
