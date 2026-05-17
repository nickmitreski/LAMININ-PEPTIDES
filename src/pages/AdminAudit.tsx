import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import AdminNavigation from '../components/admin/AdminNavigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Section from '../components/layout/Section';
import Skeleton from '../components/ui/Skeleton';
import { Heading, Text } from '../components/ui/Typography';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { listAuditLog, type AuditLogRow } from '../services/auditLog';

const PAGE_SIZE = 100;

const TABLE_OPTIONS = [
  { value: '', label: 'All tables' },
  { value: 'payment_tracking', label: 'Orders' },
  { value: 'product_mappings', label: 'Products' },
  { value: 'customers', label: 'Customers' },
  { value: 'discount_codes', label: 'Discounts' },
] as const;

const SINCE_OPTIONS = [
  { value: '', label: 'All time' },
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const;

function isoSinceWindow(value: string): string | undefined {
  if (!value) return undefined;
  const now = Date.now();
  const ms =
    value === '1h' ? 60 * 60 * 1000
    : value === '24h' ? 24 * 60 * 60 * 1000
    : value === '7d' ? 7 * 24 * 60 * 60 * 1000
    : value === '30d' ? 30 * 24 * 60 * 60 * 1000
    : 0;
  if (!ms) return undefined;
  return new Date(now - ms).toISOString();
}

/** Render a small "Order LM-XXX" link when the target table is payment_tracking. */
function TargetLink({ row }: { row: AuditLogRow }) {
  if (row.target_table === 'payment_tracking' && row.target_id) {
    return (
      <Link
        to={`/admin/orders/${encodeURIComponent(row.target_id)}`}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 font-mono text-xs text-accent-700 hover:text-accent-900 hover:underline"
      >
        {row.target_id.length > 8 ? `${row.target_id.slice(0, 8)}…` : row.target_id}
        <ExternalLink className="h-3 w-3" />
      </Link>
    );
  }
  return (
    <span className="font-mono text-xs text-carbon-700">
      {row.target_id
        ? row.target_id.length > 16
          ? `${row.target_id.slice(0, 16)}…`
          : row.target_id
        : '—'}
    </span>
  );
}

function ExpandableJson({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false);
  if (value === null || value === undefined) {
    return <span className="text-xs text-carbon-400">—</span>;
  }
  return (
    <details
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="text-xs"
    >
      <summary className="cursor-pointer text-carbon-600 hover:text-carbon-900">
        {open ? 'Hide' : 'Show'}
      </summary>
      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-sm bg-carbon-50 p-2 font-mono text-[0.65rem] leading-snug text-carbon-800">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export default function AdminAudit() {
  useDocumentTitle('Audit log', 'Admin audit trail');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [params, setParams] = useSearchParams();

  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [page, setPage] = useState(0);

  const action = params.get('action') ?? '';
  const targetTable = params.get('table') ?? '';
  const sinceWindow = params.get('since') ?? '';

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value); else next.delete(key);
      setPage(0);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (opts.silent) setRefreshing(true); else setLoading(true);
      try {
        const result = await listAuditLog(
          {
            action: action || undefined,
            targetTable: targetTable || undefined,
            since: isoSinceWindow(sinceWindow),
          },
          getAdminSupabase(),
          PAGE_SIZE,
          page * PAGE_SIZE
        );
        setRows(result.rows);
        setMissingTable(result.missingTable);
      } finally {
        if (opts.silent) setRefreshing(false); else setLoading(false);
      }
    },
    [action, targetTable, sinceWindow, page]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const hasFilters = !!(action || targetTable || sinceWindow);
  const hasMore = rows.length === PAGE_SIZE;

  const formattedRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        whenLocal: new Date(r.created_at).toLocaleString('en-AU', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      })),
    [rows]
  );

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Heading level={2} className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-accent" />
              Audit log
            </Heading>
            <Text muted className="mt-1">
              Append-only record of admin actions — see who did what, when.
            </Text>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {missingTable && (
          <Card className="mb-6 border-warning-border bg-warning-light p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <Text weight="medium" className="text-warning-text">
                  The audit log table doesn't exist yet on this Supabase project.
                </Text>
                <Text variant="small" className="mt-1 text-warning-text">
                  Apply migration{' '}
                  <code className="font-mono">
                    20260517120000_order_status_history_and_audit_log.sql
                  </code>{' '}
                  with <code className="font-mono">supabase db push</code> (or paste it
                  into the SQL editor). Until then, admin actions still work — they just
                  aren't being audited.
                </Text>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                Action contains
              </Text>
              <input
                type="text"
                value={action}
                onChange={(e) => updateFilter('action', e.target.value)}
                placeholder="e.g. order. or delete"
                className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </label>
            <label className="block">
              <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                Table
              </Text>
              <select
                value={targetTable}
                onChange={(e) => updateFilter('table', e.target.value)}
                className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              >
                {TABLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <Text variant="caption" weight="medium" className="mb-1.5 block uppercase tracking-wide">
                When
              </Text>
              <select
                value={sinceWindow}
                onChange={(e) => updateFilter('since', e.target.value)}
                className="w-full rounded-sm border border-carbon-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              >
                {SINCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setPage(0);
                setParams({}, { replace: true });
              }}
              className="mt-3 text-xs text-accent-700 hover:text-accent-900 hover:underline"
            >
              Clear filters
            </button>
          )}
        </Card>

        <Card padding="none" className="overflow-hidden">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Text muted>
                {hasFilters
                  ? 'No audit rows match these filters.'
                  : missingTable
                  ? 'Apply the migration to see audit rows here.'
                  : 'No audit activity yet — admin actions will appear here as they happen.'}
              </Text>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="border-b border-carbon-200 bg-carbon-50 text-left text-xs uppercase tracking-wide text-carbon-500">
                  <tr>
                    <th className="px-4 py-2.5">When</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">Target</th>
                    <th className="px-4 py-2.5">Actor</th>
                    <th className="px-4 py-2.5">Before</th>
                    <th className="px-4 py-2.5">After</th>
                    <th className="px-4 py-2.5">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-100">
                  {formattedRows.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-carbon-700">
                        {r.whenLocal}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <span className="inline-flex items-center rounded-sm bg-carbon-100 px-1.5 py-0.5 font-mono text-[0.7rem] text-carbon-800">
                          {r.action}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-carbon-500">{r.target_table}</span>
                          <TargetLink row={r} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-[0.7rem] text-carbon-700">
                        {r.actor ? `${r.actor.slice(0, 8)}…` : '—'}
                      </td>
                      <td className="px-4 py-2 max-w-xs">
                        <ExpandableJson value={r.before} />
                      </td>
                      <td className="px-4 py-2 max-w-xs">
                        <ExpandableJson value={r.after} />
                      </td>
                      <td className="px-4 py-2 max-w-xs">
                        <Text variant="caption" className="break-words">
                          {r.note ?? <span className="text-carbon-400">—</span>}
                        </Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {(page > 0 || hasMore) && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              ← Previous
            </Button>
            <Text variant="caption" muted>
              Page {page + 1}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || loading}
            >
              Next →
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
}
