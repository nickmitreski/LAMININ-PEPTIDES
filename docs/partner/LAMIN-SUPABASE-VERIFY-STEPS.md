# LAMIN Supabase — verify schema (one query at a time)

Use this on **LAMIN’s** Supabase project only (the storefront that runs `secure-checkout-init`).  
**Do not** run partner `payment_links` / `get_payment_link_public` SQL here unless both apps share one database (unusual).

## How messaging works (two projects)

1. Customer checks out on **LAMIN**.
2. LAMIN’s Edge Function **`secure-checkout-init`** creates `checkout_secure_sessions`, generates the **6-digit code**, **`POST`s** to the partner **`PAYMENT_LINK_CREATE_URL`**, and receives **`payment_url`** + **`payment_id`**.
3. **LAMIN** then sends **Resend / Twilio** to the customer with the **link, code, reference, and amount**. The partner project does **not** send that email/SMS; it only creates the link and enforces the code on `/pay/:id`.

---

## Step 1 — `checkout_secure_sessions` columns

In **Supabase → SQL → New query**, clear the editor, paste **only** the block below, then **Run**.

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'checkout_secure_sessions'
ORDER BY ordinal_position;
```

**Expected:** A row per column (`id`, `peptide_order_id`, `code_hash`, `grand_total`, `external_payment_url`, …).  
Reply with that result (or any error text). **Step 2** is in this file after you confirm Step 1.

---

## Step 2 — Foreign key to `order_references`

Run **only** this (after Step 1 looks correct):

```sql
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'checkout_secure_sessions';
```

**Expected:** A row showing `peptide_order_id` → `order_references` (`peptide_order_id` or your actual FK column).

---

## Step 3 — RLS policies on `checkout_secure_sessions`

```sql
SELECT pol.polname AS policy_name,
       pol.polcmd AS command
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'checkout_secure_sessions'
ORDER BY pol.polname;
```

(`command`: `r` = SELECT, `a` = INSERT, `w` = UPDATE, `d` = DELETE.)  
**Often:** no rows — RLS on with **no** policies for `anon`/`authenticated` is OK if only **service role** (Edge Functions) writes this table.

---

## Step 4 — Confirm expected column names exist

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'checkout_secure_sessions'
  AND column_name IN (
    'id',
    'peptide_order_id',
    'code_hash',
    'expires_at',
    'grand_total',
    'currency',
    'external_payment_url',
    'delivery_mock',
    'sent_via'
)
ORDER BY column_name;
```

**Expected:** nine rows (one per name). If any are missing, run **`supabase db push`** from this repo or apply the matching migration SQL from `supabase/migrations/`.

---

## Sync with repo

When you can, from this repo run **`supabase db push`** so remote migration history matches `supabase/migrations/`. The queries above are **read-only checks**; they do not replace migrations.
