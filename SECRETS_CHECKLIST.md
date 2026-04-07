# Supabase Secrets Configuration Checklist

This document tracks which secrets are required, optional, and where they should be configured.

---

## **Supabase Edge Functions Secrets**

Configure these in: **Supabase Dashboard → Edge Functions → Secrets**

### **Required Secrets**

#### **Database Connection**
- [x] `SUPABASE_URL` - Your Supabase project URL
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)

#### **Twilio SMS**
- [x] `TWILIO_ACCOUNT_SID` - Twilio account identifier
- [x] `TWILIO_AUTH_TOKEN` - Twilio authentication token
- [x] `TWILIO_FROM_NUMBER` - SMS from number (e.g., +61468034071)
- [x] `ENABLE_CODE_DELIVERY` - Set to `true` to send real SMS

#### **Security**
- [ ] `CHECKOUT_INIT_HMAC_SECRET` - **CRITICAL**: Shared secret for checkout requests
  - **Status**: ⚠️ NEEDS TO BE SET
  - **Generate**: `openssl rand -base64 32`
  - **Must match**: `VITE_CHECKOUT_INIT_SECRET` in `.env.local`

---

### **Optional Secrets**

#### **Email Delivery (Resend)**
- [ ] `RESEND_API_KEY` - Resend API key for email delivery
- [ ] `RESEND_FROM` - From email address (e.g., `orders@yourdomain.com`)
  - **Status**: Not configured (SMS-only mode)
  - **Set these if you want email + SMS delivery**

#### **Payment Link Integration**
- [ ] `PAYMENT_LINK_CREATE_URL` - Partner payment link creation endpoint
- [ ] `PAYMENT_LINK_BEARER` - Bearer token for partner API
- [ ] `PAYMENT_LINK_CURRENCY` - Currency code (default: AUD)
- [ ] `PAYMENT_LINK_EXPIRATION_MINUTES` - Link expiration (default: 15)
- [ ] `PAYMENT_LINK_SECRET_HEADER` - Optional extra auth header
- [ ] `PAYMENT_LINK_METADATA_SOURCE` - Source identifier (default: lamin)
- [ ] `PAYMENT_LINK_OMIT_URL_FROM_CLIENT` - Hide URL from browser (default: false)
- [ ] `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK` - Allow SMS without link
  - **Status**: ⚠️ SET TO `true` IF NOT USING PAYMENT LINKS

#### **COREFORGE Async Flow**
- [ ] `ASYNC_COREFORGE_PAYMENT_FLOW` - Enable async payment flow (default: false)
- [ ] `COREFORGE_INGEST_URL` - COREFORGE ingest endpoint
- [ ] `COREFORGE_INGEST_BEARER` - Bearer token for COREFORGE
- [ ] `PARTNER_PAYMENT_READY_SECRET` - Webhook auth secret

#### **Partner Notifications**
- [ ] `PAYMENT_LINK_PARTNER_NOTIFY_URL` - Partner notification endpoint
- [ ] `PAYMENT_LINK_PARTNER_NOTIFY_SECRET` - Partner notification auth
- [ ] `PARTNER_PAYMENT_NOTIFY_URL` - Legacy partner notify endpoint
- [ ] `PARTNER_PAYMENT_NOTIFY_SECRET` - Legacy partner auth

#### **Checkout Branding**
- [ ] `CHECKOUT_DELIVERY_BRAND` - Brand name in SMS/email (default: LAMININ)

#### **Development/Testing**
- [ ] `MOCK_SMS_DELIVERY` - Set to `true` to log SMS instead of sending
  - **Status**: Not set (real SMS mode)
- [ ] `RETURN_CHECKOUT_OTP_IN_RESPONSE` - Expose OTP in API response (dev only)

---

### **Secrets to REMOVE** ❌

These are present but not used by Edge Functions:

- [ ] `SUPABASE_ANON_KEY` - Not needed (functions use service role)
- [ ] `SUPABASE_DB_URL` - Not needed (using createClient with URL + service key)
- [ ] `TWILIO_MESSAGING_SERVICE_SID` - ⚠️ Verify this is NOT set (conflicts with FROM number)
- [ ] `TWILIO_USE_WHATSAPP` - Should be removed (you're using SMS now)

---

## **Frontend Environment Variables**

Configure these in: **`.env.local`** (gitignored)

### **Required**
- [x] `VITE_SUPABASE_URL` - Supabase project URL
- [x] `VITE_SUPABASE_ANON_KEY` - Publishable/anon key
- [x] `VITE_APP_URL` - Application URL (localhost or production)

### **Optional**
- [ ] `VITE_CHECKOUT_INIT_SECRET` - Must match `CHECKOUT_INIT_HMAC_SECRET` in Edge secrets
- [ ] `VITE_CHECKOUT_SOFT_LAUNCH` - Enable soft launch mode
- [ ] `VITE_DEV_MOCK_SECURE_CHECKOUT` - Mock checkout in dev
- [ ] `VITE_CHECKOUT_DELIVERY_BRAND` - Brand name (default: LAMININ)
- [ ] `VITE_CHECKOUT_DISPLAY_CURRENCY` - Display currency (default: AUD)
- [ ] `VITE_CHECKOUT_GST_RATE` - GST rate (default: 0.1)
- [ ] `VITE_OPEN_PAYMENT_URL_ON_THIS_SITE` - Open payment URL in storefront
- [ ] `VITE_PROTEIN_STORE_URL` - Partner protein store URL
- [ ] `VITE_PROTEIN_STORE_API_KEY` - Partner API key

---

## **Vercel Environment Variables**

If deploying frontend to Vercel, configure in: **Vercel Dashboard → Settings → Environment Variables**

Copy all `VITE_*` variables from `.env.local` to Vercel for production builds.

---

## **Quick Setup Commands**

### Generate a secure random secret:
```bash
openssl rand -base64 32
```

### Set Edge Function secret via Supabase CLI:
```bash
npx supabase secrets set CHECKOUT_INIT_HMAC_SECRET="your_secret_here"
```

### View all Edge Function secrets:
```bash
npx supabase secrets list
```

### Deploy Edge Functions:
```bash
npx supabase functions deploy secure-checkout-init --no-verify-jwt
npx supabase functions deploy partner-payment-ready --no-verify-jwt
```

---

## **Priority Actions**

### 🔴 Critical (Do Before Testing)
1. Set `CHECKOUT_INIT_HMAC_SECRET` in Edge Functions secrets
2. Set matching `VITE_CHECKOUT_INIT_SECRET` in `.env.local`
3. Verify `TWILIO_MESSAGING_SERVICE_SID` is NOT set
4. Set `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK=true` if not using payment links

### 🟡 Important (Do This Week)
1. Remove unused secrets: `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL` from Edge Functions
2. Document payment link configuration (if using)
3. Set up Resend email delivery (if using)

### 🟢 Nice to Have (Do This Month)
1. Set `CHECKOUT_DELIVERY_BRAND` for custom branding
2. Configure partner payment notifications
3. Set up monitoring for rate limit hits

---

## **Verification Checklist**

Before running Step 6 (SMS test):

- [ ] `ENABLE_CODE_DELIVERY=true` (confirmed ✅)
- [ ] `TWILIO_FROM_NUMBER` set to +61468034071 (confirmed ✅)
- [ ] `CHECKOUT_INIT_HMAC_SECRET` set in Edge Functions
- [ ] `VITE_CHECKOUT_INIT_SECRET` matches in `.env.local`
- [ ] `TWILIO_USE_WHATSAPP` removed/not set (confirmed ✅)
- [ ] `MOCK_SMS_DELIVERY` removed/not set (confirmed ✅)
- [ ] Payment link config complete OR `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK=true`

---

**Last Updated**: 2026-04-07
