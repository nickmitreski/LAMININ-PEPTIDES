# Testing Plan

## Goals

1. Prevent regression of the order-items shape bug.
2. Catch any future write/read shape drift early.
3. Build confidence to retire `order_references` and migrate to `order_items`.

## Layer 1 — Unit tests

Existing: `lib/checkoutContactValidation.test.ts`, `lib/shippingPolicy.test.ts`, `services/discountService.test.ts`, `services/proteinCheckout.test.ts`.

### Add

#### `services/supabaseService.test.ts`
- `normalizeCartItems`: arrays / non-arrays / partial / null / malformed numbers → expected outputs.
- `paymentRowToOrder`: given a `PaymentTrackingDbRow` fixture with `cart_items=[{id,name,price,quantity,image}]`, returned `peptide_items` must include `cfg_code, peptide_display_name, unit_price, line_total` (post-fix).
- `paymentRowToOrder` preserves original `id/name/price` for back-compat.
- Empty / null `cart_items` → `[]`, not undefined.

#### `services/bankTransferPayment.test.ts`
- Builds correct payload from cart items.
- Refuses to overwrite a non-pending tracking row (mock supabase).

#### `components/admin/OrderDetailsModal.test.tsx`
- Renders item name/qty/unit price/line total from `peptide_items` shape.
- Falls back gracefully when only `name/price/id/quantity` are present.
- "No items in this order" appears only when array is empty (not when shape is wrong — wrong shape should render WARNING).
- Reconstitution block hides when items have no recognizable peptide names.

## Layer 2 — Integration tests (Vitest + supabase-js with a real local Supabase)

Run against `supabase start` local stack with the full migration set.

### Order creation round-trip
1. Seed product_mappings.
2. Insert anon JWT → call `upsert_payment_tracking` with a 2-item cart.
3. Query the row back as admin JWT → confirm `cart_items` matches the input shape and totals.
4. Call `paymentRowToOrder` on the result → assert `peptide_items` has the consumer-expected fields.

### RLS
- Anon SELECT on `payment_tracking` → expect zero rows.
- Wrong-claim JWT SELECT → expect zero rows.
- Admin JWT SELECT → expect inserted row.
- Anon UPDATE attempt → denied.
- Anon DELETE attempt → denied.

### Idempotency
- (Post Phase 2.3) Two RPC calls with same `idempotency_key` produce one row.

### Discount
- `redeem_discount_code` invalid code → error.
- Valid code reduces order totals correctly server-side (post Phase 2).

## Layer 3 — Edge function tests

Use Supabase functions test harness or Deno test.

- `secure-checkout-init`: returns a valid session.
- `send-order-email`: builds correct payload; tolerates missing optional fields.
- `notify-payment-received`: only fires when `payment_status` transitions to `payment_received`.
- `twilio-status-callback`: rejects requests with missing/invalid signature (post hardening).

## Layer 4 — End-to-end (Playwright)

Single happy-path test sufficient to start. Run against staging environment with a known test product.

### `checkout-happy-path.spec.ts`
1. Visit `/`, click a product, add to cart.
2. Go to `/cart`, verify the line is there.
3. Click checkout, fill form (use deterministic test data — email like `e2e+{timestamp}@example.com`).
4. Submit, expect redirect to `/order-confirmation?...`.
5. As admin (programmatic login), open `/admin/dashboard`, find the row by order reference, click it.
6. Assert OrderDetailsModal shows the product name, quantity, unit price > 0, line total > 0.
7. Assert `/admin/payment-tracking` shows the same line.

### `checkout-empty-cart.spec.ts`
- With empty cart, visiting `/checkout` redirects to `/cart` or shows empty state. Submit button should be disabled.

### `checkout-discount.spec.ts`
- Apply valid code → totals drop.
- Apply invalid code → error toast; submit blocked.

### `admin-rls.spec.ts`
- Non-admin authenticated user sees no orders.

## Layer 5 — Contract tests (later)

A tiny test that asserts the shape of `payment_tracking.cart_items` against a JSON schema. Run against staging on each deploy. Catches drift if anyone manually edits rows or the RPC's behaviour changes.

## Coverage targets

| Area | Target | Notes |
|---|---|---|
| `services/` | 80% lines | Pure-ish logic; easy |
| `lib/` | 90% lines | Already mostly there |
| `components/admin/OrderDetailsModal` | 70% | Render + fallback paths |
| Edge functions | 60% | Limited by Deno test setup |
| E2E | 1 happy-path + 3 edge | Run in CI on main + nightly against staging |

## Test data

- Maintain a seed script `scripts/seed-test-data.sql` for local Supabase: 5 products, 2 discount codes, 1 admin user.
- Document the test admin's JWT-claim assignment so contributors can reproduce.

## CI

- Run unit + integration tests on every PR.
- Run E2E nightly + on merge-to-main against staging.
- Block merge on failing typecheck or failing unit tests.

## Manual test checklist (until automation lands)

Use before any release.

- [ ] Add to cart, remove from cart, change quantity, persist on refresh.
- [ ] Apply valid + invalid discount.
- [ ] Submit checkout — confirm `payment_tracking` row created with correct `cart_items`.
- [ ] Verify email received (or stub) with correct totals.
- [ ] Admin: open new order, confirm items, names, qty, unit price, line total all display.
- [ ] Admin: mark order paid; confirm SMS/email fires (or log shows it would).
- [ ] Anon user: try to fetch `/rest/v1/payment_tracking` → 0 rows.
- [ ] Devtools tamper: set unit price to 0.01 — server should reject (post Phase 2).
