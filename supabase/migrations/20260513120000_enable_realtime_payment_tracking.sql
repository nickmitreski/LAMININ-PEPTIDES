-- Enable Supabase Realtime on payment_tracking so the admin dashboard
-- can receive live updates instead of polling every 60 seconds.
--
-- Note: This requires the `supabase_realtime` publication to exist. If running
-- on a hosted Supabase project this publication is already created automatically.
-- For self-hosted, create it first:
--   CREATE PUBLICATION supabase_realtime;

ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_tracking;
