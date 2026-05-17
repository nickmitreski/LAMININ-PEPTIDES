# Fixes Applied — 2026-05-17 (Pass 7)

User asked: keep pushing on the manual bank-transfer flow + sweep through any
UI issues. This pass shipped:

1. **Bank details now editable from `/admin/settings`** (no edge-function redeploy)
2. **"Resend payment instructions" button** on the order detail modal
3. **`<ConfirmDialog>` primitive** + every `window.confirm()` and `alert()` removed
4. **Inline `$${x.toFixed(2)}` → `formatPrice()`** in five hot paths
5. **Cart hit-target fix** for the awkward `sm:` breakpoint

## 1. Bank details admin settings

New migration: `supabase/migrations/20260517180000_bank_details_settings.sql`

- `bank_details` table — enforced singleton via a partial unique index on `(singleton) WHERE singleton`.
- Seeded with the previously-hardcoded values (013402 / 807892935 / MJCA Group) so the live email function never sees an empty result.
- `bank_details_history` companion table + AFTER UPDATE trigger logs every change (before/after JSON + actor from `auth.uid()`).
- Touch-trigger keeps `updated_at` / `updated_by` honest.
- RLS: public SELECT (the storefront and edge function both read it), admin-only UPDATE. No INSERT/DELETE policy — only the seeded row exists, admins update it in place. History table is admin-read-only, append-only via trigger.

Frontend service: `src/services/bankDetailsService.ts`

- `getBankDetails(client?, { force? })` — 5-minute module cache; falls back to hardcoded values when the table doesn't exist yet (pre-migration).
- `updateBankDetails(id, patch, client)` — admin-only; validates inputs; writes an `admin_audit_log` entry tagged `bank_details.edit`.

New page: `src/pages/AdminSettings.tsx` (route `/admin/settings`, nav item with `Settings` icon)

- Form with BSB / account number / account name / optional bank name.
- "Dirty" detection enables Save only when something changed; Reset reloads.
- Pre-migration warning Card with the exact migration command.

Edge function: `supabase/functions/send-order-email/index.ts` now reads from the table via a service-role client. If the read fails or the table is missing, it falls back to the same hardcoded constants — emails never break.

## 2. Resend payment instructions button

New service helper: `resendOrderInstructionsEmail()` in
`src/services/emailService.ts`. Wraps `sendOrderEmail` and writes an
`admin_audit_log` row tagged `order.resend_email` regardless of success — so
the operator's intent is captured even when Resend is down.

UI: new button in `OrderDetailsModal` next to "Mark as Paid", visible only when
the order has a customer email. Title attribute shows the destination. Wired
in both `AdminDashboard` (modal-in-page) and `AdminOrderDetail` (dedicated page).

Toast on success: `Instructions resent to <email>`. On failure, surfaces the
real error message rather than a generic one.

## 3. `<ConfirmDialog>` primitive + native confirms removed

New component: `src/components/ui/ConfirmDialog.tsx`

- Built on `<Modal>` so it inherits focus trap, ESC, scroll lock, scrollbar
  compensation, portal rendering.
- Tones: `danger` (red), `warning` (orange), `primary` (brand).
- `loading` prop disables both buttons + shows a spinner during async confirm.
- Optional `confirmLabel` / `cancelLabel`; defaults are "Confirm" / "Cancel".

Replaced every `window.confirm()` and `alert()` call:

| File | What it was | Now |
|---|---|---|
| `src/pages/Cart.tsx:23` | `window.confirm('Remove all items…')` | `<ConfirmDialog>` (danger) |
| `src/components/admin/ProductEditor.tsx:376` | `confirm('Delete this image?')` | `<ConfirmDialog>` (danger, async loading) |
| `src/pages/AdminResearch.tsx:90` | `confirm('Remove DB override?')` | `<ConfirmDialog>` (warning, async loading) |
| `src/pages/AdminInventory.tsx:148` | `alert('Please enter a valid qty…')` | `showToast(..., 'error')` |
| `src/pages/AdminInventory.tsx:190` | `alert('Failed to adjust inventory:…')` | `showToast(..., 'error')` |
| `src/pages/AdminInventory.tsx:216` | `alert('✅ Inventory updated…')` | `showToast(..., 'success')` |
| `src/pages/AdminEmails.tsx:206` | `alert('Failed to save template')` | `showToast(..., 'error')` |
| `src/pages/AdminEmails.tsx:235` | `alert('Failed to create template')` | `showToast(..., 'error')` |

Result: no more main-thread-blocking native dialogs anywhere in the app.

## 4. Inline price formatting consolidated

Replaced `$${x.toFixed(2)}` / `${'$' + x.toFixed(2)}` patterns with `formatPrice(x)` from `src/lib/formatCurrency.ts`:

- `src/components/peptides/PeptideCard.tsx:42` — DB-price fallback label
- `src/components/admin/OrderDetailsModal.tsx:353` — payment tracking total
- `src/pages/Checkout.tsx:260` — server-recompute info toast
- `src/pages/ProductPage.tsx:134` — DB-price line
- `src/pages/AdminDashboard.tsx:1281` — bulk mark-paid combined total

One source of truth makes future currency-format changes a one-file edit.

## 5. Cart hit-target fix

`src/components/cart/CartItem.tsx` — the +/- quantity buttons were `h-11 w-11`
on mobile (good — 44px WCAG) but shrank to `sm:h-9 sm:w-9` (36px — below
WCAG) at the 640px breakpoint. Bumped to `sm:h-10 sm:w-10` (40px) which is
the standard compact-button size in this design system while staying touch-friendly.

## Verification

```
npx tsc --noEmit       → clean
npm run lint           → 0 errors, 0 warnings
npm test               → 58/58 pass
npm run build          → succeeds
```

## Migration sequence (now 5 total)

```
20260517100000_payment_tracking_create_table_parity.sql
20260517120000_order_status_history_and_audit_log.sql
20260517140000_upsert_payment_tracking_server_authoritative_totals.sql
20260517160000_lookup_order_by_reference_and_email.sql
20260517180000_bank_details_settings.sql               ← NEW
```

All idempotent. The new migration seeds the table with the same hardcoded
values the edge function used to ship with, so the customer email is
byte-for-byte identical the moment the migration runs.

## Files added

- `src/services/bankDetailsService.ts`
- `src/pages/AdminSettings.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `supabase/migrations/20260517180000_bank_details_settings.sql`
- `docs/FIXES_APPLIED_2026-05-17_PASS_7.md` (this file)

## Files modified

- `src/App.tsx` — `/admin/settings` route
- `src/components/admin/AdminNavigation.tsx` — Settings nav item
- `src/components/admin/OrderDetailsModal.tsx` — Resend button + formatPrice fix
- `src/components/admin/ProductEditor.tsx` — image-delete confirm dialog
- `src/components/cart/CartItem.tsx` — hit-target fix
- `src/components/peptides/PeptideCard.tsx` — formatPrice
- `src/pages/AdminDashboard.tsx` — resend wiring + formatPrice
- `src/pages/AdminEmails.tsx` — toasts instead of alerts
- `src/pages/AdminInventory.tsx` — toasts instead of alerts
- `src/pages/AdminOrderDetail.tsx` — resend wiring
- `src/pages/AdminResearch.tsx` — confirm dialog
- `src/pages/Cart.tsx` — clear-cart confirm dialog
- `src/pages/Checkout.tsx` — formatPrice
- `src/pages/ProductPage.tsx` — formatPrice
- `src/services/emailService.ts` — `resendOrderInstructionsEmail()` helper
- `supabase/functions/send-order-email/index.ts` — `loadBankDetails()` reader with fallback

## Still on the audit list

Items the audit identified that weren't shipped this pass — tracked for next time:

- **Realtime on AdminPaymentTracking + AdminOrderDetail** — port the Dashboard's channel pattern.
- **Dead `protein_store_order_id` column cleanup** — partner-bridge leftover.
- **Idempotency-key column on `payment_tracking`** — guard for double-submits.
- **Disabled button hover styles** — buttons keep hover colour when disabled. Quick CSS fix.
- **Empty state on Library when search returns 0** — verify the existing copy actually shows; the audit flagged it as missing but it may be there now.
- **Status badge icon variation** — paid/delivered both green; add distinguishing shape.

Want me to keep going? Best next thrust: (a) realtime subscriptions on the remaining admin pages so a second operator sees changes immediately, or (b) clean up the dead `protein_store_order_id` lines plus the disabled-button hover bug. Both are low-risk and finish the audit list.
