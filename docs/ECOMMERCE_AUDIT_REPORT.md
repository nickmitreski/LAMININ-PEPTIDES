# Ecommerce Audit Report — laminin-site

Date: 2026-05-17
Auditor: senior engineer review (React/Vite + Supabase)
Scope: full ecommerce stack — frontend cart/checkout, Supabase persistence + RLS + RPCs, admin dashboard, edge functions, email.

This document is the executive summary. See companion docs for full per-area detail:

- `URGENT_FIXES.md` — TL;DR + the items bug fix
- `ORDER_ITEMS_BUG_REPORT.md` — full root cause for the P0
- `ORDER_FLOW_MAP.md` — end-to-end data path with file:line citations
- `SUPABASE_SCHEMA_AUDIT.md` — table-by-table review + recommended ideal schema
- `ADMIN_DASHBOARD_AUDIT.md` — admin UI review
- `SECURITY_RLS_AUDIT.md` — security + RLS findings
- `REFACTOR_PLAN.md` — sequenced 5-phase plan
- `TESTING_PLAN.md` — full test strategy
- `IMPROVEMENT_BACKLOG.md` — prioritised ticket list

## Top-line verdict

The site works: customers can place orders and admins can mostly manage them. But the order data path has structural issues that today manifest as the P0 bug (items not showing in admin detail modal) and tomorrow will become harder to fix. The good news: the worst bug is a 12-line read-side fix. The other findings are systemic but addressable incrementally.

## P0 — admin order detail shows no items

**Root cause**: shape mismatch between `payment_tracking.cart_items` (`{id, name, price, quantity, image}`) and what `OrderDetailsModal` reads (`{peptide_display_name, cfg_code, unit_price, line_total}`). The mapper `paymentRowToOrder()` renames the property but does not transform the items. See `ORDER_ITEMS_BUG_REPORT.md`.

**Fix**: one function, `src/services/supabaseService.ts:134`. Zero DB changes. Existing orders render correctly on next refresh. See `URGENT_FIXES.md` for the diff.

## Systemic findings

### 1. Two parallel "order" storage shapes coexist
- `order_references.peptide_items` — original shape `{cfg_code, peptide_display_name, unit_price, line_total}` — but write path is dead on the live checkout flow.
- `payment_tracking.cart_items` — actual live shape `{id, name, price, quantity, image}` — but read path expects the other shape.

The mapper at line 134 tries to bridge them but only renames the property, not the inner fields.

### 2. `payment_tracking` has no `CREATE TABLE` migration in repo
Only `ALTER`, RLS, and RPC migrations reference it. The table definition lives only on the live Supabase project. CI / fresh-project rebuilds cannot recreate the schema from git.

### 3. Totals are client-supplied
`upsert_payment_tracking` accepts client-computed subtotal/shipping/tax/total and per-line prices verbatim. Devtools-savvy users can change prices. No server-side recompute. The single biggest hardening opportunity.

### 4. No real `order_items` table
All line items are JSONB. No FK to products, no SQL reporting per SKU, no per-line refund/fulfilment, no inventory join.

### 5. No `order_status_history`, no `payments` table
Status overwrites in place. Re-payment, refund, chargeback have no clean home.

### 6. Silent failures everywhere
- `OrderDetailsModal` renders `'—'` and `formatPrice(0)` for missing fields → masked the items bug.
- `getAllOrders` returns `[]` on error → admin sees "no orders" not "load failed".
- Email send + admin SMS + customer upsert all fire-and-forget after the order is created.

### 7. No idempotency on order creation
Double-submit / network retry can produce duplicate `payment_tracking` rows. Client-side guard at `bankTransferPayment.ts:44-55` is racy.

## Frontend code quality

- Multiple cart-line shapes redeclared in different files. Consolidate into one `OrderLine` type.
- Two Supabase clients (`lib/supabase.ts`, `lib/supabaseAdminClient.ts`) — confirm they're both needed.
- `OrderReferenceRow` carries three concepts (order, items, payment). Split post Phase 3.
- `proteinCheckout.ts createOrderReferenceRecord` is dead from the active flow but still exported.
- ErrorBoundary + AdminErrorBoundary exist; modal lacks its own boundary.
- Tests exist for `checkoutContactValidation`, `shippingPolicy`, `discountService`, `proteinCheckout` — strong start. Missing: `supabaseService`, `OrderDetailsModal`, E2E checkout.

## Edge functions

- `secure-checkout-init` exists but is not invoked from the active checkout flow. Either wire it up or remove.
- `send-order-email`, `notify-payment-received` work as fire-and-forget; need retry/observability.
- `twilio-status-callback` — confirm Twilio signature verification (audit needed).
- `chat`, `send-contact-message` — out of scope for this audit; appear fine.

## Auth & roles

- Magic-link / password admin login via `AdminAuthContext`.
- RLS enforced via `jwt_is_admin()` custom claim.
- **Critical to confirm**: that claim is stored in `app_metadata`, not `user_metadata`. The former is admin-controlled; the latter is user-self-settable.

## Priority order (full list in IMPROVEMENT_BACKLOG.md)

1. P0 — Fix items shape mismatch (this week).
2. P0 — Add tests so this can't regress.
3. P1 — Add CREATE TABLE migration for `payment_tracking`.
4. P1 — Server-side total recompute.
5. P1 — Idempotency key.
6. P1 — Confirm admin claim mechanism.
7. P1 — Promote to proper `orders` + `order_items` tables (multi-PR migration).
8. P2 — Admin UX polish (detail page, status history, audit log, search/filter).
9. P2 — Inventory wiring.
10. P3 — Customer accounts, real payment provider, multi-currency.

## What's actually good

- Codebase has tests, linting, types — solid foundation.
- RLS is enabled on the right tables; admin reads are gated.
- Migrations are timestamped and orderly.
- Edge functions are scoped to specific concerns rather than a god function.
- Recent commits show active hardening (`security_audit_fixes`, `payment_tracking_fixes`) — the team has been doing this work.
- The bug is a small one, in a single function, with a low-risk fix.
