# COREFORGE payment site ↔ LAMIN (async SMS + pay link)

This repo can hand checkout to your **secure payment site** (COREFORGE), then receive a **signed webhook** with the **payment page URL** and **verification code** (option B). LAMIN verifies the code against the stored hash, saves the URL, and sends **SMS** (or **mocks** SMS for testing).

**Security:** Never commit Twilio Account SID / Auth Token or webhook secrets. If they appear in chat or screenshots, **rotate** the Auth Token in Twilio Console.

---

## What was added in LAMIN

| Piece | Purpose |
|--------|--------|
| `supabase/functions/secure-checkout-init/index.ts` | If `ASYNC_COREFORGE_PAYMENT_FLOW=true` and ingest URL is set, POSTs order payload to COREFORGE and **returns immediately** (no SMS here). |
| `supabase/functions/partner-payment-ready/index.ts` | COREFORGE calls this with `payment_url` + `verification_code`; LAMIN verifies hash, updates DB, sends SMS (or mock). |
| `supabase/functions/_shared/twilioSms.ts` | Shared Twilio SMS helper; respects `MOCK_SMS_DELIVERY`. |
| `supabase/migrations/20260406120000_partner_pay_link_sms_tracking.sql` | `partner_pay_link_sms_sent_at` for idempotency. |

Deploy:

```bash
npx supabase db push
npx supabase functions deploy secure-checkout-init --no-verify-jwt
npx supabase functions deploy partner-payment-ready --no-verify-jwt
```

---

## Edge secrets (LAMIN Supabase project)

| Secret | When |
|--------|------|
| `ASYNC_COREFORGE_PAYMENT_FLOW` | `true` to use ingest + webhook flow. |
| `COREFORGE_INGEST_URL` | HTTPS URL of COREFORGE **ingest** Edge Function. |
| `COREFORGE_INGEST_BEARER` | Bearer token COREFORGE checks on ingest. |
| `PARTNER_PAYMENT_READY_SECRET` | Bearer token LAMIN checks on `partner-payment-ready`. |
| `MOCK_SMS_DELIVERY` | `true` = log SMS body only, **no Twilio** (use for tests). |
| `CHECKOUT_DELIVERY_BRAND` | Shown in SMS text (e.g. `LAMININ`). |
| Twilio vars | Only needed when `MOCK_SMS_DELIVERY` is not `true`. |

Webhook URL to give COREFORGE:

`https://<LAMIN_PROJECT_REF>.supabase.co/functions/v1/partner-payment-ready`

---

## Test without real SMS

1. Set `MOCK_SMS_DELIVERY=true` on LAMIN Edge secrets.
2. Run checkout from the storefront (or invoke `secure-checkout-init` with a real `peptide_order_id` that exists in `order_references`).
3. COREFORGE (or `curl`) calls `partner-payment-ready` with the correct `verification_code` from the ingest payload.
4. Check **Supabase → Edge Functions → Logs** for `[MOCK_SMS_DELIVERY]` and the full SMS body.

Example `curl` (replace placeholders):

```bash
curl -sS -X POST \
  'https://YOUR_LAMIN_REF.supabase.co/functions/v1/partner-payment-ready' \
  -H 'Authorization: Bearer YOUR_PARTNER_PAYMENT_READY_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "peptide_order_id": "YOUR_ORDER_REF",
    "payment_url": "https://pay.example.com/checkout/SESSION_ID",
    "verification_code": "123456",
    "payment_id": "optional-square-or-internal-id"
  }'
```

You need the **same** `verification_code` COREFORGE received on **ingest** (LAMIN does not store plaintext in the DB).

---

## Copy-paste prompt for Cursor on the **payment (COREFORGE)** project

Use this as a single message to start implementation there:

---

**Prompt for COREFORGE repo**

We integrate with LAMIN storefront (separate Supabase + Vite app). Implement two server-side pieces only (no public anon writes to sensitive tables).

### 1) Ingest Edge Function (e.g. `lamin-checkout-ingest`)

- **Method:** POST, HTTPS only.
- **Auth:** `Authorization: Bearer <COREFORGE_INGEST_BEARER>` (same value LAMIN sets as `COREFORGE_INGEST_BEARER`).
- **JSON body from LAMIN:**

```json
{
  "peptide_order_id": "string (order reference, stable id)",
  "verification_code": "string (6 digits)",
  "grand_total": 199.9,
  "currency": "AUD",
  "expires_at": "ISO-8601",
  "customer": {
    "first_name": "string|null",
    "last_name": "string|null",
    "email": "string|null",
    "phone": "string|null"
  },
  "enriched_lines": []
}
```

- **Persist** in your DB (your schema): at minimum `peptide_order_id`, `verification_code` (store hashed if you prefer, but you must still echo the **plain** code back in webhook B below), `grand_total`, `currency`, `expires_at`, customer fields, `created_at`. This row is the source of truth for your hosted pay page.
- **Response:** `200` JSON `{ "ok": true }` or `{ "ok": true, "checkout_session_id": "..." }` if you need an id. On auth failure return `401`, on validation `400`.

### 2) After pay page URL exists — webhook to LAMIN

- **URL:** `https://<LAMIN_REF>.supabase.co/functions/v1/partner-payment-ready`
- **Auth:** `Authorization: Bearer <PARTNER_PAYMENT_READY_SECRET>` (same as LAMIN Edge secret).
- **POST JSON:**

```json
{
  "peptide_order_id": "same as ingest",
  "payment_url": "https://your-domain/... (must be https://)",
  "verification_code": "same plain code from ingest (option B)",
  "payment_id": "optional internal id"
}
```

- Call this **once** when the hosted checkout URL is ready. LAMIN will verify the code, attach the URL to the session, and SMS the customer (unless LAMIN has `MOCK_SMS_DELIVERY=true`).

### 3) Your payment UI

- Page at `payment_url` must show **customer name**, **peptide_order_id**, **grand_total**, and require **verification_code** before starting Square checkout.
- **Square webhooks** stay on this project only. LAMIN does not receive Square events.
- After successful payment, delete or invalidate the stored verification code in **your** DB.

### 4) Local / staging testing

- Point LAMIN `COREFORGE_INGEST_URL` at your deployed ingest function.
- Use LAMIN `MOCK_SMS_DELIVERY=true` so no real SMS until Twilio is live.
- Use a real `peptide_order_id` from LAMIN’s `order_references` when testing end-to-end.

Return to LAMIN project with: **ingest URL**, **sample successful ingest response**, and **confirmation webhook** payload shape you used so we can align logs.

---

## WhatsApp vs SMS (Twilio)

Set Edge secrets:

- `TWILIO_USE_WHATSAPP` = `true`
- `TWILIO_FROM_NUMBER` = `whatsapp:+14155238886` (sandbox number from Twilio; include `whatsapp:`)
- Leave **`TWILIO_MESSAGING_SERVICE_SID` unset** for sandbox WhatsApp (MG… is rejected when WhatsApp mode is on).

**Auth:** Use **Account SID** + **Auth Token** from Twilio **Account → API keys & tokens**. Do **not** use OAuth **Client secret** for Basic auth on `Messages.json`.

**Freeform body:** Twilio only accepts a normal `Body` in the **24-hour user-initiated session** after the customer has messaged the sandbox. For a **cold** business-initiated message, use an **approved template** (ContentSid) in Console or extend the Edge helper later.

**If you pasted OAuth client secret anywhere public:** rotate it in Twilio immediately.

---

## What to paste back to LAMIN / Cursor here

After COREFORGE implements ingest + webhook caller, send:

1. **Public URL** of the ingest function (no bearer in message).
2. **Example** redacted request/response (no real customer PII).
3. **Confirmation** that webhook B is calling `partner-payment-ready` with `https://` URLs only.
4. Any **error strings** your API returns so LAMIN can show better toasts later.
