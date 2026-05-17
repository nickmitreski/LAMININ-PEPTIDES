# Fixes Applied — 2026-05-17 (Pass 8)

Closes out the audit backlog. Four threads:

1. Realtime subscriptions on the remaining admin pages
2. Dead `protein_store_order_id` column removed from the codebase
3. Idempotency key on `payment_tracking` to make double-submits safe
4. Disabled button hover + status badge polish

## 1. Realtime subscriptions everywhere

Extracted the Dashboard's inline subscription into a reusable hook:
`src/hooks/usePaymentTrackingRealtime.ts`

- Subscribes to `payment_tracking` changes via Supabase realtime channel.
- Falls back to interval polling when realtime isn't available (free-tier
  limit, publication missing, websocket blocked).
- Accepts a `rowId` option so detail pages can scope to a single order — the
  channel uses a postgres-changes filter `id=eq.<uuid>` so we don't wake up
  on every order in the schema.
- `enabled` toggle so callers can pause subscription during auth bootstrap.

Wired to:
- `AdminDashboard` — table-wide (replaces the previous inline version).
- `AdminPaymentTracking` — table-wide. Two admins on this page now see each
  other's "mark paid" actions live without manual refresh.
- `AdminOrderDetail` — scoped to the loaded row. If someone else updates this
  order in another tab, the page re-fetches silently.

## 2. Dead `protein_store_order_id` column

The partner-bridge era left a column on `order_references` that's always
`null` on the live flow. Three frontend touchpoints removed:

- `OrderReferenceRow.protein_store_order_id` field deleted from the type.
- `paymentRowToOrder()` no longer stamps it.
- `AdminCustomers` mapping no longer stamps it.

The dead function `createOrderReference` was left alone — it's not called
from the live checkout and removing its param would be a bigger refactor for
no user-visible benefit. The column on the legacy table is untouched (a
follow-up DB migration could `DROP COLUMN` once you confirm no external
integration depends on it).

## 3. Idempotency key on order creation

New migration:
`supabase/migrations/20260517200000_payment_tracking_idempotency_key.sql`

- Adds nullable `idempotency_key text` column to `payment_tracking`.
- Partial unique index `WHERE idempotency_key IS NOT NULL` — legacy rows
  stay unconstrained, new clients can't collide.
- Replaces `upsert_payment_tracking` with a 14-param signature that accepts
  `p_idempotency_key`. Fast-path: if a row with that key already exists,
  return its `tracking_id` with `replay: true` and zero writes.
- Pre-deploy clients that don't pass the param continue to work unchanged
  (param defaults to NULL → idempotency check skipped).

Frontend:
- `BankTransferPaymentData.idempotencyKey?: string` added to the contract.
- `Checkout.tsx` generates `crypto.randomUUID()` per submit attempt and
  reuses it across retries via `useRef`. Resets to null on success so the
  next click gets a fresh key (customer can place a second order in the
  same tab).

Net effect: a customer who clicks Place Order twice with a slow network
now ends up with ONE order. The first call generates a tracking row; the
second sees the existing key and returns the same `tracking_id` without
double-charging the operator's processing time.

## 4. Disabled button hover + status badge polish

`src/components/ui/Button.tsx`:

- Added `disabled:hover:bg-*` overrides per variant — disabled buttons no
  longer light up on hover. The illusion of being clickable is gone.
- Added `disabled:cursor-not-allowed` to the base class so the cursor
  matches the visual state.

`src/pages/AdminDashboard.tsx` status badges:

- "Delivered" was using the same green palette as "Paid", which made the
  two statuses look identical in the dashboard's busy view. Differentiated:
  - Paid → `bg-success-muted text-success-text`
  - Delivered → `bg-emerald-100 text-emerald-900` (deeper, distinct)
- Added a coloured leading dot to every badge for at-a-glance distinction
  beyond colour alone (helps colour-blind users).

## Verification

```
npx tsc --noEmit       → clean
npm run lint           → 0 errors, 0 warnings
npm test               → 58/58 pass
npm run build          → succeeds
```

## Migration sequence (now 6 total)

```
20260517100000_payment_tracking_create_table_parity.sql
20260517120000_order_status_history_and_audit_log.sql
20260517140000_upsert_payment_tracking_server_authoritative_totals.sql
20260517160000_lookup_order_by_reference_and_email.sql
20260517180000_bank_details_settings.sql
20260517200000_payment_tracking_idempotency_key.sql      ← NEW
```

All idempotent. Apply with `supabase db push` in order.

## Files added

- `src/hooks/usePaymentTrackingRealtime.ts`
- `supabase/migrations/20260517200000_payment_tracking_idempotency_key.sql`
- `docs/FIXES_APPLIED_2026-05-17_PASS_8.md` (this file)

## Files modified

- `src/components/ui/Button.tsx` — disabled hover overrides + cursor
- `src/pages/AdminCustomers.tsx` — remove dead column
- `src/pages/AdminDashboard.tsx` — realtime hook + badge dots
- `src/pages/AdminOrderDetail.tsx` — realtime hook (row-scoped)
- `src/pages/AdminPaymentTracking.tsx` — realtime hook
- `src/pages/Checkout.tsx` — idempotency key generation
- `src/services/bankTransferPayment.ts` — idempotency key field
- `src/services/supabaseService.ts` — remove dead column

## What's actually finished now

All 8 audit-list items from the pass-7 UI sweep are shipped. The migration
queue covers everything I can build from the repo: server-authoritative
totals, audit log, status history, customer order-status lookup, editable
bank details, idempotency key. Apply all six migrations and the production
behaviour matches the code.

The only items genuinely outstanding are ones I can't unilaterally do
without a product call:

- **Promote `payment_tracking` → `orders` + `order_items` with FKs.** Bigger
  schema change, multi-PR migration, will break legacy integrations if any.
- **Stripe or any real payment provider.** Out of scope; the manual
  bank-transfer flow is the system.
- **Customer accounts + order history.** New scope.
- **Email template editor in admin UI for the order-confirmation HTML.**
  Possible but probably better as its own pass.

I'd recommend leaving these for now and instead spending time applying the
migrations + smoke-testing the staged flow. Happy to keep going on a
specific area if you have one — say what's bugging you most when you use
the admin and I'll target it.
