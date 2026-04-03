# System overview (main storefront)

## What this app does

- **Product catalog** (`src/`) with cart → **checkout** collects shipping/contact, builds a **bridge payload** (each cart line maps to a CFG code, display name, and partner **protein-store** line for fulfilment).
- **Persistence:** `order_references` + `customers` in Supabase (`src/services/supabaseService.ts`, `createOrderReferenceRecord` in `proteinCheckout.ts`). A copy is also kept in **localStorage** for resilience.
- **Partner checkout:** `completeProteinCheckoutRedirect` POSTs to `{VITE_PROTEIN_STORE_URL}/api/peptide-bridge/checkout` when configured, then redirects the browser (bridge path name is historical).

## Secure code flow (new)

1. Customer must provide **at least one** of: valid **email** or **mobile** (≥10 digits with area code).
2. Customer checks the **CoreForge / AES-256** acknowledgment; submit stays disabled until checked.
3. On submit, a **modal** runs an “encryption session” style loader while:
   - `buildCheckoutPayload` + `createOrderReferenceRecord` save the order.
   - `initiateSecureCheckoutSession` invokes Supabase Edge Function **`secure-checkout-init`**, which stores a **hashed** 6-digit code, calls the partner **`create-payment-link`** URL, then sends **Resend** / **Twilio** with **link + code + reference + amount**. Optional **`PARTNER_PAYMENT_NOTIFY_URL`** receives a server POST with **enriched_lines** (catalog line detail).
4. Modal confirms where the code was sent; **Continue** runs `completeProteinCheckoutRedirect` and navigates with `secure_code_sent=1` when applicable.

## Key files

| Area | Path |
|------|------|
| Checkout page | `src/pages/Checkout.tsx` |
| Payment UI + checkbox | `src/components/checkout/PaymentForm.tsx` |
| Secure modal | `src/components/checkout/SecureCheckoutModal.tsx` |
| Contact rules | `src/lib/checkoutContactValidation.ts` |
| Bridge + redirect | `src/services/proteinCheckout.ts` |
| Edge invoke | `src/services/secureCheckoutSession.ts` |
| Order confirmation copy | `src/pages/OrderConfirmation.tsx` |
| Edge Function | `supabase/functions/secure-checkout-init/index.ts` |
| DB table | `supabase/migrations/20260403120000_checkout_secure_sessions.sql` |

## Environment variables

**Frontend (Vite)**

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — required for Edge invoke.
- `VITE_PROTEIN_STORE_URL`, `VITE_PROTEIN_STORE_API_KEY`, `VITE_CHECKOUT_SOFT_LAUNCH` — partner bridge (existing).
- `VITE_CHECKOUT_INIT_SECRET` — optional; must match Edge secret `CHECKOUT_INIT_HMAC_SECRET` if set.
- `VITE_DEV_MOCK_SECURE_CHECKOUT=true` — **dev only**; skips Edge invoke (no real SMS/email).

**Edge Function secrets (Supabase Dashboard → Functions → Secrets)**

- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` (often auto-injected).
- **`ENABLE_CODE_DELIVERY`** — set to `true` only when you want to send codes. If unset or not `true`, **Resend/Twilio are not called**; the session row is still created and the app uses `secure_session=1` on the confirmation URL.
- When delivery is on: `RESEND_API_KEY`, `RESEND_FROM`; `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and either `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_NUMBER`.
- `PARTNER_PAYMENT_NOTIFY_URL`, `PARTNER_PAYMENT_NOTIFY_SECRET` (optional legacy webhook).
- **External pay page (other Supabase project):** `PAYMENT_LINK_CREATE_URL`, `PAYMENT_LINK_BEARER`, optional `PAYMENT_LINK_SECRET_HEADER`, `PAYMENT_LINK_CURRENCY`, `PAYMENT_LINK_EXPIRATION_MINUTES`. **`PAYMENT_LINK_PARTNER_NOTIFY_URL`** (+ optional `PAYMENT_LINK_PARTNER_NOTIFY_SECRET`): server POST with `payment_url` so the **partner** opens checkout/popup on **their** origin. **`PAYMENT_LINK_OMIT_URL_FROM_CLIENT=true`**: do not send `payment_url` to the browser (only to partner notify + DB). Frontend: **`VITE_OPEN_PAYMENT_URL_ON_THIS_SITE`** — only if `true` does this storefront redirect to `payment_portal_url` (default off).
- `CHECKOUT_INIT_HMAC_SECRET` (optional, pairs with `VITE_CHECKOUT_INIT_SECRET`).

**CLI (this repo)**

- Dev dependency: `supabase` — run `npm run supabase -- --version`, `npm run functions:serve`, `npm run functions:deploy`.
- **Cursor / VS Code:** install the recommended **Supabase** extension (`.vscode/extensions.json`); this is separate from the npm CLI.

## APIs and LLMs

- **Required for this feature:** **Resend** (email), **Twilio** (SMS), **Supabase** (DB + Edge Functions). **No OpenAI or other LLM** is required for checkout, codes, or encryption messaging; copy is static UI text.
- Optional LLM use elsewhere (e.g. marketing copy) is unrelated to this payment path.

## Mobile / UX notes

Checkout uses **≥16px** inputs, **44px+** tap targets on the primary button, **safe-area** on the modal (`pb-safe`), and respects **reduced motion** on spinners where noted in shared styles.

## Wording note (encryption)

Customer-facing text describes **TLS (HTTPS)** and industry-standard protection for payment handoff. Exact cipher suites (e.g. AES-256-GCM) depend on the browser and CoreForge/partner servers; adjust copy with legal if you need stricter claims.

## Related apps

- `public/protein-main/` is a **separate** CoreForge-style storefront with its own Supabase `orders` flow; it does not automatically use this Edge Function unless you wire it.
