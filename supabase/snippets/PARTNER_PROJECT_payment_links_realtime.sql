-- =============================================================================
-- RUN THIS ON THE *PARTNER* SUPABASE PROJECT (payment links app) — NOT on Lamin.
-- Lets your own site open pay UI when a row is inserted — no extra HTTP from Lamin.
-- =============================================================================
--
-- Flow without PAYMENT_LINK_PARTNER_NOTIFY_URL on Lamin:
--   1. Lamin Edge Function POSTs only to your create-payment-link API (server → server).
--   2. That API inserts into public.payment_links (or your table name).
--   3. This project’s dashboard / SPA subscribes to Realtime on that table.
--   4. On INSERT, your frontend runs window.open(row.payment_url) or shows an iframe.
--
-- End shoppers never call your API from the Lamin domain; there is no browser Referer
-- from lamin.com to your pay domain for that create step (the call is from Supabase Edge).

-- 1) Enable Realtime for your payment links table (replace table name if different).
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_links;

-- If the table was already in the publication, you’ll get an error — safe to ignore.

-- 2) RLS: Realtime still respects RLS. Typical patterns:
--    - Service role inserts the row (from create-payment-link Edge Function) — OK.
--    - Authenticated staff subscribe with a policy allowing SELECT on rows they own.
--
-- Example policy sketch (adjust to your schema):
-- CREATE POLICY "Staff can read payment links for their org"
--   ON public.payment_links FOR SELECT TO authenticated
--   USING ( org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid );

-- 3) Frontend (your site): subscribe with supabase-js, e.g.
--    .channel('payment_links')
--    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_links' }, (p) => {
--      const url = p.new.payment_url;
--      if (url) window.open(url, 'pay', 'popup,width=480,height=720');
--    })
--    .subscribe();
