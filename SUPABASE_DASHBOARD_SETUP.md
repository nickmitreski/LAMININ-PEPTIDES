# Supabase Dashboard Configuration Guide

Step-by-step instructions for configuring secrets in the Supabase Dashboard.

---

## **Access Edge Functions Secrets**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **ytacbvfcltikxzudlkzn**
3. Click **Edge Functions** in the left sidebar
4. Click **Secrets** tab at the top

---

## **Step 1: Set CHECKOUT_INIT_HMAC_SECRET** 🔴 CRITICAL

This secret secures your checkout endpoint from unauthorized access.

### **Generate the Secret**

Open your terminal and run:
```bash
openssl rand -base64 32
```

Copy the output (it will look like: `xK9mP2vL8nQ4rT6wY1zA3bC5dE7fG9hJ0iK2lM4nO6pQ=`)

### **In Supabase Dashboard:**

1. Click **"Add Secret"**
2. **Name**: `CHECKOUT_INIT_HMAC_SECRET`
3. **Value**: Paste the generated secret
4. Click **"Save"**

### **In Your Frontend `.env.local`:**

1. Open `/Users/nickmitreski/Desktop/Lamin/main/.env.local`
2. Add this line (use the SAME secret):
   ```
   VITE_CHECKOUT_INIT_SECRET=xK9mP2vL8nQ4rT6wY1zA3bC5dE7fG9hJ0iK2lM4nO6pQ=
   ```
3. Save the file

---

## **Step 2: Verify TWILIO_MESSAGING_SERVICE_SID is NOT Set** 🟡

This would override your `TWILIO_FROM_NUMBER`.

### **In Supabase Dashboard:**

1. Look through your secrets list
2. **If you see `TWILIO_MESSAGING_SERVICE_SID`**:
   - Click the **trash icon** next to it
   - Confirm deletion
3. **If you DON'T see it**: ✅ Good, skip this step

---

## **Step 3: Set ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK** 🟡

Only needed if you're NOT using payment links yet.

### **In Supabase Dashboard:**

1. Click **"Add Secret"**
2. **Name**: `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK`
3. **Value**: `true`
4. Click **"Save"**

**Note**: Skip this step if you have payment link secrets configured:
- `PAYMENT_LINK_CREATE_URL`
- `PAYMENT_LINK_BEARER`

---

## **Step 4: Remove Unused Secrets** 🟢

These secrets are present but not used by your Edge Functions.

### **In Supabase Dashboard:**

Look for these secrets and **delete** them if present:

1. **`SUPABASE_ANON_KEY`**
   - Click trash icon → Confirm
   - (Your functions use `SUPABASE_SERVICE_ROLE_KEY` instead)

2. **`SUPABASE_DB_URL`**
   - Click trash icon → Confirm
   - (Not needed, using `createClient` with URL + service key)

**Keep these**:
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

---

## **Step 5: Optional - Set Up Resend Email** (If you want email delivery)

Currently SMS-only. To add email:

### **In Supabase Dashboard:**

1. **Get Resend API Key**:
   - Sign up at [resend.com](https://resend.com)
   - Create API key in their dashboard

2. **Add Secrets**:

   **Secret 1**:
   - Name: `RESEND_API_KEY`
   - Value: `re_...` (your Resend API key)

   **Secret 2**:
   - Name: `RESEND_FROM`
   - Value: `orders@yourdomain.com` (must be verified in Resend)

3. Click **"Save"** for each

---

## **Step 6: Optional - Payment Link Configuration**

If you're integrating with a payment provider:

### **In Supabase Dashboard:**

Add these secrets (get values from your payment partner):

1. **`PAYMENT_LINK_CREATE_URL`**
   - Value: `https://your-partner.supabase.co/functions/v1/create-payment-link`

2. **`PAYMENT_LINK_BEARER`**
   - Value: Your shared secret with the payment partner

3. **`PAYMENT_LINK_CURRENCY`** (optional, defaults to AUD)
   - Value: `AUD`

4. **`PAYMENT_LINK_EXPIRATION_MINUTES`** (optional, defaults to 15)
   - Value: `15`

---

## **Verify Your Configuration**

### **View All Secrets**

In Supabase Dashboard → Edge Functions → Secrets, you should see:

#### **Required** ✅
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `ENABLE_CODE_DELIVERY`
- `CHECKOUT_INIT_HMAC_SECRET` ← **NEW**

#### **Recommended** 🟡
- `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK` (if not using payment links)

#### **Optional**
- `RESEND_API_KEY` (if using email)
- `RESEND_FROM` (if using email)
- Payment link secrets (if using payment provider)

#### **Should NOT be present** ❌
- ~~`SUPABASE_ANON_KEY`~~
- ~~`SUPABASE_DB_URL`~~
- ~~`TWILIO_MESSAGING_SERVICE_SID`~~
- ~~`TWILIO_USE_WHATSAPP`~~
- ~~`MOCK_SMS_DELIVERY`~~

---

## **Deploy Updated Edge Functions**

After setting secrets, deploy your Edge Functions:

```bash
cd /Users/nickmitreski/Desktop/Lamin/main
npx supabase functions deploy secure-checkout-init --no-verify-jwt
npx supabase functions deploy partner-payment-ready --no-verify-jwt
```

---

## **Test Your Setup**

Once secrets are configured:

1. **Restart your dev server** (to load new `.env.local`):
   ```bash
   npm run dev
   ```

2. **Run Step 6 from your previous instructions**:
   - Go to your live site
   - Put your real mobile in checkout
   - Finish the secure step
   - Check your phone for SMS

---

## **Troubleshooting**

### **Error: "Unauthorized"**
- Check `CHECKOUT_INIT_HMAC_SECRET` is set in Supabase
- Check `VITE_CHECKOUT_INIT_SECRET` matches in `.env.local`
- Restart dev server after changing `.env.local`

### **Error: "Could not create payment link"**
- Either set payment link secrets OR
- Set `ALLOW_CODE_DELIVERY_WITHOUT_PAYMENT_LINK=true`

### **SMS not received**
- Check `ENABLE_CODE_DELIVERY=true`
- Check `TWILIO_FROM_NUMBER` is set correctly
- Check `TWILIO_MESSAGING_SERVICE_SID` is NOT set
- Check Twilio account has credit

### **Rate limit errors (429)**
- Default: 10 checkouts per 5 minutes per IP
- Wait 5 minutes or use different network/IP
- For testing: temporarily disable rate limiting in code

---

**Need Help?** Check `SECRETS_CHECKLIST.md` for full reference.
