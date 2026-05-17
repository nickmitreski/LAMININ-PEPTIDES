# Improvement Backlog

Prioritised, ticket-sized items. P0 = ship this week, P1 = this quarter, P2 = backlog, P3 = nice-to-have.

## P0

| # | Title | Effort | Where |
|---|---|---|---|
| 1 | Fix `paymentRowToOrder` to normalise `cart_items` → `peptide_items` fields | XS (1 hr) | `src/services/supabaseService.ts:134` |
| 2 | Make `OrderDetailsModal` tolerant of both item shapes | XS | `src/components/admin/OrderDetailsModal.tsx:235-246` |
| 3 | Add unit test for `paymentRowToOrder` items mapping | XS | new `services/supabaseService.test.ts` |
| 4 | Add admin-only "raw payload" debug drawer to OrderDetailsModal | S | OrderDetailsModal |

## P1

| # | Title | Effort | Where |
|---|---|---|---|
| 5 | Add `CREATE TABLE payment_tracking` migration to repo | S | new migration |
| 6 | Server-side total recompute in `upsert_payment_tracking` | M | migration + RPC |
| 7 | Idempotency key on order creation | S | RPC + bankTransferPayment.ts |
| 8 | E2E checkout-happy-path test | M | new Playwright suite |
| 9 | Distinguish "no orders" from "load error" in AdminDashboard | XS | AdminDashboard.tsx |
| 10 | Confirm admin claim lives in `app_metadata`, not `user_metadata` | XS | DB only |
| 11 | Lock down `customers` anon UPDATE to definer RPC only | S | migration |
| 12 | Verify Twilio signature in `twilio-status-callback` | S | edge fn |
| 13 | Add `order_status_history` table + write on status changes | M | migration + admin actions |

## P2

| # | Title | Effort |
|---|---|---|
| 14 | Promote `payment_tracking` → `orders` + new `order_items` table; dual-write | L |
| 15 | Backfill `order_items` from JSON column | M |
| 16 | `/admin/orders/:id` dedicated detail page | M |
| 17 | Refund / cancel / mark fulfilled actions | M |
| 18 | Audit log table + triggers for admin actions | M |
| 19 | CSV export of orders | S |
| 20 | Search/filter/sort on orders list | S |
| 21 | Resend order-confirmation email button | S |
| 22 | Print packing slip | S |
| 23 | Inventory table + reserve-on-checkout, deduct-on-paid | L |
| 24 | Remove dead `createOrderReference*` code paths | XS |
| 25 | Snapshot live RLS policies into migrations | S |
| 26 | Make shipping/tax calc dual-runtime (client + server agree) | M |
| 27 | Schema-validate cart_items JSON at the DB level (jsonschema or check constraint) | S |
| 28 | Health check / status page hitting `payment_tracking` count + RLS sanity | XS |

## P3

| # | Title | Effort |
|---|---|---|
| 29 | Customer accounts + order history | XL |
| 30 | Real payment provider (Stripe) integration | XL |
| 31 | Saved admin filters | S |
| 32 | Bulk admin operations | M |
| 33 | Email template editor in admin | M |
| 34 | Multi-currency support | L |
| 35 | Per-line refunds | M |
| 36 | Per-line fulfilment / split shipments | M |
| 37 | Webhook dead-letter queue | M |
| 38 | Admin SSO / IdP integration | M |
| 39 | Test order mode (flag rows as test, exclude from reports) | S |
| 40 | Contract tests on RPC return shape | S |

## Added 2026-05-17 from Library / responsiveness audit

| # | Title | Effort |
|---|---|---|
| L1 | Image optimisation pipeline (PNG → AVIF/WebP, image CDN, srcset). Single biggest Library speed win | L |
| L2 | Preload hint for hero / above-fold image in `<head>` | XS |
| L3 | Defer `fetchProductSaleInfo` to non-blocking microtask so first paint doesn't wait on sale data | S |
| L4 | Add `useBodyScrollLock` hook and apply inside every modal (prevents background scroll on iOS) | S |
| L5 | Generic `<Modal>` primitive component implementing the canonical pattern (sticky header/footer + scrolling body + 100dvh + backdrop click + ESC to close + focus trap) | M |
| L6 | Focus trap inside open modals (a11y) | S |
| L7 | ESC key closes modals (a11y) | XS |
| L8 | Audit other admin pages for tables that need `overflow-x-auto` | S |
| L9 | Virtualize the Library grid (only matters at >100 cards) | M |
| L10 | Throttle `loadCatalog` on visibility-change so quick tab-flips don't re-fetch | XS |
| L11 | `<picture>` element wrapper around `<img>` in `ShopProductImage` for AVIF/WebP fallback chain | S |
| L12 | LCP / CLS budget checks in CI | M |

## Tech debt (separate from feature backlog)

- Duplicate cart-line shape definitions: `CartItem` (context), `BankTransferPaymentData.cartItems` (services), `CartLine` (services), each redeclared. Consolidate into a single `OrderLine` type in `src/types/`.
- Two Supabase clients (`lib/supabase.ts`, `lib/supabaseAdminClient.ts`). Verify they're really both needed; if `supabaseAdminClient.ts` uses the same anon key, fold it back into one client with a clearer name.
- `OrderReferenceRow` carries both `peptide_items` AND `cart_items` plus a `payment_status` and `status` and `payment_*` timestamps — three concepts in one type. Split into `Order`, `OrderItem`, `Payment` types post-Phase-3.
- `formatPrice(0)` everywhere — fine for true zero, misleading for missing data. Wrap with a `formatPriceOrDash(amount)` helper that renders "—" for `undefined`/`null`/`NaN`.
