# Quick steps (no Resend / no Twilio yet)

## What gets stored each checkout

| Table | What |
|-------|------|
| `order_references` | Order id, totals, customer, catalog + partner line payloads (from browser + your existing flow). |
| `checkout_secure_sessions` | **Same order** `peptide_order_id`, **hashed** 6-digit code, **`grand_total`**, **`totals` JSON**, email/phone/**name**, **`sent_via`** (`email` / `sms` / both), **`delivery_mock`** (`true` until a real SMS/email send succeeds). |

Twilio/Resend code stays in the Edge Function; turn on with **`ENABLE_CODE_DELIVERY=true`** when you’re ready.

## Test the OTP value (optional)

Edge secret **`RETURN_CHECKOUT_OTP_IN_RESPONSE=true`** adds **`_debug_otp`** to the function JSON (dev/staging only; **never production**).

---

## Do this in order

1. **Supabase login** — `npx supabase login`
2. **Link project** — `npx supabase link --project-ref YOUR_REF`
3. **Run SQL migrations** — `npx supabase db push` (or paste both migration files in SQL Editor).
4. **Deploy function** — `npm run functions:deploy`
5. **Do not set** `ENABLE_CODE_DELIVERY` (mock delivery stays on).
6. **App `.env`** — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` set.
7. **Run app** — `npm run dev`, go through checkout, open **Table Editor → `checkout_secure_sessions`** and confirm a new row: price, email/phone, `sent_via`, `delivery_mock = true`, `code_hash` filled.
8. **(Optional)** Set `RETURN_CHECKOUT_OTP_IN_RESPONSE=true` on the function, repeat checkout, inspect the function response in browser DevTools → Network for `_debug_otp` to match hashing tests.

## When you add Twilio later

1. Set Twilio secrets on the function.
2. Set **`ENABLE_CODE_DELIVERY=true`**.
3. Redeploy function.
4. `delivery_mock` becomes `false` when the SMS (or email) send succeeds.

## Copy-paste prompts

- *“Apply `supabase/migrations/20260403120000_checkout_secure_sessions.sql` and `20260404100000_checkout_session_contact_audit.sql` to my Supabase project.”*
- *“Deploy `secure-checkout-init` with JWT verification off; do not set ENABLE_CODE_DELIVERY yet.”*
- *“After I place a test order, query `checkout_secure_sessions` joined on `peptide_order_id` with `order_references` and list grand_total, customer_email, customer_phone, sent_via, delivery_mock.”*
