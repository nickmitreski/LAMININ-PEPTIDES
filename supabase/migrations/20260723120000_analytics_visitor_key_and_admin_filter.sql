-- Analytics: hashed visitor key + exclude /admin paths from summaries.
-- Raw IPs are never stored. visitor_key = sha256(ip || '|' || ua_family).

BEGIN;

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS visitor_key text;

CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_key_created
  ON public.analytics_events (visitor_key, created_at DESC)
  WHERE visitor_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_analytics_summary(p_since timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.jwt_is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN (
  WITH base AS (
    SELECT *
    FROM public.analytics_events
    WHERE created_at >= p_since
      AND (path IS NULL OR path NOT ILIKE '/admin%')
  ),
  sessions AS (
    SELECT
      COUNT(DISTINCT session_id) AS visits,
      COUNT(DISTINCT COALESCE(NULLIF(visitor_key, ''), session_id)) AS unique_visitors
    FROM base
    WHERE event_name = 'page_view'
  ),
  counts AS (
    SELECT
      COUNT(*) FILTER (WHERE event_name = 'page_view') AS page_views,
      COUNT(*) FILTER (WHERE event_name = 'click') AS clicks,
      COUNT(*) FILTER (WHERE event_name IN ('checkout_start', 'checkout_started')) AS checkout_starts,
      COUNT(*) FILTER (WHERE event_name = 'checkout_submit') AS checkout_submits,
      COUNT(*) FILTER (WHERE event_name = 'checkout_success') AS checkout_success,
      COUNT(*) FILTER (WHERE event_name = 'checkout_abandoned') AS checkout_abandoned,
      COUNT(*) FILTER (WHERE event_name = 'click' AND click_x IS NOT NULL AND click_y IS NOT NULL) AS heatmap_clicks,
      COALESCE(AVG(duration_ms) FILTER (WHERE event_name = 'page_leave' AND duration_ms IS NOT NULL), 0) AS avg_page_duration_ms,
      COALESCE(AVG(duration_ms) FILTER (WHERE event_name = 'checkout_abandoned' AND duration_ms IS NOT NULL), 0) AS avg_abandon_duration_ms
    FROM base
  ),
  funnel AS (
    SELECT jsonb_build_object(
      'cart_views', COUNT(*) FILTER (WHERE event_name = 'page_view' AND path = '/cart'),
      'checkout_starts', COUNT(*) FILTER (WHERE event_name IN ('checkout_start', 'checkout_started')),
      'checkout_submits', COUNT(*) FILTER (WHERE event_name = 'checkout_submit'),
      'checkout_success', COUNT(*) FILTER (WHERE event_name = 'checkout_success'),
      'checkout_abandoned', COUNT(*) FILTER (WHERE event_name = 'checkout_abandoned')
    ) AS data
    FROM base
  ),
  top_pages AS (
    SELECT COALESCE(path, 'Unknown') AS label, COUNT(*) AS count
    FROM base WHERE event_name = 'page_view'
    GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  ),
  top_clicks AS (
    SELECT
      COALESCE(NULLIF(TRIM(element_text), ''), element_role, element_href, element_tag, 'Unknown click') AS label,
      COUNT(*) AS count
    FROM base WHERE event_name = 'click'
    GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  ),
  top_countries AS (
    SELECT COALESCE(country, 'Unknown') AS label, COUNT(*) AS count
    FROM base
    GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  ),
  top_regions AS (
    SELECT COALESCE(NULLIF(TRIM(region), ''), 'Unknown') AS label, COUNT(*) AS count
    FROM base WHERE country IS NOT NULL
    GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  ),
  top_referrers AS (
    SELECT COALESCE(referrer, 'Direct / unknown') AS label, COUNT(*) AS count
    FROM base
    GROUP BY 1 ORDER BY 2 DESC LIMIT 8
  ),
  visits_by_hour AS (
    SELECT TO_CHAR(created_at AT TIME ZONE 'Australia/Sydney', 'HH24') AS label, COUNT(*) AS count
    FROM base WHERE event_name = 'page_view'
    GROUP BY 1 ORDER BY 1 ASC
  ),
  recent_abandons AS (
    SELECT
      session_id,
      MAX(cart_total) AS cart_total,
      MAX(cart_item_count) AS cart_item_count,
      MAX(duration_ms) AS duration_ms,
      MAX(created_at) AS last_at
    FROM base
    WHERE event_name = 'checkout_abandoned'
    GROUP BY session_id
    ORDER BY last_at DESC
    LIMIT 10
  ),
  heatmap AS (
    SELECT click_x AS x, click_y AS y, viewport_width AS vw, viewport_height AS vh
    FROM base
    WHERE event_name = 'click' AND click_x IS NOT NULL AND click_y IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 800
  )
  SELECT jsonb_build_object(
    'visits', (SELECT visits FROM sessions),
    'unique_visitors', (SELECT unique_visitors FROM sessions),
    'page_views', (SELECT page_views FROM counts),
    'clicks', (SELECT clicks FROM counts),
    'checkout_starts', (SELECT checkout_starts FROM counts),
    'checkout_submits', (SELECT checkout_submits FROM counts),
    'checkout_success', (SELECT checkout_success FROM counts),
    'checkout_abandoned', (SELECT checkout_abandoned FROM counts),
    'heatmap_clicks', (SELECT heatmap_clicks FROM counts),
    'avg_page_duration_ms', (SELECT avg_page_duration_ms FROM counts),
    'avg_abandon_duration_ms', (SELECT avg_abandon_duration_ms FROM counts),
    'events_loaded', (SELECT COUNT(*) FROM base),
    'funnel', (SELECT data FROM funnel),
    'top_pages', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count)) FROM top_pages), '[]'::jsonb),
    'top_clicks', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count)) FROM top_clicks), '[]'::jsonb),
    'top_countries', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count)) FROM top_countries), '[]'::jsonb),
    'top_regions', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count)) FROM top_regions), '[]'::jsonb),
    'top_referrers', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count)) FROM top_referrers), '[]'::jsonb),
    'visits_by_hour', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'count', count)) FROM visits_by_hour), '[]'::jsonb),
    'recent_abandons', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'session_id', session_id,
        'cart_total', cart_total,
        'cart_item_count', cart_item_count,
        'duration_ms', duration_ms,
        'last_at', last_at
      ))
      FROM recent_abandons
    ), '[]'::jsonb),
    'heatmap_points', COALESCE((SELECT jsonb_agg(jsonb_build_object('x', x, 'y', y, 'vw', vw, 'vh', vh)) FROM heatmap), '[]'::jsonb)
  )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_analytics_summary(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_analytics_summary(timestamptz) TO authenticated;

COMMIT;
