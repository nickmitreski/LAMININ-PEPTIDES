# Deployment Checklist - Laminin

Step-by-step checklist for deploying changes to production.

---

## 1. Push to GitHub

Commit and push your changes to the `main` branch:

```bash
git add .
git commit -m "your commit message"
git push origin main
```

---

## 2. Frontend (Vercel)

Vercel auto-deploys on every push to `main`. No manual action needed.

- Verify the build succeeds in the Vercel dashboard.
- If this is the first deploy, import the repo at https://vercel.com/new with framework preset **Vite**.
- Ensure all `VITE_*` environment variables are set in **Vercel Dashboard > Settings > Environment Variables**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_URL` (set to your production URL)

---

## 3. Database Migrations (Supabase)

Apply any new migrations:

```bash
npx supabase db push
```

Or run the SQL directly in **Supabase Dashboard > SQL Editor**.

- [ ] Verify new tables/columns exist after migration.
- [ ] Confirm RLS policies are in place.

---

## 4. Edge Functions (Supabase)

Deploy updated Edge Functions:

```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

Deploy all functions if unsure which changed:

```bash
npx supabase functions deploy --no-verify-jwt
```

- [ ] Verify all required secrets are set in **Supabase Dashboard > Edge Functions > Secrets** (see `SECRETS_CHECKLIST.md`).

---

## 5. Secrets

All Edge Function secrets are managed in **Supabase Dashboard > Edge Functions > Secrets**.

Alternatively, use the CLI:

```bash
npx supabase secrets set KEY="value"
npx supabase secrets list
```

Required secrets for production (see `SECRETS_CHECKLIST.md` for full details):
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`
- `RESEND_API_KEY`, `RESEND_FROM`
- `ENABLE_CODE_DELIVERY` (set to `true`)
- `MOCK_SMS_DELIVERY` should NOT be set to `true` in production

---

## 6. Post-Deploy Verification

- [ ] **Admin dashboard loads:** Visit `/admin/login`, sign in, confirm `/admin/dashboard` shows orders.
- [ ] **Products page works:** Visit `/admin/products`, verify product list loads and CRUD operations function.
- [ ] **Storefront loads:** Visit the production URL, browse products, verify images load.
- [ ] **Checkout flow:** Complete a test checkout. Confirm a `payment_tracking` record is created in Supabase.
- [ ] **SMS delivery:** Mark a test order as "paid" in the admin dashboard. Verify the customer receives an SMS (or check logs if `MOCK_SMS_DELIVERY=true`).
- [ ] **Discount codes:** Create a test discount code in `/admin/discounts` and verify it applies at checkout.
- [ ] **No console errors:** Open browser DevTools on key pages and check for JavaScript errors.

---

## Troubleshooting

**Vercel build fails:**
- Check the build log in the Vercel dashboard.
- Run `npm run build` locally to reproduce.
- Ensure all `VITE_*` env vars are set in Vercel.

**Edge Function errors:**
- Check logs in **Supabase Dashboard > Edge Functions > Logs**.
- Verify secrets are set correctly.
- Re-deploy the function.

**Database migration issues:**
- Check the SQL Editor output for errors.
- Verify you are connected to the correct Supabase project.

**SMS not sending:**
- Confirm `ENABLE_CODE_DELIVERY=true` and `MOCK_SMS_DELIVERY` is not `true`.
- Verify Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`).

---

**Last Updated:** May 2026
