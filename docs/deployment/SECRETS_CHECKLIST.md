# Secrets and Environment Variables Checklist

All secrets and environment variables required for the Laminin platform.

---

## Supabase Edge Function Secrets

Configure in: **Supabase Dashboard > Edge Functions > Secrets**

| Secret | Description | Example / Notes |
|--------|-------------|-----------------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | Starts with `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service SID | Starts with `MG...` |
| `RESEND_API_KEY` | Resend email API key | For transactional email delivery |
| `RESEND_FROM` | Sender email address | e.g. `orders@yourdomain.com` |
| `CHECKOUT_DELIVERY_BRAND` | Brand name used in SMS messages | Default: `Laminin` |
| `MOCK_SMS_DELIVERY` | Log SMS instead of sending | Set to `true` for testing only |
| `ENABLE_CODE_DELIVERY` | Enable checkout code delivery via SMS | Set to `true` to activate |

### Setting secrets via CLI

```bash
# Set a single secret
npx supabase secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"

# View all configured secrets
npx supabase secrets list
```

Or set them in: **Supabase Dashboard > Edge Functions > Secrets**

---

## Vite Environment Variables (.env.local)

Configure in: **`.env.local`** (gitignored) for local development, or **Vercel Dashboard > Settings > Environment Variables** for production.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key | `eyJhbGciOi...` |
| `VITE_APP_URL` | Application URL | `http://localhost:5173` (dev) or production URL |

All frontend environment variables must be prefixed with `VITE_` to be available in the Vite build.

---

## No Longer Needed

These variables have been removed and should NOT be set:

| Variable | Reason |
|----------|--------|
| `VITE_ADMIN_EMAIL_ALLOWLIST` | Removed. Admin access is controlled exclusively via Supabase `app_metadata.admin = true`. |
| `VITE_CHECKOUT_GST_RATE` | No longer used. Tax has been removed; defaults to 0. |
| `CHECKOUT_INIT_HMAC_SECRET` | CoreForge integration removed. |
| `VITE_CHECKOUT_INIT_SECRET` | CoreForge integration removed. |
| `PAYMENT_LINK_CREATE_URL` | CoreForge integration removed. |
| `PAYMENT_LINK_BEARER` | CoreForge integration removed. |
| `PAYMENT_LINK_EMBED` | CoreForge integration removed. |
| `COREFORGE_SMS_PAYMENT_LINK_MODE` | CoreForge integration removed. |
| `COREFORGE_INGEST_URL` | CoreForge integration removed. |
| `COREFORGE_INGEST_BEARER` | CoreForge integration removed. |
| `ASYNC_COREFORGE_PAYMENT_FLOW` | CoreForge integration removed. |
| `PARTNER_PAYMENT_READY_SECRET` | CoreForge integration removed. |
| All other `COREFORGE_*` / `PAYMENT_LINK_*` / `PARTNER_*` secrets | CoreForge integration removed. |
| `TWILIO_FROM_NUMBER` | Replaced by `TWILIO_MESSAGING_SERVICE_SID`. |
| `TWILIO_USE_WHATSAPP` | WhatsApp flow removed. |
| `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK` | CoreForge integration removed; no longer applicable. |

If any of these are still set in your Edge Function Secrets, remove them to avoid confusion.

---

**Last Updated:** May 2026
