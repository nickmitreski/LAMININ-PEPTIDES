# Admin Dashboard Audit

## Pages

| Page | File | Purpose |
|---|---|---|
| Dashboard | `src/pages/AdminDashboard.tsx` | Orders list, click row → OrderDetailsModal |
| Payment Tracking | `src/pages/AdminPaymentTracking.tsx` | Bank-transfer orders, mark-paid workflow |
| Products | `src/pages/AdminProducts.tsx` | Catalog editor |
| Collections | `src/pages/AdminCollections.tsx` | |
| Customers | `src/pages/AdminCustomers.tsx` | |
| Discounts | `src/pages/AdminDiscounts.tsx` | |
| Inventory | `src/pages/AdminInventory.tsx` | (Inventory data model not present in repo migrations — see SUPABASE_SCHEMA_AUDIT) |
| Emails | `src/pages/AdminEmails.tsx` | |
| Tools | `src/pages/AdminTools.tsx` | |
| Research | `src/pages/AdminResearch.tsx` | |
| Login | `src/pages/AdminLogin.tsx` | Magic link / password auth |

## How orders are fetched

### AdminDashboard
- `AdminDashboard.tsx:26`: `getAllOrders(ORDERS_PAGE_SIZE, page * ORDERS_PAGE_SIZE, db)`
- → `supabaseService.ts:316` runs `from('payment_tracking').select('*').order('created_at', desc).range(...)`.
- → `paymentRowToOrder` maps each row into the legacy `OrderReferenceRow` shape.

**Issue at line 134**: `peptide_items: row.cart_items` passes the wrong-shape array straight through. See ORDER_ITEMS_BUG_REPORT.md.

### AdminPaymentTracking
- Direct query at line 59-66: `from('payment_tracking').select('*').in('payment_status', [...]).order(...)`.
- Renders `payment.cart_items` directly (line 342) — works.

## OrderDetailsModal review

`src/components/admin/OrderDetailsModal.tsx`

| Section | Lines | Status |
|---|---|---|
| Customer info | ~120-180 | OK |
| Shipping address | ~180-210 | OK; falls back to "No shipping address provided" |
| Order items (main) | 213-258 | **BROKEN** — reads `peptide_display_name/cfg_code/unit_price/line_total` from cart-shape items |
| Discount section | 260-279 | OK |
| Internal notes | 281-291 | OK |
| Payment tracking section | 293+ | OK |
| Reconstitution guide | 350-410 | Partially tolerant — line 370 uses `peptide_display_name || name || cfg_code`, so it actually works on cart-shape items |

Other issues in modal:
- No "raw payload" debug pane — would have surfaced the shape mismatch instantly.
- `formatPrice(0)` for missing unit_price renders as a valid-looking "$0.00". Loud failure would be better: render "—" and a warning badge.
- No status change history.
- No fulfillment status / shipment tracking.
- No "resend email" button (despite emails being send-from-admin elsewhere).
- No refund/cancel button.
- Modal closes on outside click — no unsaved-changes guard (currently no edit fields in modal, but planned features will need it).

## Loading/error states

- `getAllOrders` returns `[]` on error after `console.error` — silent fail. AdminDashboard shows "no orders" instead of "load failed". Misleading on Supabase outages.
- `OrderDetailsModal` has no error boundary specific to it; relies on `AdminErrorBoundary.tsx` at the page level.

## Recommended improvements (priority-ordered)

P0 — fix the items shape bug (see ORDER_ITEMS_BUG_REPORT.md).

P1
- Add a debug "view raw payload" toggle to OrderDetailsModal (admin-only).
- Distinguish "no orders" from "load error" in AdminDashboard.
- Render missing-required-field items in red with a "data shape warning" instead of "—" / "$0.00".

P2
- Order detail dedicated page (`/admin/orders/:id`) with deep linking. Modal-only UX is fragile.
- Status change actions (cancel, refund, mark fulfilled) with `order_status_history` write.
- CSV export.
- Search by email/order ref; filter by date range / status / value.
- Sort by date / status / value.
- Admin audit trail (who marked paid, who changed status, when).
- Resend order-confirmation email button.
- "Open in Stripe / payment provider" link if/when payments table is introduced.

P3
- Bulk operations (bulk mark paid, bulk export).
- Saved filters.
- Print packing slip.

## Security in admin

- `ProtectedRoute.tsx` gates admin pages; `AdminAuthContext.tsx` exposes session.
- Server-side enforcement via `jwt_is_admin()` and RLS on tables.
- `supabaseAdminClient.ts` uses the same anon key (no service-role exposed to client — correct).
- The actual privilege check is the JWT custom claim `is_admin` (see migration 20260405). Confirm the live admin user has this claim set; otherwise RLS will block everything and admin will appear empty (another way orders could "not show").
