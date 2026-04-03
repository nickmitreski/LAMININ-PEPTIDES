# End-to-end test: LAMIN checkout → partner link → email/SMS

**Minimal two-project setup (no Twilio, optional email):** [TWO-BACKENDS-CHECKLIST.md](./TWO-BACKENDS-CHECKLIST.md)

## Important: where code runs

| Piece | Runs on |
|--------|---------|
| LAMIN Vite app (`npm run dev`) | Your laptop |
| LAMIN Edge Function `secure-checkout-init` | **Supabase cloud** (your LAMIN project) |
| Partner Edge Function `create-payment-link` | **Supabase cloud** (partner project) |

So **`PAYMENT_LINK_CREATE_URL`** on LAMIN must be a **public HTTPS** URL, e.g.  
`https://<PARTNER_REF>.supabase.co/functions/v1/create-payment-link`.

It **cannot** be `http://localhost:…` or your LAN IP — the LAMIN Edge Function has no route to your machine.

**Ways to test locally:**

1. **Recommended:** Deploy **both** projects’ functions to Supabase; point LAMIN secrets at the **deployed** partner URL. Run only the **browsers** (LAMIN + partner) on localhost.
2. **Partner function only on localhost:** Use a tunnel (e.g. ngrok) so `PAYMENT_LINK_CREATE_URL` is an `https://….ngrok.io/...` URL that forwards to local `supabase functions serve`.
3. **Skip partner link temporarily:** On LAMIN Edge, leave **`PAYMENT_LINK_CREATE_URL` unset** (or set **`ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK=true`**) to test Resend/Twilio **without** creating a payment link (messages won’t include the pay URL).

---

## A) Full test through the UI (real order row + real checkout)

1. Partner: deploy `create-payment-link` (and pay page) with secrets (`PAYMENT_LINK_BEARER`, Square, `FRONTEND_URL`, etc.).
2. LAMIN: set Edge secrets — `PAYMENT_LINK_CREATE_URL`, matching **`PAYMENT_LINK_BEARER`**, `ENABLE_CODE_DELIVERY`, Resend/Twilio, etc.
3. `npm run dev` on LAMIN → checkout with a real email/phone → complete the secure modal.
4. Check inbox/SMS for **link + code + reference**; open the link on the **partner** origin (from the message).

---

## B) API smoke test (one command from your machine)

From repo root (after `npx supabase login` and `supabase link` to your LAMIN project, and `.env.local` with `VITE_SUPABASE_URL` + key):

```bash
npm run e2e:smoke
```

This runs **`supabase db query --linked -f scripts/seed-smoke-order.sql`**, then **`scripts/smoke-secure-checkout.sh`**.

**Manual variant:** run **`scripts/seed-smoke-order.sql`** in the SQL Editor, then **`npm run smoke:secure-checkout`**.

**Interpret JSON:**
   - **`ok: true`** + **`sent_email: true`** (or SMS) → delivery path works.
   - **`payment_link_created: true`** → partner URL responded with `payment_url`.
   - **`502`** / **`ok: false`** about payment link → partner URL, bearer, or Square setup on **partner** project.

---

## C) What we already verified

A curl without a matching `order_references` row returns **`{"ok":false,"error":"Could not create session"}`** (FK). That confirms the function is reachable; it does **not** test email or the partner bridge.
