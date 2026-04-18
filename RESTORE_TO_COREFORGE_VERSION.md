# Restore to CoreForge Payment Integration Version

**Created:** April 18, 2026
**Purpose:** This document provides instructions to restore the Laminin site to the full CoreForge payment integration version after temporarily using the simplified bank transfer flow.

---

## Current Version Information

**Git commit (before simplification):**
```bash
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site
git rev-parse HEAD
# Commit: 5ae39be feat(edge): rate limiting, delivery_mock on insert; secrets docs
```

**Branch:** `main`

---

## What This Version Includes

### CoreForge Payment Integration Features:
1. **Secure checkout with CoreForge payment links**
2. **Embedded payment iframe** (CoreForgeEmbedModal)
3. **Verification code delivery** (SMS/Email via Twilio/Resend)
4. **Partner payment API integration**
5. **Supabase Edge Functions** for secure checkout initialization
6. **Payment tracking and order management**
7. **Admin dashboard** with full order visibility

### Files/Components That Will Be Temporarily Removed:
- `src/components/brand/CoreForgeMark.tsx` - CoreForge branding component
- `src/components/checkout/CoreForgeEmbedModal.tsx` - Payment iframe modal
- `src/pages/Pay.tsx` - CoreForge payment link page
- `src/constants/coreforgePay.ts` - CoreForge configuration
- `src/lib/embedPayPostMessage.ts` - iframe messaging library
- CoreForge references in `src/pages/Checkout.tsx`
- CoreForge references in `src/components/checkout/SecureCheckoutModal.tsx`
- CoreForge references in `src/components/checkout/PaymentForm.tsx`

### Edge Functions (will remain but won't be used):
- `supabase/functions/secure-checkout-init/` - Secure checkout initialization
- `supabase/functions/partner-payment-ready/` - Partner webhook handler
- `supabase/functions/_shared/twilioSms.ts` - SMS delivery

---

## Restore Instructions

### Option 1: Git Restore (Recommended)

If you created a git branch or tag before simplification:

```bash
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site

# View available branches/tags
git branch -a
git tag

# Restore from branch
git checkout coreforge-integration

# OR restore from tag
git checkout tags/coreforge-v1

# OR restore from specific commit
git checkout 5ae39be
```

### Option 2: Restore from Backup Files

If you backed up the modified files (recommended to create this backup now):

```bash
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site

# Create backup directory (DO THIS BEFORE MAKING CHANGES)
mkdir -p .backups/coreforge-version-$(date +%Y%m%d)

# Backup all CoreForge-related files
cp src/components/brand/CoreForgeMark.tsx .backups/coreforge-version-$(date +%Y%m%d)/
cp src/components/checkout/CoreForgeEmbedModal.tsx .backups/coreforge-version-$(date +%Y%m%d)/
cp src/pages/Pay.tsx .backups/coreforge-version-$(date +%Y%m%d)/
cp src/constants/coreforgePay.ts .backups/coreforge-version-$(date +%Y%m%d)/
cp src/lib/embedPayPostMessage.ts .backups/coreforge-version-$(date +%Y%m%d)/
cp src/pages/Checkout.tsx .backups/coreforge-version-$(date +%Y%m%d)/
cp src/components/checkout/SecureCheckoutModal.tsx .backups/coreforge-version-$(date +%Y%m%d)/
cp src/components/checkout/PaymentForm.tsx .backups/coreforge-version-$(date +%Y%m%d)/
cp src/App.tsx .backups/coreforge-version-$(date +%Y%m%d)/

# To restore later, copy files back
cp .backups/coreforge-version-YYYYMMDD/* src/[appropriate-paths]/
```

### Option 3: Revert Specific Commits

After the bank transfer simplification is committed:

```bash
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site

# View recent commits
git log --oneline

# Revert the simplification commits (replace COMMIT_HASH)
git revert COMMIT_HASH

# OR reset to before simplification (DESTRUCTIVE - loses uncommitted work)
git reset --hard 5ae39be
```

---

## Post-Restore Checklist

After restoring to CoreForge version:

### 1. Environment Variables
Ensure these are set in `.env.local`:

```bash
# CoreForge Payment Integration
VITE_COREFORGE_PAY_ORIGIN=https://core-forge.shop
VITE_PROTEIN_STORE_URL=https://core-forge.shop

# Optional: Checkout configuration
VITE_CHECKOUT_SOFT_LAUNCH=false
VITE_OPEN_PAYMENT_URL_ON_THIS_SITE=false
VITE_CHECKOUT_DISPLAY_CURRENCY=AUD
```

### 2. Supabase Edge Function Secrets
Re-verify these secrets are set in Supabase Dashboard → Edge Functions:

```bash
# Required for live checkout
ENABLE_CODE_DELIVERY=true
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_from_number

# Optional for email delivery
RESEND_API_KEY=your_resend_key

# Demo only - remove in production
# RETURN_CHECKOUT_OTP_IN_RESPONSE=true
```

### 3. Database Migrations
Ensure all CoreForge payment-related migrations are applied:

```bash
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site

# Check migration status
npx supabase db diff

# Apply migrations if needed
npx supabase db push
```

### 4. Rebuild and Deploy

```bash
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site

# Install dependencies (if restored from backup)
npm install

# Build
npm run build

# Deploy to Vercel/hosting
vercel --prod
# OR
npm run deploy
```

### 5. Test CoreForge Integration

1. **Test checkout flow:**
   - Add products to cart
   - Proceed to checkout
   - Fill in shipping details
   - Click "Place Order"
   - Verify "CODE SENT" modal appears
   - Check SMS/email delivery
   - Click "Continue to CoreForge payment"
   - Verify payment iframe opens
   - Complete test payment

2. **Test admin dashboard:**
   - Log in to admin
   - View orders
   - Check payment link status
   - Verify order details

---

## Simplified Bank Transfer Features to Remove

When restoring to CoreForge, you'll need to remove these temporary features:

1. **Bank Transfer Popup Component** - Remove/replace with CoreForge modal
2. **Manual Payment Tracking Table** - Can keep for historical records or migrate to CoreForge payment_links
3. **Admin Manual Payment Entry** - Remove/replace with CoreForge admin panel
4. **"Payment Information Clicked" Tracking** - Not needed with CoreForge

---

## Migration Path (Bank Transfer → CoreForge)

If you have historical data from the bank transfer period:

### Export Pending Orders
```sql
-- Export orders that were created during bank transfer period
SELECT * FROM manual_payment_tracking
WHERE created_at BETWEEN '2026-04-18' AND '[end_date]'
  AND payment_status = 'pending';
```

### Migrate to CoreForge Orders
```sql
-- Create corresponding orders in the main orders table
-- (Adjust based on your actual schema)
INSERT INTO orders (
  customer_id,
  order_reference,
  total_amount,
  payment_method,
  status,
  created_at
)
SELECT
  customer_id,
  order_reference,
  total_amount,
  'bank_transfer',
  CASE
    WHEN payment_status = 'completed' THEN 'completed'
    ELSE 'pending'
  END,
  created_at
FROM manual_payment_tracking;
```

---

## Support and Troubleshooting

### Common Issues After Restore:

**1. "CoreForge payment origin not configured"**
- Solution: Set `VITE_COREFORGE_PAY_ORIGIN=https://core-forge.shop` in `.env.local`
- Rebuild: `npm run build`

**2. "Code delivery failing"**
- Solution: Check Supabase Edge Function logs
- Verify Twilio credentials in Supabase secrets
- Test with `RETURN_CHECKOUT_OTP_IN_RESPONSE=true` for demo mode

**3. "Payment iframe not loading"**
- Solution: Check browser console for CSP errors
- Verify `frame-ancestors` in CoreForge pay app allows Laminin domain

**4. Missing CoreForge components after restore**
- Solution: Ensure all files were properly restored
- Run `npm install` to ensure dependencies are installed
- Check file paths match the backup structure

---

## Version Comparison

| Feature | Bank Transfer (Simplified) | CoreForge (Full) |
|---------|---------------------------|------------------|
| Payment Method | Manual bank transfer | Card payments via Square |
| Security | Manual verification | Encrypted, verification codes |
| Automation | Manual admin entry | Automated payment processing |
| Customer Experience | Bank transfer instructions | Instant card payment |
| Order Tracking | Manual admin updates | Automated status updates |
| Fraud Protection | None | Square fraud detection |
| Compliance | Manual | PCI-compliant via Square |
| Admin Workload | High (manual) | Low (automated) |

---

## Notes

- **Keep this document** in the repository root for future reference
- **Update** this document if the CoreForge integration changes
- **Test thoroughly** after restore before deploying to production
- **Backup database** before running any migration queries

---

## Quick Restore Command Summary

```bash
# Navigate to laminin site
cd /Users/nickmitreski/Downloads/protein-main-new/public/laminin-site

# Check current status
git status
git log --oneline -5

# Restore to CoreForge version (choose one method)
git checkout 5ae39be                    # Option 1: Specific commit
git checkout coreforge-integration      # Option 2: Branch
git checkout tags/coreforge-v1          # Option 3: Tag

# Verify restore
git log --oneline -1
git status

# Rebuild
npm install
npm run build

# Test locally
npm run dev

# Deploy
vercel --prod
```

---

**Last Updated:** April 18, 2026
**Maintained By:** Development Team
**Contact:** [Your contact info]
