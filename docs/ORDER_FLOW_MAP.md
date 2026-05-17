# Order Flow Map

End-to-end trace of a customer placing an order, with file:line citations.

## 1. Customer journey (high level)

```
ProductPage → Cart → Checkout → createPaymentTracking (RPC) → payment_tracking row
                                       ↓
                                upsert_checkout_customer (RPC) → customers row
                                       ↓
                                markPaymentInstructionsViewed (RPC, fire-and-forget)
                                       ↓
                                sendOrderEmail (edge fn, fire-and-forget)
                                       ↓
                                OrderConfirmation page (cart cleared)
                                       ↓
                       (Customer pays out-of-band via bank transfer)
                                       ↓
                       Admin marks payment_received in AdminPaymentTracking
                                       ↓
                       notify-payment-received edge fn
```

## 2. File-by-file flow

### Product discovery & cart
- `src/pages/Home.tsx`, `src/pages/ProductPage.tsx` — product list & detail.
- `src/context/CartContext.tsx` — cart state, localStorage persistence, shape `CartItem { peptideId, name, price, quantity, image, variantId?, purity? }`.

### Checkout submit
- `src/pages/Checkout.tsx`
  - Contact validation: `src/lib/checkoutContactValidation.ts`
  - Shipping policy / totals: `src/lib/shippingPolicy.ts`
  - Discount apply: RPC `redeem_discount_code` (Checkout.tsx ~190)
  - **Order persist (THE write):** `createPaymentTracking(...)` at line 213
  - Customer upsert: RPC `upsert_checkout_customer` at line 250
  - Email: `sendOrderEmail` (services/emailService.ts) at line 274
  - Cart cleared, navigate to OrderConfirmation.

### Persistence layer
- `src/services/bankTransferPayment.ts:34` — `createPaymentTracking`, calls RPC `upsert_payment_tracking`. Single source of truth for the live write path.
- `src/services/proteinCheckout.ts:80` — `createOrderReferenceRecord` writes `order_references` table. **DEAD CODE on the active checkout flow** — Checkout.tsx no longer calls it. Still exported and used by tests.
- `src/services/supabaseService.ts` — admin read helpers (`getAllOrders`, `paymentRowToOrder`, etc.).

### Supabase RPCs (defined in migrations)
- `upsert_payment_tracking(p_order_reference, p_customer_email, ..., p_cart_items, ...)` — `migrations/20260410000000_payment_tracking_fixes.sql`
- `upsert_checkout_customer(p_email, p_first_name, ...)` — migrations/20260401000000 + 20260402
- `mark_payment_instructions_viewed(p_order_reference)` — migrations/20260410 area
- `get_payment_tracking_by_reference(p_order_reference)` — migrations/20260410 area
- `redeem_discount_code(...)` — migrations/20260408_discount_codes.sql
- `jwt_is_admin()` — migrations/20260405_jwt_is_admin_robust.sql

### Edge Functions (`supabase/functions/`)
- `secure-checkout-init` — pre-checkout session bootstrap (CSRF-style)
- `send-order-email` — sends customer email with bank-transfer instructions
- `notify-payment-received` — fires when admin marks paid; SMS + email
- `partner-payment-ready` — partner-bridge SMS (legacy flow)
- `twilio-status-callback` — webhook for SMS delivery status
- `chat` — unrelated, AI assistant
- `send-contact-message` — contact form

### Admin reads
- `src/pages/AdminDashboard.tsx:26` → `getAllOrders(...)` from supabaseService.
- `src/pages/AdminPaymentTracking.tsx:59-66` → direct `from('payment_tracking').select('*')`.
- `src/components/admin/OrderDetailsModal.tsx` — modal that renders one order's full detail (this is where the bug surfaces).

## 3. Two parallel order shapes (the trap)

| Concern | order_references (legacy / dead on active flow) | payment_tracking (live) |
|---|---|---|
| Defined in | `migrations/20260401000000_initial_customers_and_orders.sql:33` + schema.sql | Only ALTERed; CREATE TABLE lives only on live project |
| Items column | `peptide_items` JSONB | `cart_items` JSONB |
| Item shape | `{cfg_code, peptide_display_name, variant_id, quantity, unit_price, line_total}` | `{id, name, price, quantity, image}` |
| Customer address | flat columns (`customer_address`, `customer_city`, ...) | nested JSON `customer_address.{address,city,state,postcode,country}` |
| Order id | `peptide_order_id` | `order_reference` |
| Total | `total_price` | `total_amount` |
| Status | `status` | `payment_status` |
| Written by | `createOrderReferenceRecord` (NOT CALLED from Checkout.tsx) | `createPaymentTracking` (CALLED from Checkout.tsx) |
| Read by | nothing live | AdminDashboard + AdminPaymentTracking |

`paymentRowToOrder` (supabaseService.ts:115) attempts to flatten payment_tracking into the order_references shape so existing admin UI works — but the items mapping at line 134 just renames the property without transforming the item shape. **That is the bug.**

## 4. Trust boundaries

- Client → Supabase RPC: cart line items, prices, totals are all client-supplied. No server-side recomputation today. (`upsert_payment_tracking` accepts client values verbatim.) See SECURITY_RLS_AUDIT.md.
- Client → Edge Functions: `secure-checkout-init` exists but does not gate `upsert_payment_tracking`. The RPC is callable by anon role with insert RLS allowing it.
- Email send: fire-and-forget; admin notification depends on edge fn + Twilio.

## 5. Where to look if items disappear in admin

| Symptom | Most likely cause | File |
|---|---|---|
| Name/price/code all "—", qty present | `paymentRowToOrder` shape transform missing (CURRENT BUG) | `services/supabaseService.ts:134` |
| All items missing entirely | RLS blocking SELECT, or `cart_items` actually null | check `payment_tracking` row in DB; verify `jwt_is_admin()` |
| Some items missing | `normalizeCartItems` (supabaseService.ts:73) drops malformed entries | check item passed validation |
| "No items" + 0 total | Checkout failed before RPC; cart was empty; or RPC errored | Checkout.tsx:241 throws; check logs |
