import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Clock,
  Globe2,
  MousePointerClick,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react';
import AdminNavigation from '../components/admin/AdminNavigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Section from '../components/layout/Section';
import Skeleton from '../components/ui/Skeleton';
import { Heading, Text } from '../components/ui/Typography';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import ClickHeatmapPreview from '../components/analytics/ClickHeatmapPreview';
import CheckoutFunnelChart from '../components/analytics/CheckoutFunnelChart';
import AbandonedCheckoutPanel from '../components/analytics/AbandonedCheckoutPanel';
import { funnelSteps } from '../features/analytics/funnel';
import { fetchAnalyticsSummary, type AnalyticsSummary } from '../services/analyticsService';

type AnalyticsRow = {
  id: string;
  session_id: string;
  event_name: string;
  path: string | null;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  duration_ms: number | null;
  cart_total: number | null;
  cart_item_count: number | null;
  element_tag: string | null;
  element_text: string | null;
  element_role: string | null;
  element_href: string | null;
  click_x: number | null;
  click_y: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  created_at: string;
};

type SinceOption = '24h' | '7d' | '30d';

const SINCE_OPTIONS: { value: SinceOption; label: string; days: number }[] = [
  { value: '24h', label: 'Last 24 hours', days: 1 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
];

function sinceIso(value: SinceOption): string {
  const option = SINCE_OPTIONS.find((item) => item.value === value) ?? SINCE_OPTIONS[1];
  return new Date(Date.now() - option.days * 24 * 60 * 60 * 1000).toISOString();
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function percent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function topCounts(rows: string[], limit = 8) {
  const counts = new Map<string, number>();
  rows.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Text variant="small" className="text-carbon-500">
            {label}
          </Text>
          <div className="mt-2 text-2xl font-semibold text-carbon-950">{value}</div>
          <Text variant="small" className="mt-1 text-carbon-500">
            {detail}
          </Text>
        </div>
        <div className="rounded-sm bg-accent-50 p-2 text-accent-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function CountList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: [string, number][];
  empty: string;
}) {
  return (
    <Card className="p-4">
      <Text weight="medium" className="mb-3 text-carbon-900">
        {title}
      </Text>
      {rows.length === 0 ? (
        <Text variant="small" muted>{empty}</Text>
      ) : (
        <div className="space-y-3">
          {rows.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-carbon-700">{label}</span>
              <span className="shrink-0 rounded-sm bg-carbon-100 px-2 py-1 text-xs font-medium text-carbon-800">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminAnalytics() {
  useDocumentTitle('Analytics', 'Admin analytics');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [since, setSince] = useState<SinceOption>('7d');
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [rpcData, setRpcData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      const client = getAdminSupabase();
      if (!client) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }

      if (silent) setRefreshing(true); else setLoading(true);
      setError(null);

      const sinceTs = sinceIso(since);
      const rpcSummary = await fetchAnalyticsSummary(client, sinceTs);

      if (rpcSummary) {
        setRows([]);
        setRpcData(rpcSummary);
        if (silent) setRefreshing(false); else setLoading(false);
        return;
      }

      setRpcData(null);

      const { data, error: queryError } = await client
        .from('analytics_events')
        .select('id, session_id, event_name, path, referrer, country, region, city, duration_ms, cart_total, cart_item_count, element_tag, element_text, element_role, element_href, click_x, click_y, viewport_width, viewport_height, created_at')
        .gte('created_at', sinceTs)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (queryError) {
        setError(queryError.message);
        setRows([]);
      } else {
        setRows((data ?? []) as AnalyticsRow[]);
      }

      if (silent) setRefreshing(false); else setLoading(false);
    },
    [since]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo((): AnalyticsSummary => {
    if (rpcData) return rpcData;

    const sessions = new Set(rows.map((row) => row.session_id));
    const pageViews = rows.filter(
      (row) =>
        row.event_name === 'page_view' &&
        !(row.path || '').toLowerCase().startsWith('/admin')
    );
    const clicks = rows.filter((row) => row.event_name === 'click');
    const checkoutStarts = rows.filter((row) =>
      row.event_name === 'checkout_start' || row.event_name === 'checkout_started'
    );
    const checkoutSubmits = rows.filter((row) => row.event_name === 'checkout_submit');
    const checkoutSuccess = rows.filter((row) => row.event_name === 'checkout_success');
    const checkoutAbandoned = rows.filter((row) => row.event_name === 'checkout_abandoned');
    const cartViews = pageViews.filter((row) => row.path === '/cart');
    const leaveDurations = rows
      .filter((row) => row.event_name === 'page_leave' && typeof row.duration_ms === 'number')
      .map((row) => row.duration_ms ?? 0);
    const abandonedDurations = checkoutAbandoned
      .filter((row) => typeof row.duration_ms === 'number')
      .map((row) => row.duration_ms ?? 0);
    const averageDuration = leaveDurations.length
      ? leaveDurations.reduce((sum, item) => sum + item, 0) / leaveDurations.length
      : 0;
    const averageAbandon = abandonedDurations.length
      ? abandonedDurations.reduce((sum, item) => sum + item, 0) / abandonedDurations.length
      : 0;

    return {
      visits: sessions.size,
      uniqueVisitors: sessions.size,
      pageViews: pageViews.length,
      clicks: clicks.length,
      checkoutStarts: checkoutStarts.length,
      checkoutSubmits: checkoutSubmits.length,
      checkoutSuccess: checkoutSuccess.length,
      checkoutAbandoned: checkoutAbandoned.length,
      abandonmentRate: checkoutStarts.length ? (checkoutAbandoned.length / checkoutStarts.length) * 100 : 0,
      averageDuration,
      averageAbandon,
      funnel: {
        cartViews: cartViews.length,
        checkoutStarts: checkoutStarts.length,
        checkoutSubmits: checkoutSubmits.length,
        checkoutSuccess: checkoutSuccess.length,
        checkoutAbandoned: checkoutAbandoned.length,
      },
      topPages: topCounts(pageViews.map((row) => row.path ?? 'Unknown')),
      topClicks: topCounts(
        clicks.map((row) => row.element_text?.trim() || row.element_role || row.element_href || row.element_tag || 'Unknown click')
      ),
      topCountries: topCounts(rows.map((row) => row.country || 'Unknown')),
      topRegions: topCounts(rows.map((row) => row.region || 'Unknown')),
      topReferrers: topCounts(rows.map((row) => row.referrer || 'Direct / unknown')),
      visitsByHour: topCounts(
        pageViews.map((row) =>
          new Date(row.created_at).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            hour12: false,
          })
        ),
        24
      ).sort((a, b) => a[0].localeCompare(b[0])),
      heatmapEvents: clicks.filter((row) => row.click_x !== null && row.click_y !== null).length,
      eventsLoaded: rows.length,
      heatmapPoints: clicks
        .filter((row) => row.click_x !== null && row.click_y !== null)
        .slice(0, 800)
        .map((row) => ({
          x: row.click_x ?? 0,
          y: row.click_y ?? 0,
          vw: row.viewport_width ?? 390,
          vh: row.viewport_height ?? 844,
        })),
      recentAbandons: checkoutAbandoned.slice(0, 10).map((row) => ({
        sessionId: row.session_id,
        cartTotal: row.cart_total ?? 0,
        cartItemCount: row.cart_item_count ?? 0,
        durationMs: row.duration_ms ?? 0,
        lastAt: row.created_at,
      })),
    };
  }, [rows, rpcData]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-platinum">
      <AdminNavigation onLogout={handleLogout} />

      <Section spacing="lg">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Heading level={2} className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" />
              Analytics
            </Heading>
            <Text muted className="mt-1">
              Visits, clicks, checkout drop-off, location, and heatmap-ready events.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={since}
              onChange={(event) => setSince(event.target.value as SinceOption)}
              className="rounded-sm border border-carbon-200 bg-white px-3 py-2 text-sm text-carbon-900"
            >
              {SINCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-warning-border bg-warning-light p-4">
            <Text weight="medium" className="text-warning-text">
              Analytics could not load.
            </Text>
            <Text variant="small" className="mt-1 text-warning-text">
              {error}
            </Text>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Activity} label="Visits" value={String(summary.visits)} detail={`${summary.uniqueVisitors ?? summary.visits} unique · ${summary.pageViews} page views`} />
              <StatCard icon={Clock} label="Avg time on page" value={formatDuration(summary.averageDuration)} detail="Based on page leave events" />
              <StatCard icon={MousePointerClick} label="Total clicks" value={String(summary.clicks)} detail={`${summary.heatmapEvents} heatmap-ready clicks`} />
              <StatCard icon={ShoppingCart} label="Checkout starts" value={String(summary.checkoutStarts)} detail={`${summary.checkoutSuccess} completed`} />
              <StatCard icon={TrendingDown} label="Checkout abandoned" value={String(summary.checkoutAbandoned)} detail={`${percent(summary.abandonmentRate)} abandonment rate`} />
              <StatCard icon={Clock} label="Time before abandon" value={formatDuration(summary.averageAbandon)} detail="Average checkout abandonment time" />
              <StatCard icon={Globe2} label="Countries" value={String(summary.topCountries.length)} detail="From host geo headers when present" />
              <StatCard icon={BarChart3} label="Events loaded" value={String(summary.eventsLoaded)} detail={rpcData ? 'Server-side summary' : 'Limited to latest 5000 events'} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <Text weight="medium" className="mb-3 text-carbon-900">
                  Checkout funnel
                </Text>
                <CheckoutFunnelChart steps={funnelSteps(summary.funnel)} />
              </Card>
              <Card className="p-4">
                <Text weight="medium" className="mb-3 text-carbon-900">
                  Recent abandoned checkouts
                </Text>
                <AbandonedCheckoutPanel sessions={summary.recentAbandons} />
              </Card>
              <CountList title="Most visited pages" rows={summary.topPages} empty="No page views yet." />
              <CountList title="Most clicked buttons/links" rows={summary.topClicks} empty="No clicks yet." />
              <CountList title="Traffic by country" rows={summary.topCountries} empty="No location data yet." />
              <CountList title="Traffic by region" rows={summary.topRegions} empty="No region data yet." />
              <CountList title="Traffic sources" rows={summary.topReferrers} empty="No referrers yet." />
              <CountList title="Visits by hour" rows={summary.visitsByHour} empty="No hourly data yet." />
              <Card className="p-4 lg:col-span-2">
                <Text weight="medium" className="mb-3 text-carbon-900">
                  Click heatmap
                </Text>
                <ClickHeatmapPreview points={summary.heatmapPoints} />
              </Card>
            </div>
          </>
        )}
      </Section>
    </div>
  );
}
