# Two backends — minimal test (no Twilio)

**LAMIN** = this storefront’s Supabase (`secure-checkout-init`).  
**Partner** = payment host Supabase (`create-payment-link` + `/pay/:id`).

---

## 1. What you add on **LAMIN** (this backend)

In **Supabase Dashboard → LAMIN project → Edge Functions → Secrets**:

| Secret | Required for link test? | Notes |
|--------|-------------------------|--------|
| `PAYMENT_LINK_CREATE_URL` | **Yes** | Full URL from partner (see §4). |
| `PAYMENT_LINK_BEARER` | **Yes** | Same string partner checks as `Authorization: Bearer …`. |
| `PAYMENT_LINK_SECRET_HEADER` | Optional | Only if partner also expects `x-payment-link-secret`. |
| `PAYMENT_LINK_CURRENCY` | Optional | Default `USD`; match partner/Square. |
| `ENABLE_CODE_DELIVERY` | No for link-only | Leave **unset** or not `true` until Resend is ready. |
| Resend / Twilio | No for link-only | Add later when you want real email/SMS. |

**Deploy** (when you change function code):  
`npm run functions:deploy` or `npx supabase functions deploy secure-checkout-init --no-verify-jwt`.

**Interpret `npm run e2e:smoke`:**

- `payment_link_created: true` → partner returned `payment_url`.
- `payment_link_created: false` → partner URL wrong, bearer wrong, partner error, or Square not configured on partner.

---

## 2. What you add on **Partner** backend

In **Partner Supabase → Edge Functions → Secrets** (names may match their repo):

| Secret | Purpose |
|--------|---------|
| `PAYMENT_LINK_BEARER` **or** `PAYMENT_LINK_CREATE_SECRET` | Must **equal** LAMIN’s `PAYMENT_LINK_BEARER`. |
| `FRONTEND_URL` | Public origin of pay page, e.g. `https://their-app.vercel.app` or Bolt URL (used to build `payment_url`). |
| `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT` | Needed if `create-payment-link` creates a real Square checkout. |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` | Usually auto-injected; partner function uses DB. |

**Deploy:** `create-payment-link` (and pay route) with **`verify_jwt = false`** if callers use anon/bearer secret (same pattern as LAMIN).

---

## 3. Information **LAMIN needs from the partner** (copy into LAMIN secrets)

Ask them to send:

1. **`create-payment-link` URL**  
   Example: `https://<PARTNER_PROJECT_REF>.supabase.co/functions/v1/create-payment-link`

2. **Shared bearer secret**  
   One long random string. They set it on **their** function; you set the **same** value as LAMIN `PAYMENT_LINK_BEARER`.

3. **Optional:** If their function requires a header, exact name + value (often `x-payment-link-secret`) → LAMIN `PAYMENT_LINK_SECRET_HEADER` + same value in that header (LAMIN already supports this).

4. **Pay page base URL** (where customers open `/pay/<id>`)  
   You don’t put this in LAMIN secrets; they use it as `FRONTEND_URL`. You only need it to **manually open** a link when testing.

5. **Currency** they use (e.g. `USD`) → align `PAYMENT_LINK_CURRENCY` on LAMIN if not USD.

---

## 4. Information **partner needs from LAMIN** (for their logs / support)

Share this contract (full detail: [PARTNER-SQUARE-PAYMENT-LINK.md](./PARTNER-SQUARE-PAYMENT-LINK.md)):

- **Caller:** LAMIN Edge `secure-checkout-init` (server-side `fetch`, not the browser).
- **Method:** `POST`, `Content-Type: application/json`.
- **Headers:**  
  `Authorization: Bearer <same as PAYMENT_LINK_BEARER>`  
  Optional: `x-payment-link-secret` if configured on LAMIN.
- **JSON body (important fields):**  
  `amount`, `code` (6 digits), `reference` (LAMIN order id), `currency`, `expirationMinutes`,  
  `metadata`: includes `source` (default **`lamin`**), plus `customer_email`, `customer_phone`, `enriched_lines` when present.
- **Response they must return:**  
  `{ "payment_url": "https://...", "payment_id": "..." }`  
  (`payment_url` must be a URL the **customer** can open.)

---

## 5. Order of operations

1. Partner deploys `create-payment-link`, sets **bearer** + **FRONTEND_URL** + Square (sandbox OK).  
2. Partner sends you **URL + bearer** (§3).  
3. You set LAMIN **`PAYMENT_LINK_CREATE_URL`** + **`PAYMENT_LINK_BEARER`**.  
4. Run **`npm run e2e:smoke`** → expect **`payment_link_created: true`**.  
5. Open `payment_url` from partner response (or from `checkout_secure_sessions.external_payment_url` in LAMIN DB) and test code entry on `/pay/...`.  
6. Later: **`ENABLE_CODE_DELIVERY=true`** + Resend (and Twilio when you want SMS).

---

## 6. No Twilio

Use **`send_email: true`** only in tests (your `e2e:smoke` already does). Until Resend is configured, **`delivery_enabled`** stays false and no email is sent; you can still verify **payment link** creation with §1–§5.
