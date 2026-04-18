# Partner Supabase: `create-payment-link` (Square + verification code)

**Audience:** the **partner** project (payment host), not LAMIN’s database.

LAMIN’s Edge Function **`secure-checkout-init`** calls your HTTPS endpoint **before** LAMIN sends Resend/Twilio. Your function returns **`payment_url`** (often `https://<partner-app>/pay/<payment_id>`) and **`payment_id`**. **LAMIN** then emails/texts the customer that **same link**, plus the **6-digit code** and **order reference** — your project does **not** send mail/SMS back to LAMIN; you only create the link and enforce the code on the pay page.

The same **6-digit `code`** and **`reference`** (LAMIN’s order id, see below) must be enforced on your pay page so only someone with the message can pay.

## Contract (incoming POST from LAMIN)

**Headers**

- `Authorization: Bearer <PAYMENT_LINK_BEARER>` (same value as LAMIN’s Edge secret)
- Optional: `x-payment-link-secret: <shared header>` if you set `PAYMENT_LINK_SECRET_HEADER` on LAMIN

**Body (JSON)**

| Field | Type | Meaning |
|--------|------|--------|
| `amount` | number | Total to charge (e.g. `123.45`) |
| `code` | string | Plain 6-digit OTP (store hashed on your side or store as HMAC secret for the Square `note` / internal row) |
| `reference` | string | LAMIN **order id** (same value as JSON field `peptide_order_id` on LAMIN’s checkout payload) — show on pay UI; store in `external_reference` / Square `reference_id` |
| `currency` | string | ISO code, e.g. `USD` |
| `expirationMinutes` | number | Align Square link / page expiry if supported |
| `metadata` | object | Include **`"source": "lamin"`** if your function requires it for strict validation. Also: `customer_first_name`, `customer_last_name`, `customer_email`, `customer_phone`, `enriched_lines` (optional). LAMIN defaults `metadata.source` to **`lamin`** unless `PAYMENT_LINK_METADATA_SOURCE` overrides. |

**Response (JSON)** — required shape for LAMIN:

```json
{
  "payment_url": "https://square.link/... or https://pay.square.com/...",
  "payment_id": "optional_square_or_internal_id"
}
```

If creation fails, return **4xx/5xx** and a JSON `error` string. LAMIN will **not** send email/SMS when `ENABLE_CODE_DELIVERY=true` and payment link creation fails (unless `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK=true` on LAMIN for staging).

---

## Prompt you can paste into your partner project (Cursor / spec)

Use this verbatim to implement the partner Edge Function.

> Implement a Supabase Edge Function `create-payment-link` deployed with `verify_jwt = false`, protected by `Authorization: Bearer <secret>` from env `PAYMENT_LINK_CREATE_SECRET` (compare to the bearer token LAMIN sends).
>
> **POST body:** `amount` (number), `code` (string, 6 digits), `reference` (string), `currency` (string), `expirationMinutes` (number), `metadata` (object).
>
> 1. Validate bearer and body; reject if `amount` ≤ 0 or `code` not 6 digits.
> 2. Use Square API (Server SDK or REST) with env `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`. Create a **payment link** or **checkout** for `amount` in `currency`. Set Square’s `reference_id` or `note` to `reference` and store `code` only server-side: insert a row in `public.payment_links` with columns `id`, `reference`, `code_plain` or `code_hash`, `square_order_id` / `payment_link_id`, `amount`, `currency`, `expires_at`, `created_at`.
> 3. Return JSON `{ "payment_url": "<absolute https URL>", "payment_id": "<id>" }`.
> 4. The hosted page at `payment_url` must display **reference**, **amount**, and a field **“Verification code”**; on submit, POST to a second Edge Function `verify-payment-code` that compares the body code to the stored row for that `reference` (or payment id), then completes or shows Square card form. Do not expose the correct code in the HTML/JS bundle.
> 5. Log errors without logging full `code` in production.

Adjust table/column names to your schema; the important part is **URL + server-side code check** before charging.

---

## Square notes

- **Payment Links API** (or **Web Payments SDK** on your own page): create a link or page for the fixed `amount`.
- Put **`reference`** in Square metadata / `reference_id` so dashboards reconcile with LAMIN’s order id.
- **Idempotency**: if LAMIN retries, use `reference` as idempotency key or return the same `payment_url` if a non-expired row exists.

---

## Partner SQL (starter)

Run on the **partner** project (adapt types/names):

```sql
create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  code_hash text not null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  square_payment_link_id text,
  payment_url text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_links_reference on public.payment_links (reference);

alter table public.payment_links enable row level security;
-- No policies for anon: only service_role / Edge Functions touch this table.
```

Hash the 6-digit code with SHA-256 (same as LAMIN stores in `checkout_secure_sessions.code_hash`) if you want to verify without storing plaintext; then LAMIN’s `code` in the POST is plaintext for Square flow display only on your server after HTTPS receive.

---

## LAMIN secrets (reminder)

| Secret | Role |
|--------|------|
| `PAYMENT_LINK_CREATE_URL` | Full URL to this `create-payment-link` function |
| `PAYMENT_LINK_BEARER` | Must match partner’s expected bearer |
| `PAYMENT_LINK_SECRET_HEADER` | Optional extra header |
| `CHECKOUT_DELIVERY_BRAND` | Text in email/SMS, default `LAMININ` |
| `ENABLE_CODE_DELIVERY` | `true` to send Resend/Twilio |
| `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK` | `true` only for staging without Square |
| `PAYMENT_LINK_METADATA_SOURCE` | Optional; default on LAMIN is **`lamin`** (sent inside `metadata.source` for partner strict mode) |

Frontend: set `VITE_CHECKOUT_DELIVERY_BRAND` to match `CHECKOUT_DELIVERY_BRAND`, and `VITE_CHECKOUT_DISPLAY_CURRENCY` to match `PAYMENT_LINK_CURRENCY`.

**LAMIN schema checks:** use [LAMIN-SUPABASE-VERIFY-STEPS.md](./LAMIN-SUPABASE-VERIFY-STEPS.md) on the LAMIN Supabase project (not the partner project).
