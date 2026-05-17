# Security & RLS Audit

## Scope

Defensive audit of the checkout / order / admin surface for a customer-facing ecommerce site backed by Supabase.

## Keys & env

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — public, correct (anon key only).
- Service role key — **NOT** referenced anywhere in `src/`. ✓
- `VITE_PROTEIN_STORE_API_KEY` — flagged in `proteinCheckout.ts:241` as "treat as publishable only". For a true partner secret, this must move to an edge function. Today's flow does not redirect to a partner store on the active path (Checkout uses bank transfer), so the exposure surface is minor.
- `.env.local` is gitignored. `.env.example` looks safe to commit.

## Trust boundary findings

### CRITICAL — Client-supplied totals

`createPaymentTracking` (services/bankTransferPayment.ts) passes `subtotal`, `shipping`, `tax`, `totalAmount`, `discountAmount`, and `cartItems[].price` straight from the browser to the RPC `upsert_payment_tracking`. No server-side recompute. A user with devtools can:

- Change unit prices to 1¢ before submit.
- Set `totalAmount` to whatever they like.
- Apply a discount client-side without the RPC validating that the discount is real.

Mitigation today: `redeem_discount_code` RPC is called separately and SHOULD validate the discount server-side (review needed) — but it doesn't re-validate the cart total.

**Recommended**:
- Make `upsert_payment_tracking` recompute totals server-side from `cart_items[*].id`+`quantity` joined against `product_mappings` (price column) and the validated discount.
- Reject the call if `client_total != server_total` (or just trust server only).
- Better: do this in an Edge Function (`secure-checkout-init` already exists) and have only that function insert into `payment_tracking` via service role.

### HIGH — RPC callable by anon

`upsert_payment_tracking` must be callable by anon (guest checkout). If it's `SECURITY DEFINER` (it must be — RLS would otherwise block insert), make sure:
- `search_path` is locked (recent migrations seem to handle this — confirm in 20260403000000_security_linter_hardening.sql).
- It validates inputs (lengths, types, currency whitelist, max cart size, max line quantity).
- It enforces the existing `payment_status='pending'` guard on update (not just the client check at bankTransferPayment.ts:50).

### HIGH — No idempotency / replay protection

A user double-clicking submit, or a flaky network retrying, can create duplicate `payment_tracking` rows. The client guard at `bankTransferPayment.ts:44-55` reads-then-writes; that's racy. The RPC should accept an idempotency key (or use `order_reference` UNIQUE + ON CONFLICT DO NOTHING semantics) and the client should generate it once per submit attempt.

### MEDIUM — `customers` table allows anon UPDATE

Migration 20260407 enables anon updates on `customers` for the upsert RPC flow. This is acceptable if the RPC is the only path, but the RLS policy should narrow to "the row whose email matches the JWT-asserted email" or be moved fully behind a SECURITY DEFINER RPC with no direct table grant.

### MEDIUM — Admin claim mechanism

`jwt_is_admin()` (migration 20260405) reads a custom claim. Verify in the live project:
- Where is the claim set? (Supabase Hook? Manual user_metadata edit?)
- Can a user self-set it? (Must not — should be `app_metadata`, not `user_metadata`.)
- Is there a way to enumerate or assign? Document it.

### MEDIUM — `OrderDetailsModal` displays customer PII

Not a vulnerability per se, but: phone, full address, email, line items. Admin role only via RLS, but worth noting that any compromised admin account exposes order history. Mitigations: audit log on view; rate-limit admin API; require recent re-auth for sensitive views.

### LOW — Frontend security assumptions

- Order total displayed to customer is the source of truth for the email and admin. If the email service trusts the client total, refund/dispute work could anchor to a manipulated value. Recompute server-side and send the recomputed value in the email.
- `secure-checkout-init` edge function exists but is not enforced on the bank-transfer path. Confirm its actual call site (in Checkout.tsx I see no call). If unused on the live path, remove or wire up.

### LOW — Webhook verification

`twilio-status-callback` should verify Twilio signature (`X-Twilio-Signature`). Audit the function. Same for any future payment webhook.

## RLS posture per table

| Table | Read | Insert | Update | Delete | Notes |
|---|---|---|---|---|---|
| `payment_tracking` | admin | admin (RLS) + via RPC (definer) | admin | admin | Migration 20260409 |
| `order_references` | admin | admin | admin | admin | Legacy table |
| `customers` | admin | admin + RPC | anon allowed (20260407) for upsert | admin | Narrow further; see above |
| `discount_codes` | admin | admin | admin | admin | Redeem via SECURITY DEFINER RPC |
| `products` | public read | admin | admin | admin | |
| `product_mappings` | public read | admin | admin | admin | |
| `partner_pay_links` | admin | admin | admin | admin | |
| `checkout_sessions` | session-scoped | RPC / definer | RPC | n/a | |

**Action**: snapshot the RLS policies on the live DB and add them to a migration if they have drifted from what's in `migrations/`.

## Specific code checks

| Risk | File | Status |
|---|---|---|
| Cart total tampering | `Checkout.tsx:213-239` | **Vulnerable** — client-supplied |
| Quantity tampering (negative qty) | Cart context | Confirm clamp (>=1); RPC should reject <1 |
| Price tampering | Checkout.tsx → RPC | **Vulnerable** — see above |
| Order status tampering | Status updates via `updateOrderStatus` (services/supabaseService.ts:260) require admin JWT | OK at the RLS layer |
| CSRF | SPA + anon RPC — Supabase JWT bearer model, low CSRF surface | OK |
| XSS in admin notes / customer-supplied fields | Modal renders text in `<Text>` components — React escapes by default | OK provided no `dangerouslySetInnerHTML` (verified none in admin modal) |
| SQL injection | All via Supabase JS / RPC — parameterised | OK |
| Open redirect | `proteinCheckout.ts` redirect to `VITE_PROTEIN_STORE_URL` — host fixed at build time | OK |

## Summary remediation order

1. **Server-side recompute of totals** in `upsert_payment_tracking` (or move write into an edge function). This is the single most important hardening.
2. **Idempotency key** on order creation.
3. **Add CREATE TABLE migration for `payment_tracking`** so RLS posture can be reviewed end-to-end.
4. **Confirm `app_metadata.is_admin` claim** is the admin gate, not `user_metadata`.
5. Lock down `customers` anon UPDATE further or move behind a definer RPC.
6. Verify `twilio-status-callback` signature check.
7. Add admin audit log for status changes and order views.
