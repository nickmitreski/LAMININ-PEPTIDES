# CoreForge Features Temporarily Removed

**Date Removed:** April 18, 2026
**Reason:** Temporary simplification to bank transfer payment method
**Restore Path:** See `RESTORE_TO_COREFORGE_VERSION.md`

---

## Components Removed/Modified

### 1. **CoreForgeMark Component**
- **File:** `src/components/brand/CoreForgeMark.tsx`
- **Purpose:** CoreForge branding wordmark for checkout
- **Status:** Will be commented out/removed from imports
- **Used In:**
  - `src/pages/Checkout.tsx` (line 705)
  - `src/components/layout/Header.tsx` (if present)

### 2. **CoreForgeEmbedModal Component**
- **File:** `src/components/checkout/CoreForgeEmbedModal.tsx`
- **Purpose:** iframe-based payment UI with postMessage handshake
- **Status:** Will be removed from checkout flow
- **Used In:**
  - `src/pages/Pay.tsx`
  - `src/pages/Checkout.tsx`

### 3. **Pay Page (CoreForge Payment Link)**
- **File:** `src/pages/Pay.tsx`
- **Purpose:** Standalone payment link page for CoreForge payments
- **Status:** Will be removed from routes
- **Route:** `/pay/:paymentId`

### 4. **Secure Checkout Modal**
- **File:** `src/components/checkout/SecureCheckoutModal.tsx`
- **Purpose:** Shows "Encrypting" → "CODE SENT" → Continue flow
- **Status:** Will be replaced with simple bank transfer popup
- **Used In:** `src/pages/Checkout.tsx`

### 5. **Payment Form**
- **File:** `src/components/checkout/PaymentForm.tsx`
- **Purpose:** Secure payment acknowledgment and submit button
- **Status:** Will be simplified to just "Place Order" → Bank details
- **Used In:** `src/pages/Checkout.tsx`

---

## Services/Libraries Removed

### 1. **CoreForge Pay Configuration**
- **File:** `src/constants/coreforgePay.ts`
- **Purpose:** CoreForge payment origin configuration
- **Functionality:** `getCoreForgePayOrigin()`

### 2. **Embed Pay PostMessage**
- **File:** `src/lib/embedPayPostMessage.ts`
- **Purpose:** iframe messaging protocol for payment embed
- **Functionality:** Handshake, height updates, success/error messages

### 3. **Secure Checkout Session Service**
- **File:** `src/services/secureCheckoutSession.ts`
- **Purpose:** Calls Edge function to create secure checkout session
- **Status:** Will not be called in bank transfer flow
- **Functions:**
  - `initiateSecureCheckoutSession()`
  - `describeCodeDestinations()`

### 4. **Protein Checkout Service**
- **File:** `src/services/proteinCheckout.ts`
- **Purpose:** Creates order reference and redirects to CoreForge
- **Status:** Will be modified to skip CoreForge redirect
- **Functions:**
  - `buildCheckoutPayload()` - Keep for order creation
  - `createOrderReferenceRecord()` - Keep for order reference
  - `completeProteinCheckoutRedirect()` - Remove/bypass

---

## Edge Functions (Not Deleted, Just Unused)

### 1. **secure-checkout-init**
- **Path:** `supabase/functions/secure-checkout-init/`
- **Purpose:** Creates payment link, sends verification codes
- **Status:** Will not be called during bank transfer period
- **Keep:** Yes (for future restore)

### 2. **partner-payment-ready**
- **Path:** `supabase/functions/partner-payment-ready/`
- **Purpose:** Webhook handler for partner payment notifications
- **Status:** Not used during bank transfer period
- **Keep:** Yes (for future restore)

### 3. **Twilio SMS Shared Library**
- **Path:** `supabase/functions/_shared/twilioSms.ts`
- **Purpose:** Send SMS verification codes
- **Status:** Not used during bank transfer period
- **Keep:** Yes (for future restore)

---

## Routes Removed/Modified

### App.tsx Route Changes

**Before:**
```tsx
<Route path="pay/:paymentId" element={<PaymentLinkPage />} />
<Route path="/pay" element={<Pay />} />
```

**After:**
```tsx
// CoreForge pay routes commented out
// <Route path="pay/:paymentId" element={<PaymentLinkPage />} />
// <Route path="/pay" element={<Pay />} />
```

---

## Checkout Flow Changes

### Previous Flow (CoreForge):
1. Customer fills shipping form
2. Clicks "Place Order"
3. `SecureCheckoutModal` shows "Encrypting..."
4. Edge function creates payment link, sends verification code
5. Modal shows "CODE SENT" with order reference
6. Customer clicks "Continue to CoreForge payment"
7. Either:
   - Opens CoreForge payment page in iframe
   - Redirects to CoreForge payment URL
   - Partner opens payment UI on their site
8. Customer enters verification code
9. Customer completes card payment
10. Redirects back to order confirmation

### New Flow (Bank Transfer):
1. Customer fills shipping form
2. Clicks "Place Order" (creates order reference in database)
3. Popup shows bank transfer instructions:
   - Payment instructions heading
   - BSB: 013402
   - ACCOUNT: 807892935
   - Business name: MJCA Group
   - Reference: [Order ID]
   - Important notes about including reference
4. Customer closes popup
5. Order status: "Awaiting Bank Transfer"
6. Admin manually marks payment as received
7. Admin updates order status to "Processing"

---

## Environment Variables (No Longer Used)

These environment variables will not be used during bank transfer period:

```bash
# CoreForge Integration (temporarily unused)
# VITE_COREFORGE_PAY_ORIGIN=https://core-forge.shop
# VITE_PROTEIN_STORE_URL=https://core-forge.shop
# VITE_CHECKOUT_SOFT_LAUNCH=false
# VITE_OPEN_PAYMENT_URL_ON_THIS_SITE=false
# VITE_CHECKOUT_DISPLAY_CURRENCY=AUD
```

---

## Database Schema Changes

### Tables Added for Bank Transfer:

1. **manual_payment_tracking**
   - Tracks customers who viewed payment instructions
   - Stores order reference, customer info, amount
   - Admin can mark as paid/unpaid
   - Can be moved to "completed" archive

2. **manual_payment_records**
   - Archive of completed manual payments
   - Historical records
   - Admin can search/filter/export

---

## Admin Dashboard Changes

### Features Added:
1. **Manual Payment Tracking Page**
   - View all pending bank transfer orders
   - See who clicked "Payment" button
   - Mark payments as received
   - Edit customer details
   - Delete cancelled orders
   - Move to completed records

2. **Payment Records Archive**
   - View historical completed payments
   - Search by order reference, customer, date
   - Export to CSV
   - Edit notes
   - Delete records

### Features Removed:
- CoreForge payment link management (PaymentLinksPage)
- Payment link status tracking
- Automated payment verification
- Square payment integration UI

---

## Constants/Copy Changes

### Checkout Copy (`src/constants/checkoutCopy.ts` if exists)

**Before:**
- `CHECKOUT_BRAND_NAME = "CoreForge"`
- `CHECKOUT_PARTNER_LABEL = "CoreForge"`
- `CHECKOUT_DELIVERY_BRAND = "Laminin Peptides via CoreForge"`

**After:**
- `CHECKOUT_BRAND_NAME = "Laminin Peptides"`
- `CHECKOUT_PARTNER_LABEL = "Bank Transfer"`
- `CHECKOUT_DELIVERY_BRAND = "Laminin Peptides"`

---

## What Stays the Same

### Unchanged Components:
- Product catalog
- Cart functionality
- Shipping address form
- Order confirmation page (modified to show bank transfer instructions)
- Admin dashboard structure
- Customer tracking
- Email notifications (if any)
- Database schema for products, customers, cart

### Unchanged Services:
- Supabase client configuration
- Product queries
- Customer management
- Cart state management
- Inventory tracking

---

## Migration Notes

### If Customer Data Exists:
- Existing orders in `orders` table remain untouched
- New orders during bank transfer period will have:
  - `payment_method = 'bank_transfer'`
  - `payment_status = 'pending'`
- Admin can manually update `payment_status` to `'completed'`

### When Restoring CoreForge:
- Archive manual payment tracking tables or migrate to CoreForge payment_links
- Update environment variables
- Restore components
- Redeploy Edge functions
- Test full flow

---

## Testing Checklist (Bank Transfer Flow)

- [ ] Checkout form validation works
- [ ] "Place Order" creates order reference
- [ ] Bank transfer popup displays correctly
- [ ] Popup shows correct bank details
- [ ] Popup shows correct order reference
- [ ] Customer can close popup
- [ ] Order appears in admin "Pending Payments"
- [ ] Admin can view order details
- [ ] Admin can mark payment as received
- [ ] Admin can move to completed records
- [ ] Admin can edit/delete orders
- [ ] Order confirmation email includes bank details (if emails enabled)

---

## Rollback Plan

If bank transfer flow has issues:

1. **Quick Rollback:**
   ```bash
   git checkout coreforge-full-v1
   npm install
   npm run build
   vercel --prod
   ```

2. **Selective Restore:**
   - Restore specific components from `.backups/`
   - Recommit to main
   - Rebuild and deploy

3. **Data Migration:**
   - Export pending bank transfer orders
   - Create CoreForge payment links for each
   - Send payment links to customers
   - Update order status

---

**Created:** April 18, 2026
**Last Updated:** April 18, 2026
