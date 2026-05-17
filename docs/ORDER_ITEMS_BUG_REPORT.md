# Order Items Bug Report

## Summary

After a customer completes checkout, the admin dashboard order-detail modal shows "No items" or every field as "—" / "$0.00", even though the order, totals, and customer info display correctly.

## Severity

P0 — blocks fulfilment. Operators cannot see what to ship.

## Symptom paths

Two admin surfaces render order items:

1. **`/admin/payment-tracking`** — `src/pages/AdminPaymentTracking.tsx:342-351` — **WORKS**
   Reads `payment.cart_items` directly with `{name, price, quantity}`.

2. **`/admin/dashboard` → click row → OrderDetailsModal** — `src/components/admin/OrderDetailsModal.tsx:219-256` — **BROKEN**
   Reads `item.peptide_display_name`, `item.cfg_code`, `item.unit_price`, `item.line_total` — all `undefined`.

## Root cause

### Write side — `payment_tracking.cart_items` shape

`src/pages/Checkout.tsx:225-231`:
```ts
cartItems: state.items.map(item => ({
  id: item.peptideId,
  name: item.name,
  price: item.price,
  quantity: item.quantity,
  image: item.image,
})),
```

`src/services/bankTransferPayment.ts:63`:
```ts
p_cart_items: data.cartItems,
```

Goes through RPC `upsert_payment_tracking` and lands in `payment_tracking.cart_items` (jsonb) with shape `{ id, name, price, quantity, image }`.

### Read side — query

`src/services/supabaseService.ts:316-322`:
```ts
const { data, error } = await client
  .from('payment_tracking')
  .select('*')
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```
✓ Returns `cart_items` correctly.

### Read side — mapping (THE BUG)

`src/services/supabaseService.ts:134`:
```ts
peptide_items: row.cart_items,   // ← passes the wrong-shape array straight through
```

`paymentRowToOrder` does NOT transform `{id,name,price,quantity}` → `{cfg_code, peptide_display_name, unit_price, line_total}`. It just renames the property from `cart_items` to `peptide_items`. Items are present, but every field name the consumer reads is wrong.

### Read side — rendering

`src/components/admin/OrderDetailsModal.tsx:220-247`:
```tsx
const item = rawItem as {
  peptide_display_name?: string;
  cfg_code?: string;
  quantity?: number | string;
  line_total?: number;
  unit_price?: number;
};
// ...
{item.peptide_display_name || item.cfg_code || '—'}     // → '—'
Code: {item.cfg_code ?? '—'} • Qty: {item.quantity ?? 0} // → '—' • Qty: <real qty>
{formatPrice(item.line_total ?? 0)}                      // → $0.00
{formatPrice(item.unit_price ?? 0)} each                 // → $0.00
```

Quantity DOES display correctly because it has the same key on both shapes. Everything else is silently nulled.

## Why the bug has been masked

- `OrderDetailsModal.tsx:235` uses `|| '—'` which converts `undefined` into a benign-looking dash.
- `formatPrice(0)` renders `"$0.00"` cleanly — looks like a real value.
- No console errors, no TypeScript errors (cast suppresses them: `rawItem as { ... }`).
- The parallel `AdminPaymentTracking` page works, masking the discrepancy if the operator only ever uses that screen.

## Contributing factors

1. **Two storage shapes for the same concept**. `order_references.peptide_items` historically used `{cfg_code, peptide_display_name, unit_price, line_total}` (see `src/services/proteinCheckout.ts:142-149`). `payment_tracking.cart_items` uses the cart's `{id, name, price, quantity}` shape. The mapper at line 134 was written under the assumption it could just rename the property — but the underlying shapes diverged.
2. **No DB schema in repo for `payment_tracking`**. There is no `CREATE TABLE payment_tracking` migration; only `ALTER`/RLS/RPC. The shape contract is implicit.
3. **No tests cover the admin-side render path** for items.
4. **Optional-chaining fallbacks (`|| '—'`)** silently swallowed the missing fields.

## Fix

**Recommended (one file, ~12 lines)** — transform fields in `paymentRowToOrder`:

`src/services/supabaseService.ts:134`:
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
        id: o.id,
        name: o.name,
        price: o.price,
      };
    })
  : row.cart_items,
```

**Belt-and-braces** — also fix `OrderDetailsModal.tsx:235-246` to fall back to the cart shape:
```tsx
{item.peptide_display_name || item.name || item.cfg_code || '—'}
Code: {item.cfg_code ?? item.id ?? '—'} • Qty: {item.quantity ?? 0}
{formatPrice(item.line_total ?? ((item.unit_price ?? item.price ?? 0) * Number(item.quantity ?? 0)))}
{formatPrice(item.unit_price ?? item.price ?? 0)} each
```

## Verification

1. Open `/admin/dashboard`, pick any existing paid order, click row, confirm items render with names, qty, unit price, line total.
2. Place a new test order (use test mode if available). Confirm same admin view.
3. Confirm `/admin/payment-tracking` still works.
4. Run `npm test` and `npm run typecheck`.

## Out of scope for this fix

- Migrating to a real `order_items` table.
- Server-side total verification.
- Removing the dead `order_references` write path.

Those are tracked in `REFACTOR_PLAN.md` and `IMPROVEMENT_BACKLOG.md`.

## Risk

- **Low**. The fix is a pure-function transformation on read; nothing in the DB or write path changes. Existing data renders correctly immediately.
- Backwards-compatible — the original `id/name/price` keys are preserved.
