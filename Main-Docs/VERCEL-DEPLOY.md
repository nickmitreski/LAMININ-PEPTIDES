# Deploy LAMIN to GitHub + Vercel

The **storefront** runs on Vercel. **Supabase** (database + Edge Functions) stays on Supabase — you only point the Vite app at your project URL and keys.

## 1. GitHub

1. Create a repo and push this project (do **not** commit `.env.local`; it is gitignored).
2. Optional: add branch protection on `main` after first deploy.

## 2. Vercel

1. [vercel.com](https://vercel.com) → **Add New…** → **Project** → import the GitHub repo.
2. **Framework preset:** Vite (auto-detected).
3. **Build command:** `npm run build` (default).  
   **Output directory:** `dist` (default for Vite).
4. **Root directory:** repo root (unless the app lives in a subfolder).

`vercel.json` in this repo already **rewrites** client routes to `index.html` for React Router.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

Add at least (Production; repeat Preview if you use preview deployments):

| Name | Notes |
|------|--------|
| `VITE_SUPABASE_URL` | Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Anon or **publishable** key (`sb_publishable_…`) |
| `VITE_APP_URL` | Your live site, e.g. `https://your-app.vercel.app` (used for redirects/links where the app reads it) |

Copy other `VITE_*` values from `.env.example` / `.env.local` as you enable features:

- Checkout: `VITE_CHECKOUT_*`, `VITE_CHECKOUT_DELIVERY_BRAND`, `VITE_CHECKOUT_DISPLAY_CURRENCY`
- Partner bridge: `VITE_PROTEIN_STORE_URL`, `VITE_PROTEIN_STORE_API_KEY` when used
- Optional: `VITE_OPEN_PAYMENT_URL_ON_THIS_SITE`, `VITE_CHECKOUT_INIT_SECRET` (must match Edge secret if set)

After changing env vars, **redeploy** (Deployments → … → Redeploy) so Vite bakes new values into the build.

## 4. Supabase (same project as local)

1. **Authentication → URL configuration**  
   - **Site URL:** `https://your-app.vercel.app` (production).  
   - **Redirect URLs:** add the same URL and any preview URLs (`https://*.vercel.app` if you accept all previews, or list specific preview URLs).

2. **Edge Functions**  
   Still configured in the **Supabase** dashboard (`secure-checkout-init`, secrets). Vercel does **not** host them.

3. **Partner payment**  
   `PAYMENT_LINK_CREATE_URL` must remain a **public HTTPS** URL (partner’s deployed `create-payment-link`). No change because the frontend moved to Vercel.

## 5. Smoke-check after deploy

1. Open production URL → browse, cart, checkout (if configured).
2. Admin: `/admin/login` if you use Supabase Auth + allowlist.
3. Run **`npm run e2e:smoke`** from your laptop anytime; it hits **Supabase**, not Vercel.

## 6. Common issues

| Symptom | Check |
|---------|--------|
| 404 on refresh for `/checkout` etc. | `vercel.json` rewrites; redeploy. |
| Supabase “Invalid API key” / CORS | URL and key in Vercel env; correct project. |
| Auth redirect wrong domain | Supabase **Site URL** + **Redirect URLs**. |
| Checkout works locally, not on Vercel | Missing `VITE_*` in Vercel or stale build — redeploy. |
