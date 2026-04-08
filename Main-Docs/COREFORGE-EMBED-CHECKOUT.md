# CoreForge embedded checkout (LAMIN + iframe)

LAMIN and CoreForge stay **separate Supabase projects**. LAMIN’s Edge Function **`secure-checkout-init`** calls CoreForge’s **`create-payment-link`** with a shared bearer; CoreForge returns **`payment_url`** and **`payment_id`**.

## LAMIN Edge (secrets)

| Secret | Purpose |
|--------|---------|
| `PAYMENT_LINK_CREATE_URL` | CoreForge `create-payment-link` HTTPS URL |
| `PAYMENT_LINK_BEARER` | Same bearer CoreForge validates |
| `PAYMENT_LINK_EMBED` | Set `true` → JSON body includes `"embed": true` so CoreForge returns an embed URL (`https://<COREFORGE_HOST>/embed/pay/<payment_id>`) |
| `COREFORGE_SMS_PAYMENT_LINK_MODE` | `parent` = SMS/email use `https://<LAMIN>/pay?pid=<id>&ref=<order>` (customer stays on Lamin in the address bar). `direct` = put full CoreForge `payment_url` in SMS/email |
| `LAMIN_PUBLIC_SITE_URL` | Required for `parent` mode (no trailing slash), e.g. `https://laminin-peptides.vercel.app` |
| `COREFORGE_PAYMENTS_DISCLOSURE_SMS` / `…_EMAIL` | Optional; default text states payment is processed through CoreForge Payments |

Twilio stays on LAMIN; messages include **code**, **reference**, **amount**, **link**, and disclosure.

## LAMIN storefront (Vite)

| Env | Purpose |
|-----|---------|
| `VITE_COREFORGE_PAY_ORIGIN` | CoreForge pay app origin only, **https**, e.g. `https://pay.coreforge.com`. Used for `iframe.src` and **strict** `postMessage` origin checks |

Route **`/pay?pid=…&ref=…`** opens a full-screen modal with:

- `iframe.src = ${VITE_COREFORGE_PAY_ORIGIN}/embed/pay/${pid}`
- After load: if `event.origin === VITE_COREFORGE_PAY_ORIGIN` and `data.type === 'COREFORGE_EMBED_READY'`, parent sends `{ type: 'COREFORGE_EMBED_INIT' }` to the iframe
- `COREFORGE_EMBED_HEIGHT` → resize iframe height (capped at 90vh)
- `COREFORGE_PAYMENT_SUCCESS` → close modal, thank-you / navigate to order confirmation
- `COREFORGE_PAYMENT_ERROR` with `reason === 'dismiss'` → close modal

Checkout **Continue** after a successful embed session navigates to `/pay?pid=…` when `coreforge_embed_checkout` is true in the Edge response (and `VITE_COREFORGE_PAY_ORIGIN` is set).

## CoreForge (their repo)

- Accept POST body field **`embed: true`** and return `payment_url` under `/embed/pay/:id` plus **`payment_id`** (required for Lamin `/pay?pid=`).
- **`VITE_EMBED_PARENT_ORIGINS`** (or equivalent) must include the Lamin storefront origin.
- CSP / **`frame-ancestors`** for `/embed/*` must allow the Lamin origin or the iframe will be blocked.

## Deploy

```bash
npx supabase functions deploy secure-checkout-init --no-verify-jwt
```

Redeploy the Vite app whenever `VITE_COREFORGE_PAY_ORIGIN` changes.
