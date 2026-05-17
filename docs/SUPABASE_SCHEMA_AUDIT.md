# Supabase Schema Audit

## Tables in use (inferred from code + migrations)

| Table | CREATE TABLE in repo? | Used for | Notes |
|---|---|---|---|
| `customers` | ✓ schema.sql + migration 20260401 | Customer profile (email, name, address, last order) | upsert via `upsert_checkout_customer` |
| `order_references` | ✓ schema.sql + migration 20260401 | Legacy "bridge" order record | **No longer written by Checkout** |
| `payment_tracking` | ✗ — only ALTER + RLS + RPC in repo | **Live order rows** — customer info, cart_items, totals, payment status | Schema exists only on live project; rebuild from scratch impossible from repo |
| `product_mappings` | ✓ schema.sql | cfg_code ↔ peptide_name / protein_name / price | Read by `getProductMappings` |
| `products` | ✓ migration 20260409100000 | Product catalog (admin-managed) | |
| `product_variants` | ✓ migration 20260409100000 | Variant rows (size/purity) | |
| `discount_codes` | ✓ migration 20260408 | Promo codes | RPCs `redeem_discount_code`, `validate_discount_code` |
| `partner_pay_links` | ✓ migration 20260406 | SMS payment links (legacy) | |
| `checkout_sessions` | ✓ migration 20260403120000 | Edge-function session bootstrap | |
| `admin_audit_log` / `customers_audit` | partial — migration 20260404 | Audit trail | Only on session contact changes |

## Critical gaps

### 1. `payment_tracking` has no CREATE TABLE migration

`grep -rn "create table.*payment_tracking" supabase/` returns nothing. The table is referenced by:
- `ALTER TABLE public.payment_tracking ENABLE ROW LEVEL SECURITY` (20260409)
- `ALTER TABLE public.payment_tracking ADD COLUMN IF NOT EXISTS discount_code ...` (20260410)
- `CREATE OR REPLACE FUNCTION upsert_payment_tracking(...)` (20260410)
- Multiple RLS policies (20260409 lines 41-55)

The actual `CREATE TABLE` must live on the live Supabase project but is not tracked in git. This blocks:
- Rebuilding the schema from migrations on a fresh project.
- CI / preview environments.
- Disaster recovery.
- Code review of the actual columns.

**Action**: dump the live `payment_tracking` schema and add a CREATE TABLE migration with a timestamp earlier than 20260409000000_security_audit_fixes.sql, or restructure via a single consolidating migration. (Use `pg_dump --schema-only --table=public.payment_tracking` then move it into `migrations/`.)

### 2. No real `order_items` table

All line items live in JSONB columns:
- `payment_tracking.cart_items` (live)
- `order_references.peptide_items` / `protein_items` (dead)

Consequences:
- No foreign key to `products` → product deletion silently breaks historical orders.
- No join-based inventory deduction.
- No SQL reporting on revenue per SKU without JSON gymnastics.
- No partial fulfilment / per-line status / per-line refund.

### 3. No `order_status_history`

Status changes overwrite `payment_status` in-place. No record of when an order went pending → viewed → paid → refunded. The customer-support story for "when did this order ship?" is poor.

### 4. No `payments` table separate from orders

`payment_tracking` conflates the order and the payment. A re-attempted payment, partial payment, refund, or chargeback has no clean home.

### 5. No inventory_movements / stock table

Despite an "Inventory" admin page (`src/pages/AdminInventory.tsx`), there is no per-SKU on-hand quantity in migrations. Inventory deduction on checkout is not implemented.

## Columns referenced from code

### `payment_tracking` (inferred from `PaymentTrackingDbRow` at `supabaseService.ts:91-112` and RPC params)
- `id` uuid
- `order_reference` text (unique)
- `payment_status` text — values: `pending | viewed_instructions | payment_received | refunded` (best guess from grep)
- `customer_email` text
- `customer_name` text
- `customer_phone` text
- `customer_address` jsonb — `{address, city, state, postcode, country}`
- `total_amount` numeric
- `cart_items` jsonb — `[{id, name, price, quantity, image}]`
- `subtotal`, `shipping`, `tax` numeric
- `currency` text default 'AUD'
- `discount_code` text, `discount_amount` numeric (added 20260410)
- `admin_notes` text
- `payment_viewed_at`, `payment_completed_at` timestamptz
- `created_at`, `updated_at` timestamptz

### `order_references` (from schema.sql:32 + supabaseService.ts:20-56)
- `id` uuid pk
- `peptide_order_id` text unique
- `protein_store_order_id` text nullable
- `status` text
- `customer_*` flat columns (email, name, first, last, phone, address, city, state, postcode, country)
- `total_price` numeric
- `peptide_items` jsonb
- `protein_items` jsonb
- `discount_code`, `discount_amount`
- `notes` text
- `created_at`, `updated_at`

### `customers`
- `id`, `email` (unique), `first_name`, `last_name`, `phone`
- address fields
- `total_orders`, `total_spent`, `last_order_at`
- `created_at`, `updated_at`

## RLS posture (see SECURITY_RLS_AUDIT.md for full)

- `payment_tracking` — admin-only SELECT/INSERT/UPDATE/DELETE via `jwt_is_admin()` (20260409). **BUT** the `upsert_payment_tracking` RPC is callable by anon (necessary for checkout). Confirm `SECURITY DEFINER` and grants on the function are tight.
- `customers` — anon UPDATE allowed for upsert (20260407). Reviewable but plausibly needed for guest checkout.
- `order_references` — admin-only.
- `discount_codes` — admin-only writes; RPC for redeem.

## Indexes

Migrations create some indexes (e.g. `order_references.peptide_order_id`, `customers.email`). `payment_tracking.order_reference` unique index is implied by the upsert logic and unique constraint should exist on live DB — but is not in migrations.

## Recommended ideal schema (longer term)

```
products(id pk, sku unique, name, slug, description, status, created_at, updated_at)
product_variants(id pk, product_id fk, sku unique, options jsonb, price_cents int, weight_g int, status)
product_images(id pk, product_id fk, url, alt, sort)
categories(id pk, slug unique, name, parent_id fk)
product_categories(product_id fk, category_id fk, pk(product_id,category_id))

customers(id pk, email unique, first_name, last_name, phone, default_shipping_address_id, default_billing_address_id, created_at, updated_at)
addresses(id pk, customer_id fk, line1, line2, city, state, postcode, country, kind enum('shipping','billing'))

carts(id pk, customer_id fk nullable, session_token, currency, created_at, expires_at)
cart_items(id pk, cart_id fk, product_variant_id fk, quantity, unit_price_cents)

orders(
  id pk, order_number unique,
  customer_id fk, customer_email_snapshot,
  status enum('pending','paid','fulfilled','cancelled','refunded'),
  fulfillment_status enum('unfulfilled','partial','fulfilled'),
  payment_status enum('pending','authorized','paid','refunded','failed'),
  currency, subtotal_cents, shipping_cents, tax_cents, discount_cents, total_cents,
  discount_code_id fk nullable,
  shipping_address_id fk, billing_address_id fk,
  notes, admin_notes,
  created_at, paid_at, fulfilled_at, cancelled_at
)
order_items(
  id pk, order_id fk,
  product_id fk nullable,            -- nullable for safety on product delete
  product_variant_id fk nullable,
  sku_snapshot, name_snapshot, image_url_snapshot,
  options_snapshot jsonb,
  quantity, unit_price_cents, line_total_cents
)
order_status_history(id pk, order_id fk, from_status, to_status, actor, note, created_at)

payments(id pk, order_id fk, provider, provider_ref, status, amount_cents, currency, raw jsonb, created_at)
refunds(id pk, payment_id fk, amount_cents, reason, raw jsonb, created_at)

inventory(product_variant_id pk fk, on_hand int, reserved int, low_stock_threshold int)
inventory_movements(id pk, product_variant_id fk, delta int, reason, order_id fk nullable, actor, created_at)

discount_codes(id pk, code unique, kind enum('percent','fixed'), value, max_redemptions, used_count, expires_at)

audit_logs(id pk, actor, action, target_table, target_id, before jsonb, after jsonb, created_at)
webhook_events(id pk, provider, event_id unique, payload jsonb, processed_at, error)
```

The "snapshot" columns on `order_items` are essential — a product rename/delete must not change historical order data.

## Migration to ideal schema

Should be staged, not big-bang. Suggested order:
1. Add `CREATE TABLE payment_tracking` migration to repo (parity fix, no behaviour change).
2. Add `order_status_history` and start writing to it from the admin status-change actions.
3. Add `order_items` table; backfill from `payment_tracking.cart_items` and `order_references.peptide_items`; write to both for a release; then switch reads.
4. Add `payments` table; move payment status off `payment_tracking`.
5. Retire `payment_tracking` (rename to `orders_legacy`, freeze writes).
