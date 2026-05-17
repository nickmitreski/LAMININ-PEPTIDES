# Fixes Applied — 2026-05-17 (Pass 6)

User reframed: **no payment integration; bank-transfer flow is the system**. Manual
admin control is the point. Push polish in THAT direction.

Audit identified 15 next-best improvements. This pass ships 7 of them — the
high-frequency operator wins + the biggest customer-trust gaps.

## 1. Persistent admin filter/sort preferences

`src/hooks/usePersistedState.ts` — new SSR-safe, multi-tab-aware `usePersistedState<T>(key, initial)` hook.

Wired into `AdminDashboard`:
- `filterStatus` → `admin.orders.filterStatus`
- `sortKey` → `admin.orders.sortKey`
- `sortDir` → `admin.orders.sortDir`

Now the operator's status filter and sort column survive page reloads, navigation,
and tab switches. Multi-tab: storage events sync changes across open admin tabs.

## 2. Order list search now matches cart items

`src/pages/AdminDashboard.tsx` — `filteredOrders` filter extended to also match
`cart_items[].name` and `cart_items[].id`. Lets the operator answer "who ordered
BPC-157 this week?" by typing `bpc157` into the existing search box. Placeholder
updated to say so.

No DB / backend change required because the orders are already loaded client-side.

## 3. Payment-deadline policy surfaced everywhere

Added a single source of truth in `src/lib/shippingPolicy.ts`:

```ts
export const PAYMENT_DEADLINE_HOURS = 48;
export function paymentDeadlineDate(fromIso?): Date;
export function formatPaymentDeadlineLocal(fromIso?): string;
```

Wired into:
- **Order confirmation page** (`OrderConfirmation.tsx`) — new card under "Payment required" showing the deadline in the customer's local time with a "reply if you need more time" line.
- **Email template** (`supabase/functions/send-order-email/index.ts`) — new yellow callout with the deadline in AEST (bank's time zone is the truth), plus a matching block in the text/plain version. New `formatDeadlineAEST()` helper inside the edge function.
- **`/order-status` page** (new — see #5) — the awaiting-payment state shows the deadline.

Currently the deadline is informational; no automation enforces cancellation. An
admin can still mark stale orders cancelled manually with the existing flow.

## 4. Bulk "mark as paid" action

`src/pages/AdminDashboard.tsx` — new button in the bulk-action bar (next to
"Delete selected"). Opens a small confirm modal showing:
- How many of the selected orders are eligible (excludes already-paid + cancelled)
- Combined total of the eligible orders

The handler calls `markPaymentReceived` for each — which (since pass 4) audit-logs,
fires the SMS + email notify, and the order_status_history trigger logs the
transition. Summary toast at the end: "5 marked paid, 2 skipped, 0 failed".

Real bank-statement workflow: paste the 20 transfers into the orders list view,
select the matching rows, click Mark selected paid, done.

## 5. Public customer order-status page

New page: `/order-status` (`src/pages/OrderStatus.tsx`)

- Customer enters order reference + email; both must match.
- Shows a colour-coded card with the current status and a plain-English description.
- Awaiting-payment state shows the deadline.
- Linked from:
  - The order confirmation page (new "Track order" button between Continue and Contact)
  - The site footer (Resources → Track order)
  - Will be linked from the order email next pass (it's a small template edit)
- Search params persist `ref` + `email` so the URL is reload-safe (handy when
  customer support sends the link directly).

Backend: new migration
`supabase/migrations/20260517160000_lookup_order_by_reference_and_email.sql`

- SECURITY DEFINER RPC `lookup_order_by_ref_and_email(ref, email)`.
- Returns ONLY customer-safe fields (status, total, dates) — never phone or
  address.
- Single generic `Order not found` error for any mismatch so the response
  doesn't leak whether the ref or email was wrong (prevents enumeration).
- Both fields case-insensitive + trimmed.
- Granted to `anon` and `authenticated`.

Frontend service: `lookupOrderStatus(ref, email)` in
`src/services/bankTransferPayment.ts` — degrades gracefully when the RPC isn't
deployed yet ("Order lookup is not enabled on this site yet").

## 6. Recent-email-failures banner on Admin Dashboard

`src/pages/AdminDashboard.tsx` — when 1+ rows in `email_logs` have
`status='failed'` in the last 72h, a dismissible warning banner appears between
the page header and the status tabs. Clicks through to `/admin/emails` so the
operator can review and resend. Counts via a new `getRecentEmailFailures()`
helper in `supabaseService.ts`.

Previously, the `sendOrderEmail` failure path was fire-and-forget; if Resend was
down, customers wouldn't receive payment instructions and no one would notice
until they emailed asking. Now an admin opening the dashboard sees a flag.

## 7. Structured reason dropdown for inventory adjustments

`src/pages/AdminInventory.tsx` — new dropdown above the existing notes textarea:

- Initial stock / Restock / Counting correction / Damage / Spoilage / Customer return / Theft or loss / Manual set / Other

Composed note format: `"[restock] PO #1234"` — keeps the existing single
`notes` column on the live RPC unchanged but makes the history grep-able and
filterable later. The dropdown clears alongside the notes after submit.

## 8. Bonus — fixed earlier server-totals migration

While reviewing the audit, I caught my own pass-5 migration referenced wrong
shipping/tax math:
- I had threshold $300 / flat $15; real `shippingPolicy.ts` is $250 / $11.90.
- I had GST 1/11; real default is 0 (prices are tax-inclusive).

Fixed both helpers in
`supabase/migrations/20260517140000_upsert_payment_tracking_server_authoritative_totals.sql`.
Without this fix the server-authoritative totals would have **disagreed** with
what the customer saw — exactly the bug we were trying to prevent.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 58/58 pass |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | succeeds |
| Manual: reload `/admin/dashboard` — filter "Pending" sticks | ✓ |
| Manual: search "bpc" — orders containing BPC-157 surface | ✓ |
| Manual: `/order-status` form renders, pre-fill from `?ref=&email=` works | ✓ |
| Manual: bulk-mark-paid disabled when 0 eligible | ✓ |

## Migration sequence (now 4 to apply)

```
20260517100000_payment_tracking_create_table_parity.sql
20260517120000_order_status_history_and_audit_log.sql
20260517140000_upsert_payment_tracking_server_authoritative_totals.sql
20260517160000_lookup_order_by_reference_and_email.sql
```

`/order-status` works pre-migration but shows an error explaining the page isn't
enabled yet.

## Files added

- `src/hooks/usePersistedState.ts`
- `src/pages/OrderStatus.tsx`
- `supabase/migrations/20260517160000_lookup_order_by_reference_and_email.sql`
- `docs/FIXES_APPLIED_2026-05-17_PASS_6.md` (this file)

## Files modified

- `src/App.tsx` — `/order-status` route + lazy import
- `src/components/layout/Footer.tsx` — "Track order" link
- `src/lib/shippingPolicy.ts` — `PAYMENT_DEADLINE_HOURS`, `paymentDeadlineDate`, `formatPaymentDeadlineLocal`
- `src/pages/AdminDashboard.tsx` — persisted filters + cart-item search + bulk mark-paid + email failure banner
- `src/pages/AdminInventory.tsx` — adjustment reason dropdown
- `src/pages/OrderConfirmation.tsx` — deadline card + "Track order" button
- `src/services/bankTransferPayment.ts` — `lookupOrderStatus()` helper
- `src/services/supabaseService.ts` — `getRecentEmailFailures()` helper
- `supabase/functions/send-order-email/index.ts` — payment deadline in both HTML and text versions
- `supabase/migrations/20260517140000_upsert_payment_tracking_server_authoritative_totals.sql` — fixed shipping/tax helpers to match the real policy

## Still to push from the audit list

Items the audit named but I didn't ship this pass (lower priority / out of session
scope but tracked):

- **#4 idempotency key on order creation** — frontend's `isSubmitting` guard +
  RPC `ON CONFLICT (order_reference)` already covers the common case. A
  dedicated `idempotency_key` column would also catch "same submit, different
  reference" races. Cheap migration.
- **#8 realtime on AdminPaymentTracking + AdminOrderDetail** — Dashboard has it;
  the other two pages still poll once. Port the channel pattern.
- **#11 single source of truth for bank details** — currently hardcoded in
  edge function + several frontend places. A `bank_details` table + admin
  settings page would let the user change BSB/account without a redeploy.
- **#12 dead `protein_store_order_id` column** — leftover from partner-bridge
  era. Cleanup; ~30 lines across `supabaseService.ts` + `AdminCustomers.tsx`.
- **#13 email delivery-failure flag** — partially shipped via #6. Next step:
  expose a "resend instructions" button on the order detail page.
- **#14 timezone-aware deadline** — shipped here. Customer sees local time,
  email uses AEST. ✓
- **#15 idempotency on cancel/refund** — `cancelOrder` already rejects re-cancel
  via "already cancelled" check (pass 4). Button is disabled while submitting.
  The risk surface is small enough that I'd close this out.

Pick the next theme — operator ergonomics deeper (realtime on remaining pages,
dead column cleanup), customer-facing polish (resend instructions button,
custom dispatch ETA per order, etc.), or back to the data model (orders +
order_items promotion). I'll keep going.
