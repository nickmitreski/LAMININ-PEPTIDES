# Refactor Plan

Sequenced, low-risk path from today's state to a clean ecommerce data model. Each step is independently shippable and reversible.

## Guiding principles

- **No big-bang rewrites.** Each phase is a PR-sized change.
- **Read-side fixes first** — they're safer than write-side.
- **Write to both old and new during transitions**, switch reads, then retire old.
- **Snapshot product data on the order** — never re-derive customer-visible order content from live product rows.

## Phase 0 — Stop the bleeding (this week)

### 0.1 Fix the items shape mismatch
- File: `src/services/supabaseService.ts:134` in `paymentRowToOrder`.
- Map `cart_items {id,name,price,quantity}` → adds `cfg_code, peptide_display_name, unit_price, line_total` so `OrderDetailsModal` renders correctly.
- See ORDER_ITEMS_BUG_REPORT.md for the diff.

### 0.2 Make `OrderDetailsModal` tolerant of both shapes
- File: `src/components/admin/OrderDetailsModal.tsx:235-246`.
- Fallback chains: `peptide_display_name || name || cfg_code`, `cfg_code || id`, `unit_price ?? price`, `line_total ?? (unit_price * quantity)`.

### 0.3 Loud-fail instead of silent dashes
- In `OrderDetailsModal`, if no `name` and no `cfg_code` and no `id`, render a red "DATA WARNING — open raw payload" badge instead of "—".

### 0.4 Add raw payload debug drawer (admin-only)
- A collapsible JSON view of `order` inside the modal.
- Gates: only render when `is_admin` claim is set.

## Phase 1 — Repo / DB hygiene (next 1–2 weeks)

### 1.1 Add CREATE TABLE migration for `payment_tracking`
- Dump live schema: `pg_dump --schema-only --table=public.payment_tracking`.
- Place in a new migration earlier than `20260409000000_security_audit_fixes.sql` (or restructure).
- Goal: a fresh Supabase project can run migrations cleanly.

### 1.2 Snapshot RLS policies into migrations
- Compare live `pg_policies` against repo. Add any missing.

### 1.3 Remove dead code
- `src/services/proteinCheckout.ts:80 createOrderReferenceRecord` — confirm zero call sites in live flows (it's still imported by tests). Mark deprecated; keep tests; do not remove until Phase 3.
- `src/services/supabaseService.ts:191 createOrderReference` — same.

### 1.4 Document the live RPC contracts
- `docs/sql-reference/` already exists. Add `upsert_payment_tracking.md` covering parameters, validation, RLS, SECURITY DEFINER status, and known limits.

## Phase 2 — Server-authoritative totals (2–3 weeks)

### 2.1 Move price source-of-truth to DB
- In `upsert_payment_tracking`, for each item in `p_cart_items`, look up the canonical price from `product_mappings` (or `products`/`product_variants`) and recompute `line_total`, `subtotal`, `tax`, `shipping` (using a server-side shipping policy), and `total_amount`.
- Reject the request if the client-supplied total deviates by more than e.g. 1¢.
- Return the recomputed values to the client so the customer sees the authoritative number.

### 2.2 Move shipping/tax calc into SQL or an edge function
- Today: `src/lib/shippingPolicy.ts` runs client-side only.
- Goal: same function callable from SQL / edge fn so server and client agree.

### 2.3 Idempotency
- Add `idempotency_key` column to `payment_tracking` (UNIQUE).
- Client generates one per submit attempt, stored in a `useRef`.
- RPC: `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING ...`.

### 2.4 Discount re-validation in the same RPC
- Today: `redeem_discount_code` runs separately, then the client adds the discount to the totals it submits. The RPC must re-validate.

## Phase 3 — Proper order_items table (3–6 weeks)

### 3.1 Create new tables
```
orders (...promoted from payment_tracking, see ideal schema in SUPABASE_SCHEMA_AUDIT.md)
order_items (id, order_id fk, product_id fk nullable, sku, name_snapshot, image_snapshot, options_snapshot, quantity, unit_price_cents, line_total_cents)
order_status_history (id, order_id, from_status, to_status, actor, note, created_at)
payments (id, order_id, provider, provider_ref, status, amount_cents)
```

### 3.2 Dual-write
- `upsert_payment_tracking` (or its replacement) writes BOTH the legacy JSON column and the new normalised rows.
- One release of running dual-write to be confident.

### 3.3 Backfill
- Migration script reads every `payment_tracking.cart_items`, inserts equivalent `order_items` rows.
- Run in a transaction; verify counts; spot-check.

### 3.4 Switch reads
- `getAllOrders` joins `orders` to `order_items` (Supabase nested select: `orders(*, order_items(*))`).
- `OrderDetailsModal` reads from the joined response.
- Keep `cart_items` JSON column populated for one more release as a safety net.

### 3.5 Retire JSON column
- Rename `payment_tracking.cart_items` → `cart_items_legacy`, then drop after one safe release.

## Phase 4 — Operational polish (4–8 weeks)

### 4.1 Order detail page
- `/admin/orders/:id` — deep-linkable, replaces modal for full views.
- Modal becomes a quick-peek only.

### 4.2 Status change workflow
- Cancel, refund, mark fulfilled, mark shipped — each writes `order_status_history`.
- Show timeline in the detail page.

### 4.3 Audit log
- Generic `audit_logs(actor, action, target_table, target_id, before, after, created_at)`.
- Triggered on admin status changes, customer edits, discount edits.

### 4.4 CSV export, search, filter, sort
- Wire into the orders list page with the new normalised join.

### 4.5 Inventory wiring
- `inventory(product_variant_id, on_hand, reserved)`.
- Reserve on cart, deduct on paid, return on cancel.

## Phase 5 — Stretch

- Move bank-transfer order creation entirely into an edge function (`secure-checkout-init` is the seed). Client never inserts directly.
- Real payment provider integration (Stripe?) with webhook → `payments` table.
- Refund flow with `refunds` table.
- Customer-facing order history (requires customer accounts; auth flow not in scope here).

## What NOT to do

- Don't drop `order_references` until you confirm no tests / no live edge fns rely on it.
- Don't rename `payment_status` values without a data migration.
- Don't migrate to `orders/order_items` and remove `cart_items` in the same release.
- Don't introduce a new admin role mechanism without first auditing `app_metadata` vs `user_metadata` for the existing one.
