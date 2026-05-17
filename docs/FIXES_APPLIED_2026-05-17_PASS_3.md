# Fixes Applied — 2026-05-17 (Pass 3)

Pass 3 ships the audit items that can be done unilaterally from the repo:
- Dedicated `/admin/orders/:id` page with status-history timeline
- Status-history + audit-log database migrations (additive, safe-to-apply)
- CREATE TABLE parity migration for `payment_tracking`
- Deep-link / "Open in new tab" affordances on the orders list & detail modal
- Opt-in postbuild script to strip 174 MB of unused originals from `dist`
- Pre-existing broken fallback (`/images/products/purity.png` → `/images/purity.png`) fixed

## 1. Dedicated admin order detail page

`src/pages/AdminOrderDetail.tsx` — new page mounted at `/admin/orders/:id`.

- `:id` accepts either the `payment_tracking.id` UUID **or** the human order
  reference (e.g. `LM-ABC123`). Sniffs the format with a UUID regex.
- Loads the order via the existing `paymentRowToOrder` mapper so the items-shape
  fix applies identically.
- Reuses `OrderDetailsModal` for the body — single source of truth for how an
  order is rendered. Closing the modal navigates back (history.back() with
  dashboard fallback).
- Loads `order_status_history` non-blocking — gracefully returns `[]` when
  the table doesn't exist yet (i.e. before the migration is applied).
- Surfaces "Mark as Paid" via `onPaymentAction` → `updateOrderStatus`.

Wiring:
- `src/App.tsx` — new `<Route path="/admin/orders/:id">` under `ProtectedRoute`
  + `AdminErrorBoundary` (matches the pattern of every other admin route).
- `src/services/supabaseService.ts` — new `getOrderById`, `getOrderByReference`,
  `getOrderStatusHistory`, `OrderStatusHistoryRow`.

## 2. Status history timeline in OrderDetailsModal

`src/components/admin/OrderDetailsModal.tsx` — new optional `statusHistory` prop.
When passed and non-empty, renders a "Status history" Card with:
- One row per transition: `from_status → to_status`, timestamp, actor short-id.
- Newest first; vertically stacked; truncates long actor IDs.

The dashboard's modal-in-page render does NOT pass `statusHistory` — keeps the
modal fast (no extra fetch). The dedicated `/admin/orders/:id` page DOES pass it.

## 3. Deep-link affordances

- `src/components/admin/OrderDetailsModal.tsx` header now has a "Permalink"
  link to `/admin/orders/<order_reference>` (opens in new tab). Hidden on
  mobile to preserve the close-button real estate.
- `src/pages/AdminDashboard.tsx` orders table row gets a new `<ExternalLink>`
  icon button next to the eye-view — opens the dedicated page in a new tab.

## 4. Database migrations (NOT YET APPLIED to live)

These two migration files are additive and safe; the user must apply them with
`supabase db push` or by pasting into the SQL editor on the Supabase project.

### `20260517100000_payment_tracking_create_table_parity.sql`

`CREATE TABLE IF NOT EXISTS public.payment_tracking ...` — fills the parity gap
identified in `SUPABASE_SCHEMA_AUDIT.md` so a fresh Supabase project can be
rebuilt from migrations alone. No-op against the existing live project (the
table already exists). Adds the `discount_code` / `discount_amount` columns
defensively in case the earlier migration ran out of order. Adds three useful
indexes (created_at DESC, payment_status, lower(customer_email)).

Includes a `touch_payment_tracking_updated_at()` trigger to keep `updated_at`
honest on every UPDATE (some RPCs depend on this).

### `20260517120000_order_status_history_and_audit_log.sql`

Two new tables + one SECURITY-DEFINER trigger:

- `order_status_history(id, order_id, from_status, to_status, actor, note, created_at)` — append-only timeline. RLS allows admin SELECT + INSERT only (UPDATE / DELETE denied by absence of policy).
- `admin_audit_log(id, actor, action, target_table, target_id, before, after, ip, user_agent, note, created_at)` — generic row-level audit. Indexed by `(target_table, target_id)` for "show me everything that happened to this order" queries.
- `log_payment_status_change()` trigger function — automatically writes a history row whenever `payment_status` changes on `payment_tracking`. Runs SECURITY DEFINER so it can write history even on UPDATEs originating from anonymous customer paths (e.g. the public RPC).
- Backfills one row per existing order so timelines aren't blank.

Rollback steps documented in the file header. The trigger function `REVOKE ALL FROM PUBLIC` — only the trigger context invokes it.

## 5. Opt-in dist strip script

`npm run build:strip-originals` — runs `vite build` then strips 174 MB of
original PNGs from `dist/images/products/`, keeping only the `optimized/`
subtree.

NOT enabled by default because the originals may still be referenced by
external integrations (transactional emails, social cards, CMS content).
The user can flip the deploy command to this when they've confirmed nothing
external depends on the originals.

Verified: strip drops `dist/images/products/` from 309 MB to 113 MB. Build
output references only the optimised paths, so the storefront is unaffected.

## 6. Bonus fix — broken default fallback path

`src/components/ui/ShopProductImage.tsx` and `src/context/ShopImagesContext.tsx`
both referenced `/images/products/purity.png` as the default fallback / "no
image" placeholder. **That file has never existed at that path.** The real
file lives at `/images/purity.png`. Anywhere a product image 404'd, the
fallback also 404'd, leaving the broken-image icon. Now corrected.

(Found by accident while testing the strip script — it kept reporting "kept 0"
because the whitelisted `purity.png` never had a copy in `dist/images/products/`
to keep.)

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 49/49 pass |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | succeeds |
| `npm run build:strip-originals` | succeeds; dist drops 309 MB → 113 MB |
| Manual: navigate to `/admin/orders/LM-ABC123` | renders order detail page, "Order not found" for bad refs |
| Manual: click ExternalLink button on dashboard | opens detail page in new tab |
| Manual: status history Card appears only on dedicated page (not the modal-in-dashboard) | correct |

## Files added

- `src/pages/AdminOrderDetail.tsx`
- `supabase/migrations/20260517100000_payment_tracking_create_table_parity.sql`
- `supabase/migrations/20260517120000_order_status_history_and_audit_log.sql`
- `scripts/postbuild-strip-originals.sh`
- `docs/FIXES_APPLIED_2026-05-17_PASS_3.md` (this file)

## Files modified

- `package.json` — `build:strip-originals` script
- `src/App.tsx` — new route, lazy import
- `src/components/admin/OrderDetailsModal.tsx` — Permalink link + optional `statusHistory` timeline Card
- `src/components/ui/ShopProductImage.tsx` — fallback path corrected
- `src/context/ShopImagesContext.tsx` — fallback path corrected
- `src/pages/AdminDashboard.tsx` — ExternalLink row button, `Link` import
- `src/services/supabaseService.ts` — new fetch helpers + `OrderStatusHistoryRow` type

## Still untouched (deliberately)

- **Server-side total recompute** — needs an RPC rewrite + careful staging on the live project. Adding to backlog for a dedicated migration.
- **Promote to `orders` / `order_items` tables** — multi-phase migration, separate effort.
- **Stripe / proper payment provider** — large new scope.
- **Refund / cancel actions in admin** — needs accompanying RPC and state machine; deferred.
- **Customer-facing order history (requires accounts)** — separate scope.

The next-best item I can ship unilaterally would be a small admin-side write to `admin_audit_log` when actions are taken (status updates, customer edits, product deletes). The migration is in place; the wiring is straightforward. Say the word and I'll do it.
