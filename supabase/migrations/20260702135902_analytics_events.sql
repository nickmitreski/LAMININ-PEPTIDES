CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_name text NOT NULL,
  path text,
  page_title text,
  referrer text,
  user_agent text,
  country text,
  region text,
  city text,
  timezone text,
  local_time timestamptz,
  duration_ms integer,
  cart_item_count integer,
  cart_total numeric,
  element_tag text,
  element_text text,
  element_role text,
  element_href text,
  click_x integer,
  click_y integer,
  scroll_y integer,
  viewport_width integer,
  viewport_height integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read analytics events" ON public.analytics_events;
CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.jwt_is_admin());

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id
  ON public.analytics_events (session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name
  ON public.analytics_events (event_name);

CREATE INDEX IF NOT EXISTS idx_analytics_events_path
  ON public.analytics_events (path);

CREATE INDEX IF NOT EXISTS idx_analytics_events_country_created_at
  ON public.analytics_events (country, created_at DESC);
