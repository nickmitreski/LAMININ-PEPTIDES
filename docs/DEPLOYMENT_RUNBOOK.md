# Deployment Runbook — 2026-05-17 migration batch

Six SQL migrations + one edge function redeploy. Follow this order. The
runbook is designed to fail safe: every step is idempotent, every step has
a verification query, and the rollback for each is documented inline.

## Pre-flight (5 minutes)

```bash
npm install                # pull dependencies if you're on a fresh clone
npx tsc --noEmit           # must be clean
npm run lint               # must be 0 errors
npm test                   # must be 58/58 pass
npm run build              # must succeed
```

If any of those fail, stop. Do not deploy.

Take a database snapshot from the Supabase Dashboard → Project → Database →
Backups → "Create backup". The 6 migrations are all idempotent and additive,
but a snapshot costs nothing and saves you if something else changes
underneath.

Decide whether you're using Path A or Path B:

- **Path A — SQL editor, one migration at a time.** Recommended for the
  live store. You see each step's effect, can pause and verify, and bail
  cleanly if anything looks wrong.
- **Path B — `supabase db push`.** Faster but applies all 6 in one shot.
  Only use it if your CLI is already linked and you've successfully pushed
  before.

---

## Migration 1 of 6 — payment_tracking parity

**File**: `supabase/migrations/20260517100000_payment_tracking_create_table_parity.sql`

**What it does**: declares `payment_tracking` in the repo so a fresh
Supabase project can be rebuilt from migrations. On the live DB it's a
no-op because the table already exists (`CREATE TABLE IF NOT EXISTS`).

**Apply**: paste the file's contents into the SQL editor and Run.

**Verify**:

```sql
-- 1. Table exists with expected columns
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'payment_tracking'
 ORDER BY ordinal_position;
-- Expect: id, order_reference, payment_status, customer_email, customer_name,
-- customer_phone, customer_address, cart_items, subtotal, shipping, tax,
-- total_amount, currency, admin_notes, payment_viewed_at,
-- payment_completed_at, created_at, updated_at, discount_code,
-- discount_amount.

-- 2. The trigger we just added is present
SELECT trigger_name FROM information_schema.triggers
 WHERE event_object_table = 'payment_tracking'
   AND trigger_name = 'payment_tracking_touch_updated_at';
-- Expect: one row.

-- 3. Existing row count unchanged
SELECT COUNT(*) FROM public.payment_tracking;
-- Expect: same number as before.
```

**Rollback** (only if Step 2 returns zero):
```sql
DROP TRIGGER IF EXISTS payment_tracking_touch_updated_at ON public.payment_tracking;
DROP FUNCTION IF EXISTS public.touch_payment_tracking_updated_at();
```

---

## Migration 2 of 6 — order_status_history + admin_audit_log

**File**: `supabase/migrations/20260517120000_order_status_history_and_audit_log.sql`

**What it does**: creates two tables + an AFTER UPDATE trigger that logs
every `payment_status` change. Backfills one history row per existing
order.

**Apply**: paste + Run.

**Verify**:

```sql
-- 1. Both tables exist
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN ('order_status_history', 'admin_audit_log');
-- Expect: 2 rows.

-- 2. Trigger is wired
SELECT trigger_name FROM information_schema.triggers
 WHERE event_object_table = 'payment_tracking'
   AND trigger_name = 'payment_tracking_status_history';
-- Expect: 1 row.

-- 3. Backfill ran — every existing order has at least one history row
SELECT COUNT(*) AS missing_history
  FROM public.payment_tracking pt
 WHERE NOT EXISTS (
   SELECT 1 FROM public.order_status_history h WHERE h.order_id = pt.id
 );
-- Expect: 0.

-- 4. RLS is on, admin-only SELECT works
SELECT policyname FROM pg_policies
 WHERE tablename IN ('order_status_history', 'admin_audit_log');
-- Expect: 4 rows (select + insert on each table).

-- 5. Live smoke test — change one order's status, confirm history row appears
-- (run as admin in a query that won't actually disrupt anything)
DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.payment_tracking LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE public.payment_tracking
       SET payment_status = payment_status  -- no-op write
     WHERE id = v_id;
  END IF;
END $$;
-- Then:
SELECT to_status, created_at FROM public.order_status_history
 ORDER BY created_at DESC LIMIT 3;
-- Expect: recent rows (the no-op update DIDN'T fire because IS DISTINCT FROM
-- returns false, but the backfill rows from earlier are there).
```

**Rollback**:
```sql
DROP TRIGGER IF EXISTS payment_tracking_status_history ON public.payment_tracking;
DROP FUNCTION IF EXISTS public.log_payment_status_change();
DROP TABLE IF EXISTS public.order_status_history;
DROP TABLE IF EXISTS public.admin_audit_log;
```

---

## Migration 3 of 6 — server-authoritative totals

**File**: `supabase/migrations/20260517140000_upsert_payment_tracking_server_authoritative_totals.sql`

**What it does**: replaces `upsert_payment_tracking` so the server
recomputes subtotal/shipping/tax/total from `product_mappings` rather than
trusting the client. Adds `express_shipping_aud()` and
`checkout_gst_amount()` SQL helpers that mirror the storefront's policy.

**This is the riskiest migration.** It changes order-creation behaviour. If
the SQL helpers don't match the storefront math, every legitimate customer
order will show a tamper flag in `admin_notes`.

**Apply**: paste + Run.

**Verify**:

```sql
-- 1. Function exists with 13 params (the old signature)
SELECT proname, pronargs FROM pg_proc
 WHERE proname = 'upsert_payment_tracking';
-- Expect: one row with pronargs = 13.

-- 2. Helpers exist
SELECT proname FROM pg_proc
 WHERE proname IN ('express_shipping_aud', 'checkout_gst_amount', '_recompute_order_totals');
-- Expect: 3 rows.

-- 3. Shipping helper returns the same values as src/lib/shippingPolicy.ts
SELECT
  public.express_shipping_aud(100)  AS under_threshold,    -- expect 11.90
  public.express_shipping_aud(250)  AS at_threshold,       -- expect 0
  public.express_shipping_aud(500)  AS above_threshold;    -- expect 0

-- 4. GST helper returns 0 (the storefront default is tax-inclusive prices)
SELECT public.checkout_gst_amount(100);   -- expect 0

-- 5. End-to-end smoke: synthesize a recompute and check it matches a real cart.
SELECT * FROM public._recompute_order_totals(
  '[{"id":"bpc-157","name":"BPC-157 10mg","price":1,"quantity":2}]'::jsonb,
  NULL, 0
);
-- Expect: subtotal = (real product_mappings.price for bpc-157) × 2,
-- shipping = depending on threshold, tax = 0, total = sum.
-- The client-supplied "price":1 was IGNORED.
```

**Rollback**: re-run the previous version of the function from
`supabase/migrations/20260410000000_payment_tracking_fixes.sql` lines 19-69
(the CREATE OR REPLACE block).

---

## Migration 4 of 6 — customer order-status lookup

**File**: `supabase/migrations/20260517160000_lookup_order_by_reference_and_email.sql`

**What it does**: adds `lookup_order_by_ref_and_email(ref, email)` RPC for
the public `/order-status` page. SECURITY DEFINER + email gate, so anyone
with just the ref can't browse someone else's order.

**Apply**: paste + Run.

**Verify**:

```sql
-- 1. Function exists, granted to anon
SELECT proname FROM pg_proc WHERE proname = 'lookup_order_by_ref_and_email';
SELECT has_function_privilege('anon',
  'public.lookup_order_by_ref_and_email(text, text)', 'EXECUTE');
-- Expect: 1 row, true.

-- 2. Match returns a success row
-- (replace LM-XXXXXX + email@example.com with a known real order)
SELECT public.lookup_order_by_ref_and_email('LM-XXXXXX', 'email@example.com');
-- Expect: success:true with status, total, etc.

-- 3. Mismatch returns a generic error (no enumeration)
SELECT public.lookup_order_by_ref_and_email('LM-NONEXISTENT', 'nope@nowhere');
-- Expect: success:false, error:'Order not found'.
SELECT public.lookup_order_by_ref_and_email('LM-XXXXXX', 'wrong@email');
-- Expect: same generic 'Order not found' (timing should be similar).
```

**Rollback**:
```sql
DROP FUNCTION IF EXISTS public.lookup_order_by_ref_and_email(text, text);
```

---

## Migration 5 of 6 — bank_details settings

**File**: `supabase/migrations/20260517180000_bank_details_settings.sql`

**What it does**: creates `bank_details` (singleton) + `bank_details_history`
tables, seeds the existing hardcoded values, adds RLS so admins can edit
from `/admin/settings` without a redeploy. Public SELECT (the storefront
+ edge function both read it), admin-only UPDATE.

**Apply**: paste + Run.

**Verify**:

```sql
-- 1. Both tables exist, one row seeded
SELECT * FROM public.bank_details;
-- Expect: 1 row with bsb='013402', account_number='807892935', account_name='MJCA Group'.

-- 2. History table empty (no changes yet)
SELECT COUNT(*) FROM public.bank_details_history;
-- Expect: 0.

-- 3. RLS allows anon to read (the email function uses service-role; the
-- storefront might in future), denies anon to update
SELECT has_table_privilege('anon', 'public.bank_details', 'SELECT');
-- Expect: true.

-- 4. Edit a value as an admin (via the SQL editor) and confirm history fires
UPDATE public.bank_details
   SET bank_name = 'Test bank'   -- changing the ONE field nobody depended on
 WHERE singleton;
SELECT * FROM public.bank_details_history ORDER BY created_at DESC LIMIT 1;
-- Expect: a row with before.bank_name=null, after.bank_name='Test bank'.

-- 5. Revert the test edit
UPDATE public.bank_details SET bank_name = NULL WHERE singleton;
```

**Rollback**:
```sql
DROP TRIGGER IF EXISTS bank_details_history ON public.bank_details;
DROP TRIGGER IF EXISTS bank_details_touch ON public.bank_details;
DROP FUNCTION IF EXISTS public.log_bank_details_change();
DROP FUNCTION IF EXISTS public.touch_bank_details();
DROP TABLE IF EXISTS public.bank_details_history;
DROP TABLE IF EXISTS public.bank_details;
```

---

## Migration 6 of 6 — idempotency key

**File**: `supabase/migrations/20260517200000_payment_tracking_idempotency_key.sql`

**What it does**: adds `idempotency_key text` column + partial unique
index. Replaces `upsert_payment_tracking` with a 14-param signature that
fast-paths to "return the existing tracking_id, replay:true" when the same
key is submitted twice.

**Apply**: paste + Run.

**Verify**:

```sql
-- 1. Column + index exist
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'payment_tracking' AND column_name = 'idempotency_key';
-- Expect: 1 row.

SELECT indexname FROM pg_indexes
 WHERE tablename = 'payment_tracking'
   AND indexname = 'idx_payment_tracking_idempotency_key';
-- Expect: 1 row.

-- 2. Function signature grew to 14 params
SELECT proname, pronargs FROM pg_proc WHERE proname = 'upsert_payment_tracking';
-- Expect: one row with pronargs = 14.

-- 3. Replay smoke test: same key twice should return the same tracking_id
-- (run twice manually, compare the tracking_id values)
SELECT public.upsert_payment_tracking(
  p_order_reference => 'LM-IDEMPOTENCY-TEST',
  p_customer_email => 'test@example.com',
  p_customer_name => 'Test',
  p_customer_phone => '',
  p_customer_address => NULL,
  p_cart_items => '[]'::jsonb,
  p_subtotal => 0,
  p_shipping => 0,
  p_tax => 0,
  p_total_amount => 0,
  p_currency => 'AUD',
  p_discount_code => NULL,
  p_discount_amount => 0,
  p_idempotency_key => 'test-key-001'
);
-- Run again with same args:
-- Expect: same tracking_id back, response should include replay:true.

-- 4. Clean up
DELETE FROM public.payment_tracking WHERE order_reference = 'LM-IDEMPOTENCY-TEST';
```

**Rollback**: re-run migration 3 (`20260517140000`) to restore the 13-param
function, then:
```sql
ALTER TABLE public.payment_tracking DROP COLUMN IF EXISTS idempotency_key;
```

---

## Edge function — send-order-email

The function now reads bank details from `bank_details` instead of using
hardcoded constants. The hardcoded values are still in the file as a
fallback if the read fails.

**Apply**:

```bash
# From the repo root.  Assumes you're already logged in:
#   npx supabase login
npx supabase link --project-ref <your-project-ref>     # one-time
npx supabase functions deploy send-order-email --no-verify-jwt
```

**Verify**: place a test order from a non-prod email address. Check that:

1. The email arrives with the same BSB / account number you've always used.
2. Then update the bank-name field at `/admin/settings` to "Test bank".
3. Place another test order. The email should contain the same BSB / account
   number — `bank_name` is currently informational only inside the function.
   The point is just to confirm the function is reading the DB row (you can
   verify by SELECTing `bank_details_history` and seeing the update).
4. Revert the bank-name change.

If the email function isn't deployed yet, the storefront still works — the
email just keeps using the hardcoded values it always has.

---

## Post-deploy smoke test (10 minutes)

Walk through this in production:

1. **Order placement**: customer flow — add to cart, checkout, place order.
   Confirm:
   - Order confirmation page shows the deadline.
   - Confirmation email arrives within 30s.
   - Email contains BSB + account number + the new "complete within 48
     hours" callout.
2. **Order in admin**: open `/admin/dashboard` (different browser to confirm
   realtime). Click into the order. Confirm:
   - Items list shows the product name, qty, unit price, line total.
     (This was the original P0 bug from pass 1; verify it's still fixed.)
   - Permalink button opens `/admin/orders/<ref>` in a new tab.
3. **Realtime**: keep the dashboard open. From another tab, mark the order
   paid (use the modal's "Mark as Paid" button). The first tab should
   refresh the row's status to "Paid" within ~2 seconds without a manual
   refresh.
4. **Status history**: open the dedicated `/admin/orders/<ref>` page. Confirm
   the "Status history" card shows pending → payment_received with timestamp.
5. **Audit log**: visit `/admin/audit`. Confirm a row for `order.mark_paid`
   with the order's id, timestamp, and your admin actor id.
6. **Bank details edit**: at `/admin/settings`, change the bank name to
   "Test", save. Place another (test) order. Email should still arrive.
   Revert the bank name.
7. **Customer status lookup**: from a fresh browser (or incognito), visit
   `/order-status`. Enter the order ref + email. Should show "Paid".
8. **Resend instructions**: in the admin order detail, click "Resend
   instructions". Confirm the email arrives again to the customer.
9. **Cancel + audit**: from the modal, cancel a test order with a reason.
   Confirm:
   - Order status flips to Cancelled.
   - admin_notes contains the cancellation reason.
   - audit log has a row tagged `order.cancel`.
10. **Idempotency**: open devtools network panel. Place an order. In the
    panel, right-click the `upsert_payment_tracking` RPC and "Replay".
    Confirm the second call returns the SAME tracking_id (replay:true in
    the response) and no duplicate row was created.

If steps 1-10 all pass, you're done.

---

## Failure modes + what to do

| Symptom | Most likely cause | Fix |
|---|---|---|
| Order email never arrives | Edge function not redeployed, or RESEND_API_KEY missing/expired | Redeploy; check Supabase Dashboard → Edge Functions → Secrets |
| "Bank details table not deployed yet" banner on /admin/settings | Migration 5 didn't run | Apply migration 5 manually |
| Every order shows a "tamper detected" line in admin_notes | Migration 3's shipping/tax helpers don't match the storefront | Compare express_shipping_aud constants against src/lib/shippingPolicy.ts; update SQL and re-apply migration 3 (CREATE OR REPLACE is safe) |
| /admin/audit page shows "table doesn't exist yet" warning | Migration 2 didn't run | Apply migration 2 |
| /order-status returns "lookup is not enabled" | Migration 4 didn't run | Apply migration 4 |
| Duplicate orders on retry | Migration 6 didn't run | Apply migration 6 |
| Realtime not firing on admin pages | Realtime publication doesn't include payment_tracking | Run `ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_tracking;` (verify it's not already in there with `SELECT * FROM pg_publication_tables;`). This was already added in `20260513120000_enable_realtime_payment_tracking.sql` but worth re-checking. |

If a migration fails partway through (rare — they're all in a BEGIN/COMMIT
transaction), the transaction rolls back automatically and you can re-run
the file safely. Each one is idempotent.

If you're not sure about anything, stop and ask before re-running.

---

## Quick reference

- Migration files: `supabase/migrations/2026051*`
- Edge function: `supabase/functions/send-order-email/`
- Verification queries: in this file, under each migration
- Backup before: Supabase Dashboard → Database → Backups
- Rollback: each migration's section includes its rollback SQL
