# Fixes Applied — 2026-05-17 (Pass 4)

Pass 4 wires the new `admin_audit_log` table into the existing admin action
surface and ships the long-promised cancel / refund workflow. Both pieces work
without the migration applied (graceful degradation), but light up fully once
the user runs `supabase db push`.

## 1. Audit log service

`src/services/auditLog.ts` — small wrapper around `admin_audit_log` with two
properties that matter most:

- **Never throws.** Every helper catches everything and logs to console.
  Audit logging must NEVER break the primary admin action.
- **Silently no-ops when the table doesn't exist yet** (PostgREST `42P01`).
  This lets us land the wiring before the migration is applied, with zero
  visible difference until the user runs `supabase db push`.

API:
```ts
logAdminAction({ action, target_table, target_id?, before?, after?, note? }, client?)
getAuditLog(target_table, target_id, client?, limit?)
```

Conventions documented in the file header:
- `action` = `<entity>.<verb>` past-tense (e.g. `order.mark_paid`, `customer.edit`)
- `target_table` matches the underlying DB table
- `target_id` is the row's PK as text (works for both uuids and `LM-XXX` refs)
- `before` / `after` are jsonb snapshots — shallow, no secrets

Tests: `src/services/auditLog.test.ts` — 5 cases covering insert success,
missing-table silent no-op, other-error warning, and the null-client guard.

## 2. Wired into 8 existing admin actions

Every server-side admin write now logs to `admin_audit_log` on success. Failures
on the audit row never block the primary action.

| Action | `action` value | What it logs |
|---|---|---|
| `updateOrderStatus` | `order.status.<new>` | before/after status, snapshotted before write |
| `deleteOrder` | `order.delete` | before-snapshot (id, ref, email, name, status, amount) — only chance to capture since DELETE is irreversible |
| `markPaymentReceived` | `order.mark_paid` | tracking id + admin email in note |
| `cancelOrder` (new) | `order.cancel` or `order.refund` | before/after status + refunded flag + reason in note |
| `createProduct` | `product.create` | cfg_code, name, price |
| `updateProduct` | `product.edit` | the entire `updates` patch as `after` |
| `deleteProduct` | `product.delete` | before-snapshot (cfg, names, price, is_active) |
| `adminUpdateCustomer` | `customer.edit` | the patch as `after` |
| `deleteCustomerAndOrders` | `customer.delete` | email + orders-deleted count |
| `deleteDiscountCode` | `discount.delete` | before-snapshot (code, type, value) |

This covers every admin-side mutation surfaced today. Future RPCs that
mutate state should call `logAdminAction()` from the service-layer wrapper
(not the page-layer) so coverage stays consistent.

The DB migration also sets `actor text DEFAULT (auth.uid())::text` so admin-side
INSERTs stamp who did it without the client needing to pass it.

## 3. Cancel / refund workflow

`cancelOrder(orderId, { reason, refunded? }, client)` in `supabaseService.ts`:

- Requires a non-empty reason string. Returns `{ success: false, error }` otherwise — no DB write.
- Rejects re-cancellation: if the order is already `cancelled`, returns an error.
- Atomically: snapshots existing row → updates `payment_status='cancelled'` → appends a timestamped audit line to `admin_notes` → writes an `admin_audit_log` row with `action: 'order.cancel'` or `'order.refund'` and the reason as `note`.
- The existing `payment_tracking_status_history` trigger logs the `pending → cancelled` transition independently in `order_status_history`, so both tables stay consistent.

### UI

`OrderDetailsModal`:

- New `onPaymentAction` signature: `(action: 'mark_paid' | 'archive' | 'cancel' | 'refund', trackingId, reason?)`.
- New "Cancel order" button visible when status ≠ cancelled. New "Refund & cancel" button visible only when status = `payment_received` (refund only makes sense if money has been received).
- Both buttons open a **nested confirm sub-modal** (uses the same `<Modal>` primitive, so focus trap / ESC / scroll-lock all work). The sub-modal requires a non-empty reason before the action is enabled.
- Sub-modal explicitly notes that the refund itself must still be processed in the payment provider — this records intent, not the wire transfer.

### Wiring

`AdminDashboard` and `AdminOrderDetail` both handle the new `'cancel'` /
`'refund'` actions through their existing `onPaymentAction` prop. Both refresh
the order + history after the action so the timeline updates immediately.

Tests: `src/services/supabaseService.test.ts` adds 4 cases:
- empty-reason rejection
- already-cancelled rejection
- happy path logs `order.cancel` with correct `before`/`after`/`note`
- `refunded: true` path logs `order.refund`

## 4. Migration tweak

`supabase/migrations/20260517120000_order_status_history_and_audit_log.sql`:

```sql
actor text DEFAULT (auth.uid())::text,
```

Without this, client-side INSERTs from the admin UI would leave `actor` NULL.
With it, every audit row is automatically stamped with the calling JWT subject.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | **58/58 pass** (was 49 — 5 new auditLog tests, 4 new cancelOrder tests) |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | succeeds |
| Manual: cancel an order via the modal | UI updates immediately; status history shows the transition (once migration is applied) |
| Manual: cancel without a reason | submit button stays disabled |
| Manual: try to cancel an already-cancelled order | service returns `success: false`, toast shows reason |

## Files added

- `src/services/auditLog.ts`
- `src/services/auditLog.test.ts`
- `docs/FIXES_APPLIED_2026-05-17_PASS_4.md` (this file)

## Files modified

- `src/services/supabaseService.ts` — `logAdminAction` calls in 9 admin actions + new `cancelOrder` export
- `src/services/supabaseService.test.ts` — 4 new cancelOrder tests
- `src/services/discountService.ts` — `logAdminAction` in `deleteDiscountCode`
- `src/components/admin/OrderDetailsModal.tsx` — cancel/refund buttons + confirm sub-modal
- `src/pages/AdminDashboard.tsx` — wired cancel/refund into `onPaymentAction`; imported `cancelOrder`
- `src/pages/AdminOrderDetail.tsx` — wired cancel/refund; refreshes order + history after
- `supabase/migrations/20260517120000_order_status_history_and_audit_log.sql` — `actor` column gets `DEFAULT (auth.uid())::text`

## Migration ordering reminder

The user must apply the SQL migrations against the live Supabase project for
the audit log writes to actually persist. Until then:

- All admin actions still work normally (`logAdminAction` swallows the missing-table error).
- The `order.cancel` / `order.refund` operations write the status change + `admin_notes` regardless.
- The history Card on `/admin/orders/:id` stays empty.

To apply:
```
cd supabase
supabase db push
```
or paste the two migration files in order into the SQL editor on Supabase.

## What's still left for a future pass

- **Server-side total recompute** in `upsert_payment_tracking` — biggest remaining security item. Needs a Supabase RPC rewrite.
- **`orders` / `order_items` table promotion** — multi-PR migration documented in `REFACTOR_PLAN.md`.
- **An admin-facing audit log viewer** — table is populated but no UI to browse it yet. Quick follow-up: a `/admin/audit` page with filters.
- **Real refund integration** — currently records refund INTENT. Wiring to Stripe / a payment provider is its own scope.
- **Idempotency key on order creation** — frontend has the `isSubmitting` guard, RPC could still benefit from a unique-key column.
- **Stripping originals from prod deploy** — opt-in script exists; the user can flip the deploy command.
