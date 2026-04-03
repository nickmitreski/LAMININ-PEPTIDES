# Partner site — before GitHub + Bolt

Use this for the **payment / protein store** repo (Supabase + frontend on Bolt), not LAMIN.

## 1. Repo hygiene

- Add **`.env` / `.env.local`** to `.gitignore` if not already.
- **Never commit** `SQUARE_ACCESS_TOKEN`, `PAYMENT_LINK_*`, service role keys, or database passwords.
- Commit **migrations** under `supabase/migrations/` only (no production secrets in SQL).

## 2. Supabase (partner project) — database

- Run migrations against the **remote** DB:  
  `npx supabase link` (if needed) → **`npx supabase db push`**
- Confirm **`payment_links`** exists, **`external_reference`**, **`get_payment_link_public`**, and RLS matches your repo (admin policies if you use an admin UI).

## 3. Supabase — Edge Functions

Deploy the functions your app actually calls, for example:

```bash
npx supabase functions deploy create-payment-link verify-payment-code process-payment-link --no-verify-jwt
# plus square-webhook, square-payment, etc. if your repo uses them
```

## 4. Supabase — Edge secrets (Dashboard or `supabase secrets set`)

| Secret | Why |
|--------|-----|
| `PAYMENT_LINK_BEARER` or `PAYMENT_LINK_CREATE_SECRET` | **Same value** LAMIN puts in `PAYMENT_LINK_BEARER`. |
| `FRONTEND_URL` | **Public** origin where **`/pay/<id>`** is served — after Bolt deploy, use your Bolt URL (e.g. `https://your-app.bolt.host` or custom domain). Wrong URL → broken links in SMS/email from **LAMIN**. |
| `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT` | Sandbox first (`sandbox`), then production. |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | If you use Square webhooks. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually **auto-provided** to functions.

## 5. LAMIN must point here (after deploy)

On **LAMIN’s** Supabase Edge secrets:

- `PAYMENT_LINK_CREATE_URL` =  
  `https://<PARTNER_PROJECT_REF>.supabase.co/functions/v1/create-payment-link`
- `PAYMENT_LINK_BEARER` = same string as §4.

No change to LAMIN until this URL is live and tested.

## 6. GitHub

- Create/use a repo, push code (no secrets).
- Optional: branch protection, Actions for lint/typecheck later.

## 7. Bolt (frontend)

Bolt hosts the **Vite/React (or similar) app** — same idea as Vercel:

1. Connect the **GitHub** repo to Bolt (or upload; follow Bolt’s flow).
2. Set **build** to match your repo (`npm run build`, output `dist` or whatever your `package.json` uses).
3. Add **environment variables** for the **browser** only, e.g.:
   - `VITE_SUPABASE_URL` (partner project)
   - `VITE_SUPABASE_ANON_KEY` (or publishable key)
   - Any `VITE_SQUARE_*` if the pay page uses Web Payments SDK in the client
4. **Supabase Auth** (if used): **Authentication → URL configuration** → Site URL + redirect URLs = your **Bolt** production (and preview) URLs.
5. After first successful deploy, copy the **production URL** and set **`FRONTEND_URL`** on the partner Edge Function (§4) so `create-payment-link` returns correct `payment_url`.

## 8. Smoke test before you rely on LAMIN

1. Call **`create-payment-link`** with curl (bearer + body from [PARTNER-SQUARE-PAYMENT-LINK.md](./PARTNER-SQUARE-PAYMENT-LINK.md)).
2. Open returned **`payment_url`** in the browser → code field → Square sandbox card (if configured).
3. Then run **`npm run e2e:smoke`** on **LAMIN** and confirm **`payment_link_created: true`**.

## 9. Order of operations (recommended)

1. Partner: `db push` → set secrets → deploy functions → **note** `create-payment-link` URL + bearer.  
2. Partner: deploy **Bolt** → set **`FRONTEND_URL`** to that live origin → redeploy or rely on next invoke.  
3. LAMIN: set `PAYMENT_LINK_*` → test smoke / checkout.  
4. Optional: custom domains on Bolt + update `FRONTEND_URL` + Supabase Auth URLs.

---

**You do not have to use Bolt** if the partner app is already hosted elsewhere; any **stable HTTPS** origin for `/pay/:id` is fine — `FRONTEND_URL` must match it.
