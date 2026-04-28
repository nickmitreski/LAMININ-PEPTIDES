# Secure checkout — step-by-step (copy-paste prompts)

Do these **in order**. Each block is a prompt you can give to an engineer or AI to execute one slice of work.

---

## Step 1 — Apply database migration

**Prompt:**  
“Apply the SQL migration `supabase/migrations/20260403120000_checkout_secure_sessions.sql` to my Supabase project (CLI `supabase db push` or paste into SQL Editor). Confirm table `checkout_secure_sessions` exists and FK to `order_references` (order id column) is valid.”

**SQL file (authoritative):** `../supabase/migrations/20260403120000_checkout_secure_sessions.sql`

---

## Step 2 — Deploy without email/SMS (default)

**Prompt:**  
“Deploy `secure-checkout-init` **without** setting `ENABLE_CODE_DELIVERY`. Confirm checkout creates `checkout_secure_sessions` rows and the UI shows ‘Secure session ready’; order confirmation should use `secure_session=1`.”

---

## Step 3 — Configure Resend (optional, when ready)

**Prompt:**  
“Set Edge secret `ENABLE_CODE_DELIVERY=true`, then set up Resend: verify domain, API key `RESEND_API_KEY`, verified sender `RESEND_FROM`. Test an email send.”

---

## Step 4 — Configure Twilio SMS (optional, when ready)

**Prompt:**  
“With `ENABLE_CODE_DELIVERY=true`, add Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_NUMBER`. Test SMS.”

---

## Step 5 — Deploy Edge Function `secure-checkout-init`

**Prompt:**  
“Deploy `supabase/functions/secure-checkout-init` (`npm run functions:deploy` or `npx supabase functions deploy secure-checkout-init`). `verify_jwt` is off in `supabase/config.toml`. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set. Invoke with a JSON body matching `src/services/secureCheckoutSession.ts`; confirm a row in `checkout_secure_sessions`.”

---

## Step 6 — Optional shared secret header

**Prompt:**  
“Set `CHECKOUT_INIT_HMAC_SECRET` on the Edge Function and the same value in the Vite env as `VITE_CHECKOUT_INIT_SECRET` so only our frontend can call the function.”

---

## Step 7 — Partner payment webhook

**Prompt:**  
“Implement an HTTPS endpoint at `PARTNER_PAYMENT_NOTIFY_URL` that accepts POST JSON: `peptide_order_id` (order id), `code`, `expires_at`, `grand_total`, `customer`, `enriched_lines`, `peptide_items`, `protein_items`, `totals`. Return `{ \"payment_url\": \"https://...\" }` for the customer. Store the code server-side hashed; do not log the plaintext code. Authenticate with `Authorization: Bearer PARTNER_PAYMENT_NOTIFY_SECRET`.”

---

## Step 8 — Wire payment portal redirect (optional)

**Prompt:**  
“Ensure the partner webhook returns `{ \"payment_url\": \"https://...\" }` so the Edge Function stores `external_payment_url` and returns `payment_portal_url` to the app. The checkout page already sends the browser there on **Continue** when that field is an `http(s)` URL; otherwise it falls back to the protein bridge redirect.”

---

## Step 9 — Local dev without Edge Function

**Prompt:**  
“In `.env.local` set `VITE_DEV_MOCK_SECURE_CHECKOUT=true` so checkout UI can be tested without deploying the Edge Function. Remove before production.”

---

## Step 10 — QA checklist

**Prompt:**  
“Run through: (1) email-only checkout, (2) SMS-only, (3) both, (4) invalid email with empty phone should fail, (5) checkbox unchecked cannot submit, (6) order confirmation shows CoreForge code copy when `secure_code_sent=1`, (7) partner bridge still POSTs once on Continue.”

---

## Step 11 — Tests

**Prompt:**  
“Run `npm test` (Vitest) and fix any failures; add tests for Edge Function with Deno test or integration tests if desired.”

---

## Full inline SQL (duplicate of migration)

If you need a single paste for Supabase SQL Editor, use the contents of:

`supabase/migrations/20260403120000_checkout_secure_sessions.sql`

Do not duplicate schema in multiple places long-term; treat the migration file as the source of truth.
