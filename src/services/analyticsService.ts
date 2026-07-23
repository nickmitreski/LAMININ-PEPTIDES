import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '../lib/logger';
import type { HeatmapPoint } from '../components/analytics/ClickHeatmapPreview';
import type { AbandonedSession } from '../components/analytics/AbandonedCheckoutPanel';
import type { CheckoutFunnel } from '../features/analytics/funnel';

const log = createLogger('analytics');

export type AnalyticsSummary = {
  visits: number;
  uniqueVisitors: number;
  pageViews: number;
  clicks: number;
  checkoutStarts: number;
  checkoutSubmits: number;
  checkoutSuccess: number;
  checkoutAbandoned: number;
  abandonmentRate: number;
  averageDuration: number;
  averageAbandon: number;
  heatmapEvents: number;
  eventsLoaded: number;
  funnel: CheckoutFunnel;
  topPages: [string, number][];
  topClicks: [string, number][];
  topCountries: [string, number][];
  topRegions: [string, number][];
  topReferrers: [string, number][];
  visitsByHour: [string, number][];
  heatmapPoints: HeatmapPoint[];
  recentAbandons: AbandonedSession[];
};

type CountRow = { label: string; count: number };

function pairs(rows: CountRow[] | null | undefined): [string, number][] {
  return (rows ?? []).map((r) => [r.label, r.count]);
}

function parseFunnel(raw: unknown): CheckoutFunnel {
  const f = (raw ?? {}) as Record<string, unknown>;
  return {
    cartViews: Number(f.cart_views ?? 0),
    checkoutStarts: Number(f.checkout_starts ?? 0),
    checkoutSubmits: Number(f.checkout_submits ?? 0),
    checkoutSuccess: Number(f.checkout_success ?? 0),
    checkoutAbandoned: Number(f.checkout_abandoned ?? 0),
  };
}

function parseAbandons(raw: unknown): AbandonedSession[] {
  const rows = (raw ?? []) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    sessionId: String(r.session_id ?? ''),
    cartTotal: Number(r.cart_total ?? 0),
    cartItemCount: Number(r.cart_item_count ?? 0),
    durationMs: Number(r.duration_ms ?? 0),
    lastAt: String(r.last_at ?? ''),
  }));
}

export async function fetchAnalyticsSummary(
  client: SupabaseClient,
  sinceIso: string
): Promise<AnalyticsSummary | null> {
  const { data, error } = await client.rpc('admin_analytics_summary', {
    p_since: sinceIso,
  });

  if (error) {
    log.warn('admin_analytics_summary RPC unavailable', error.message);
    return null;
  }

  const raw = data as Record<string, unknown>;
  const starts = Number(raw.checkout_starts ?? 0);
  const abandoned = Number(raw.checkout_abandoned ?? 0);

  return {
    visits: Number(raw.visits ?? 0),
    uniqueVisitors: Number(raw.unique_visitors ?? raw.visits ?? 0),
    pageViews: Number(raw.page_views ?? 0),
    clicks: Number(raw.clicks ?? 0),
    checkoutStarts: starts,
    checkoutSubmits: Number(raw.checkout_submits ?? 0),
    checkoutSuccess: Number(raw.checkout_success ?? 0),
    checkoutAbandoned: abandoned,
    abandonmentRate: starts ? (abandoned / starts) * 100 : 0,
    averageDuration: Number(raw.avg_page_duration_ms ?? 0),
    averageAbandon: Number(raw.avg_abandon_duration_ms ?? 0),
    heatmapEvents: Number(raw.heatmap_clicks ?? 0),
    eventsLoaded: Number(raw.events_loaded ?? 0),
    funnel: parseFunnel(raw.funnel),
    topPages: pairs(raw.top_pages as CountRow[]),
    topClicks: pairs(raw.top_clicks as CountRow[]),
    topCountries: pairs(raw.top_countries as CountRow[]),
    topRegions: pairs(raw.top_regions as CountRow[]),
    topReferrers: pairs(raw.top_referrers as CountRow[]),
    visitsByHour: pairs(raw.visits_by_hour as CountRow[]),
    heatmapPoints: (raw.heatmap_points as HeatmapPoint[]) ?? [],
    recentAbandons: parseAbandons(raw.recent_abandons),
  };
}
