import { useEffect } from 'react';
import { getAdminSupabase } from '../lib/supabaseAdminClient';

const FALLBACK_POLL_INTERVAL_MS = 30_000;

interface Options {
  /** Restrict the realtime subscription to a single row by id. */
  rowId?: string;
  /** Polling fallback when realtime can't subscribe. Defaults to 30s. */
  pollIntervalMs?: number;
  /** Skip subscribing entirely. Used during auth bootstrap. */
  enabled?: boolean;
}

/**
 * Subscribe to changes on `payment_tracking`. When the channel fires (or the
 * tab regains focus), invoke `refresh`. Falls back to interval polling if
 * realtime isn't available (e.g. publication missing, free-tier limit hit).
 *
 * Returns nothing — wire it next to the page's existing data-loading effect.
 *
 * Pass `rowId` to scope the subscription to one order (used by the dedicated
 * /admin/orders/:id page so we don't process every row change in the schema).
 */
export default function usePaymentTrackingRealtime(
  refresh: () => void | Promise<void>,
  opts: Options = {}
) {
  const { rowId, pollIntervalMs = FALLBACK_POLL_INTERVAL_MS, enabled = true } = opts;

  useEffect(() => {
    if (!enabled) return;
    const db = getAdminSupabase();
    let channel: ReturnType<NonNullable<typeof db>['channel']> | null = null;
    let interval: number | undefined;

    const safeRefresh = () => {
      void refresh();
    };

    if (db) {
      // Channel name varies per scope so multiple subscribers can coexist
      // (the dashboard listens to all rows; a detail page listens to one).
      const channelName = rowId
        ? `payment-tracking-row-${rowId}`
        : 'payment-tracking-all';
      const filter: Record<string, unknown> = {
        event: '*',
        schema: 'public',
        table: 'payment_tracking',
      };
      if (rowId) filter.filter = `id=eq.${rowId}`;
      channel = db
        .channel(channelName)
        .on('postgres_changes' as 'system', filter, safeRefresh)
        .subscribe((status: string) => {
          if (status !== 'SUBSCRIBED' && !interval) {
            interval = window.setInterval(() => {
              if (document.visibilityState === 'visible') safeRefresh();
            }, pollIntervalMs);
          }
        });
    } else {
      interval = window.setInterval(() => {
        if (document.visibilityState === 'visible') safeRefresh();
      }, pollIntervalMs);
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') safeRefresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (channel) void db?.removeChannel(channel);
      if (interval) window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refresh, rowId, pollIntervalMs, enabled]);
}
