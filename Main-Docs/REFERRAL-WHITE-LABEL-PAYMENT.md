# Referral / white-label payment (no extra “webhook” from Lamin)

## What affiliates and shoppers see

- **Shoppers on the storefront** only talk to **your Lamin Supabase** (`functions.invoke` + anon key). Their browser does **not** call the payment-link project.
- **Creating the link** is **one server-to-server POST** from Lamin’s Edge Function to **your** `create-payment-link` URL, using **your** bearer secret. That is a normal **API** call (same as any REST client), not a browser “webhook”.
- There is **no requirement** for `PAYMENT_LINK_PARTNER_NOTIFY_URL` on Lamin. Skip it if your payment app opens the UI from **Realtime or polling** on **your** database.

## Hiding the upstream storefront name

1. **Edge secrets (Lamin)**  
   - `PAYMENT_LINK_METADATA_SOURCE` — e.g. `payment` or an opaque campaign id (default in code: neutral).  
   - `PAYMENT_LINK_OMIT_URL_FROM_CLIENT=true` — payment URL never sent to the shopper’s browser from Lamin.

2. **Vite env (Lamin storefront)**  
   - `VITE_CHECKOUT_BRAND_NAME` — replaces visible “CoreForge” / generic payment wording.  
   - `VITE_CHECKOUT_PARTNER_LABEL` — label for “payment provider” style copy.

3. **No LLM API** is required for any of this.

## Secrets checklist

| Where | Secret | Role |
|-------|--------|------|
| Lamin Edge | `PAYMENT_LINK_CREATE_URL`, `PAYMENT_LINK_BEARER` | Call **your** create-payment-link API |
| Lamin Edge | Optional `PAYMENT_LINK_SECRET_HEADER` | If your API uses `x-payment-link-secret` |
| Lamin Edge | Optional `CHECKOUT_INIT_HMAC_SECRET` + `VITE_CHECKOUT_INIT_SECRET` | Lock down who can call `secure-checkout-init` |
| **Your** payment project | Your function’s own secret (e.g. `PAYMENT_LINK_CREATE_SECRET`) | Validates incoming creates |

## Partner SQL (Realtime, no second call from Lamin)

See **`supabase/snippets/PARTNER_PROJECT_payment_links_realtime.sql`** — run on the **payment** Supabase project, not Lamin.
