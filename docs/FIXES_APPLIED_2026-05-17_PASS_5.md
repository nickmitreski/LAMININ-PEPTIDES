# Fixes Applied — 2026-05-17 (Pass 5)

Two big items shipped:

1. **`/admin/audit` page** — admins can now browse the audit log written in pass 4.
2. **Server-authoritative totals migration** — the long-promised P1 from the security audit. Stops client-side price tampering.

## 1. Admin audit viewer

`src/pages/AdminAudit.tsx` — full audit log browser at `/admin/audit`.

Features:
- Filter by action substring (e.g. `"order."`, `"delete"`), target table (orders / products / customers / discounts), and time window (1h / 24h / 7d / 30d / all time).
- Filters persist in the URL — shareable / bookmarkable.
- Pagination at 100 rows / page.
- Expandable `before` / `after` JSON snapshots (rendered as `<details>` so the table doesn't blow up when there are 50 rows on screen).
- Target column links straight back to `/admin/orders/:id` for `payment_tracking` rows.
- Actor column shows the first 8 chars of the JWT subject (full UUID on hover via the underlying `<span>`).
- Refresh button with a spinner that doesn't block the page.

**Pre-migration UX**: if the `admin_audit_log` table doesn't exist yet, the page renders a warning Card with the exact migration command to apply. The rest of the admin keeps working — `logAdminAction` swallows the missing-table error silently.

Wiring:
- `src/App.tsx` — new `<Route path="/admin/audit">` under `ProtectedRoute` + `AdminErrorBoundary`.
- `src/components/admin/AdminNavigation.tsx` — new nav item with `ShieldCheck` icon.
- `src/services/auditLog.ts` — new `listAuditLog(filters, client, limit, offset)` with `AuditLogFilters` interface (action substring / targetTable / actor / since).

## 2. Server-authoritative totals

New migration: `supabase/migrations/20260517140000_upsert_payment_tracking_server_authoritative_totals.sql`

This was the single biggest remaining security item identified in `SECURITY_RLS_AUDIT.md`. Before this migration, a customer with devtools could rewrite `cart_items[].price` to `0.01` and submit a $0.13 order for $3,000 of product.

### What the new RPC does

The signature is **unchanged** (so the frontend keeps working without any deploy ordering risk), but the body now ignores most of what the client sends:

| Client-supplied param | What the server does with it |
|---|---|
| `p_cart_items[].id` | Used to look up the canonical price in `product_mappings` |
| `p_cart_items[].quantity` | Trusted (clamped to ≥ 0, floored to integer) |
| `p_cart_items[].price` | **Ignored**. Stamped in the stored row as `client_price` for forensics, but the canonical price is what's written |
| `p_subtotal` | **Ignored**. Recomputed from `Σ(canonical_price × qty)` |
| `p_shipping` | **Ignored**. Recomputed via `express_shipping_aud()` (free over $300, else $15) |
| `p_tax` | **Ignored**. Recomputed via `checkout_gst_amount()` (1/11th of subtotal) |
| `p_total_amount` | **Ignored**. Recomputed as `subtotal + shipping + tax - discount_applied` |
| `p_discount_code` | Looked up against `discount_codes`; validates `is_active`, `valid_until`, `max_redemptions`, `min_order_amount` |
| `p_discount_amount` | Capped by the server-computed discount (the client never gets MORE discount than the code authorises) |

### Tamper detection

When the client-asserted `total_amount` differs from the server's recomputed total by more than 1¢, the function:
- Stamps a line in `admin_notes` with both numbers and a timestamp.
- Returns `tamper_detected: true` in the response payload.
- The frontend (`Checkout.tsx`) catches that, logs a warning, and shows the customer an info toast: "Your order total was updated to $X based on current pricing."

### Defence-in-depth helpers

Two new IMMUTABLE SQL functions that mirror `src/lib/shippingPolicy.ts`:

```sql
public.express_shipping_aud(p_subtotal NUMERIC)  -- 0 if ≥ $300, else 15
public.checkout_gst_amount(p_subtotal NUMERIC)   -- ROUND(subtotal / 11, 2)
```

If the front-end shipping logic ever changes, these need to be updated to match. Documented inline in the migration.

### What gets stored

The function rebuilds `cart_items` so the canonical price is what's persisted, but it also stamps the client's price next to it:

```jsonb
{
  "id": "bpc157",
  "name": "BPC-157 10mg",
  "price": 79.00,           // canonical
  "quantity": 1,
  "image": "/images/...",
  "client_price": "0.01"    // forensic: what the client claimed
}
```

So even after the recompute "fixes" the price, the admin can see exactly what was attempted.

### Function return shape

Pre-migration the RPC returned `{ success, tracking_id }`. Post-migration it also returns:

```ts
{
  success: true,
  tracking_id: "uuid",
  server_subtotal: number,
  server_shipping: number,
  server_tax: number,
  server_discount: number,
  server_total: number,
  client_total_was: number,
  tamper_detected: boolean,
}
```

### Frontend wiring

`src/services/bankTransferPayment.ts` returns a new `serverTotals` field:

```ts
type ServerTotalsResult = {
  available: boolean;           // true once migration is applied
  serverTotal?: number;
  serverSubtotal?: number;
  serverShipping?: number;
  serverTax?: number;
  serverDiscount?: number;
  tamperDetected?: boolean;
  clientTotalWas?: number;
};
```

`available` is the migration-state detection — pre-migration the new fields just won't be in the response, so `available` stays false and the rest of the code uses the client-computed total. Post-migration, the customer email and customer-record upsert both use `authoritativeTotal` from the server.

## 3. Pre-existing audit-trail bug fixed

While reviewing the migration, I caught a schema mismatch in my own pass-4 work — the migration referenced `discount_codes.usage_count` and `expires_at`, but the actual column names are `redemption_count` and `valid_until`. Discount type is `'percentage'`, not `'percent'`. Also added the `min_order_amount` and `max_discount_amount` checks. Fixed before merging.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 58/58 pass |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | succeeds |
| Manual: `/admin/audit` renders pre-migration with the warning Card | works |
| Manual: nav item "Audit" appears between "Tools" and the logout button | works |

## Files added

- `src/pages/AdminAudit.tsx`
- `supabase/migrations/20260517140000_upsert_payment_tracking_server_authoritative_totals.sql`
- `docs/FIXES_APPLIED_2026-05-17_PASS_5.md` (this file)

## Files modified

- `src/App.tsx` — new lazy import + route
- `src/components/admin/AdminNavigation.tsx` — Audit nav item + `ShieldCheck` icon
- `src/services/auditLog.ts` — `listAuditLog`, `AuditLogFilters`
- `src/services/bankTransferPayment.ts` — `ServerTotalsResult` returned alongside `success`/`trackingId`
- `src/pages/Checkout.tsx` — uses server's authoritative total for customer-record upsert + email when migration is live; shows info toast on tamper detection

## Migration ordering (UPDATED)

The user now has 4 staged migrations to apply against the live Supabase project:

```
20260517100000_payment_tracking_create_table_parity.sql
20260517120000_order_status_history_and_audit_log.sql
20260517140000_upsert_payment_tracking_server_authoritative_totals.sql
```

Apply in order via `supabase db push` or paste into the SQL editor in sequence. Each is safely idempotent / overwriting (CREATE OR REPLACE, CREATE TABLE IF NOT EXISTS, ALTER TABLE ... ADD COLUMN IF NOT EXISTS).

After migration 3 is applied:
- Customer can no longer set prices via devtools.
- Totals shown in customer email come from server, not client.
- Tamper attempts get a forensic line in `admin_notes` and an `admin_audit_log` row (if migration 2 is also applied).
- The new info toast appears at checkout if the server's number differs from what the customer saw.

## What's still left

- **Real refund integration (Stripe / etc.)** — currently records intent.
- **`orders` / `order_items` table promotion** — multi-phase migration documented in `REFACTOR_PLAN.md`.
- **CSRF protection on the public RPC** — `secure-checkout-init` edge function exists but isn't currently a gating step.
- **Idempotency-key column** on `payment_tracking` — the new RPC's `ON CONFLICT (order_reference)` is already idempotent per-reference, but a dedicated key would let us also detect "same submit, different reference" cases.
- **Email template editor wiring** — the modal works but isn't integrated with the new authoritative totals yet.

That's everything I can safely ship from the repo alone. The remaining items either need provider integrations (Stripe), large multi-PR migrations (`orders`/`order_items`), or product decisions you haven't asked for. Let me know which way you want to keep pushing.
