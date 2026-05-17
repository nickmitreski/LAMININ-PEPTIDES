# URGENT FIXES — Ecommerce Production Audit

Date: 2026-05-17
Scope: laminin-site (React + Vite + Supabase ecommerce)

This file is the TL;DR. See companion docs for full detail.

## ⚠️ TOP BUG — Admin order detail shows "—" / "No items" for ordered products

### Root cause (95% confidence)

The write side and read side **agree on the table** (`payment_tracking`) but **disagree on the JSON item shape**.

| Surface | Field name | Item shape |
|---|---|---|
| Write — `src/pages/Checkout.tsx:225-231` → `src/services/bankTransferPayment.ts:63` → RPC `upsert_payment_tracking(p_cart_items)` | `payment_tracking.cart_items` (jsonb) | `{ id, name, price, quantity, image }` |
| Read — `AdminDashboard` → `supabaseService.getAllOrders` → `paymentRowToOrder()` at `src/services/supabaseService.ts:134` | maps row directly into `peptide_items` (no field transform) | (passes through `{ id, name, price, quantity, image }`) |
| Render — `src/components/admin/OrderDetailsModal.tsx:220-247` | reads `item.peptide_display_name`, `item.cfg_code`, `item.unit_price`, `item.line_total` | (all `undefined` → renders `'—'` and `formatPrice(0)`) |

So the items ARE persisted correctly and ARE returned by the query — but every field the modal reads has the wrong name. The modal silently shows "—" instead of failing loudly.

`AdminPaymentTracking.tsx` (lines 342-351) works correctly because it reads `payment.cart_items` with the actual `{name, price, quantity}` shape. The bug is isolated to `AdminDashboard` → `OrderDetailsModal`.

### Safest minimal fix (recommended)

**One change**, `src/services/supabaseService.ts`, function `paymentRowToOrder` at line 115. Replace line 134 to normalise field names before handing to the modal:

```ts
// BEFORE
peptide_items: row.cart_items,

// AFTER
peptide_items: Array.isArray(row.cart_items)
  ? (row.cart_items as Array<Record<string, unknown>>).map((o) => {
      const quantity = Number(o.quantity) || 0;
      const unit_price = Number(o.price) || 0;
      return {
        cfg_code: String(o.id ?? ''),
        peptide_display_name: String(o.name ?? ''),
        quantity,
        unit_price,
        line_total: unit_price * quantity,
        image: typeof o.image === 'string' ? o.image : undefined,
        // keep originals so modal's fallback chains keep working
        id: o.id,
        name: o.name,
        price: o.price,
      };
    })
  : row.cart_items,
```

Notes:
- Backwards-compatible — leaves existing keys present.
- No DB change, no migration, no schema risk.
- Existing orders display immediately on next refresh.
- `OrderDetailsModal` lines 235-246 will now find `peptide_display_name`, `cfg_code`, `unit_price`, `line_total`.

### Optional defence-in-depth fix

Also make `OrderDetailsModal.tsx` tolerant of either shape (`item.peptide_display_name || item.name`, etc.) — already partially done at line 370 for the reconstitution block, but not at lines 235-246 for the main list. Apply the same fallbacks.

### Verification checklist

1. Place a test bank-transfer order (or pick any existing order).
2. Open `/admin/dashboard`, click the order row, confirm the modal shows:
   - Product display name (not `'—'`)
   - Quantity ≥ 1
   - Unit price = product price
   - Line total = unit × qty
3. Confirm `/admin/payment-tracking` still renders item lines (no regression).
4. Run `npm run typecheck` and `npm test`.

---

## Other urgent items (priority order)

| # | Severity | Item | Doc |
|---|---|---|---|
| 1 | P0 | Order items not displayed in admin (above) | ORDER_ITEMS_BUG_REPORT.md |
| 2 | P0 | `payment_tracking` table has no `CREATE TABLE` migration in repo — schema lives only on the live project, blocking reproducible rebuilds and CI | SUPABASE_SCHEMA_AUDIT.md |
| 3 | P1 | No server-side price/total verification — totals trust the client | SECURITY_RLS_AUDIT.md |
| 4 | P1 | Two parallel order-storage paths coexist (`order_references` + `payment_tracking`); `order_references` is dead code on the active checkout flow but still has insert APIs — risk of split-brain if reactivated | REFACTOR_PLAN.md |
| 5 | P1 | No durable line-items table; everything is JSON in a JSONB column — no FK to products, no inventory join, no reporting | REFACTOR_PLAN.md |
| 6 | P2 | No idempotency key on `createPaymentTracking` — duplicate-submit risk mitigated only by client-side guard at `bankTransferPayment.ts:44-55` | RELIABILITY in ECOMMERCE_AUDIT_REPORT.md |
| 7 | P2 | `OrderDetailsModal` silently renders `'—'` / `formatPrice(0)` on missing fields — masked the bug for who-knows-how-long | ADMIN_DASHBOARD_AUDIT.md |
| 8 | P2 | No order_status_history table | REFACTOR_PLAN.md |
| 9 | P3 | Admin notifications + email failures are fire-and-forget without retry queue | RELIABILITY |
