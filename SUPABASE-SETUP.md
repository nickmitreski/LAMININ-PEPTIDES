# 🗄️ SUPABASE SETUP GUIDE

Complete guide to setting up Supabase for your Laminin Peptide Lab order tracking system.

---

## ✅ QUICK START

Your Supabase is already configured in the code! You just need to:

1. Run the SQL schema
2. Add environment variables
3. Test the integration

---

## 📋 STEP 1: RUN DATABASE SCHEMA

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase SQL Editor:
   ```
   https://ytacbvfcltikxzudlkzn.supabase.co/project/ytacbvfcltikxzudlkzn/sql/new
   ```

2. Copy the entire contents of `supabase/schema.sql`

3. Paste into the SQL Editor and click **"Run"**

4. You should see: ✅ Success. No rows returned

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI if needed
brew install supabase/tap/supabase

# Login
supabase login

# Link to your project
supabase link --project-ref ytacbvfcltikxzudlkzn

# Run the schema
supabase db push
```

---

## 🔑 STEP 2: ADD ENVIRONMENT VARIABLES

Create a `.env.local` file in the root of your project:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Then add your actual credentials:

```env
# Supabase - Order References & Product Mappings
VITE_SUPABASE_URL=https://ytacbvfcltikxzudlkzn.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_jRLtLGh7uslmqubJ_qQY7w_ogbknh7D

# Partner Protein Store (Optional - for redirect checkout)
# If not set, orders will redirect to your own order confirmation page
VITE_PROTEIN_STORE_URL=
VITE_PROTEIN_STORE_API_KEY=

# App
VITE_APP_URL=http://localhost:5173
```

**⚠️ IMPORTANT:** Never commit `.env.local` to git!

---

## 🧪 STEP 3: TEST THE CONNECTION

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Check browser console** - you should see:
   ```
   ✅ All product data validation passed!
   ```

3. **Test checkout flow:**
   - Add a product to cart
   - Go to checkout
   - Fill in customer details
   - Click "Proceed to secure payment"
   - You should be redirected to order confirmation
   - Order should be saved in Supabase!

4. **Verify in Supabase:**
   - Go to Table Editor: https://ytacbvfcltikxzudlkzn.supabase.co/project/ytacbvfcltikxzudlkzn/editor
   - Check `order_references` table
   - You should see your test order!

---

## 📊 DATABASE TABLES

### 1. `customers`
Stores customer information (email, name, phone).

**Columns:**
- `id` (UUID) - Primary key
- `email` (TEXT) - Unique customer email
- `first_name`, `last_name`, `phone`
- `created_at`, `updated_at`

### 2. `order_references`
Tracks all peptide orders.

**Columns:**
- `id` (UUID) - Primary key
- `peptide_order_id` (TEXT) - Format: `PEP-20260330-AB12`
- `protein_store_order_id` (TEXT) - Partner store order ID
- `customer_email`, `customer_name`
- `peptide_items` (JSONB) - Array of peptide line items
- `protein_items` (JSONB) - Array of mapped protein SKUs
- `status` - pending | paid | processing | shipped | delivered | cancelled
- `total_price` (DECIMAL)
- `created_at`, `updated_at`

### 3. `product_mappings`
Maps CFG codes to protein store products.

**Columns:**
- `id` (UUID) - Primary key
- `cfg_code` (TEXT) - e.g., "CFG-001"
- `peptide_name` (TEXT) - Display name
- `protein_name` (TEXT) - Partner store product name
- `price` (DECIMAL)
- `is_active` (BOOLEAN)

---

## 🔄 HOW IT WORKS

### Checkout Flow:

1. **Customer fills out checkout form**
   ```
   Customer info + Cart items
   ```

2. **App generates order ID**
   ```javascript
   PEP-20260330-AB12
   ```

3. **App saves to Supabase**
   ```typescript
   createOrderReference({
     peptide_order_id: 'PEP-20260330-AB12',
     customer_email: 'customer@example.com',
     peptide_items: [...],
     protein_items: [...],
     status: 'pending'
   })
   ```

4. **App saves backup to localStorage**
   ```
   In case Supabase is down
   ```

5. **App attempts redirect to protein store**
   ```
   POST to VITE_PROTEIN_STORE_URL/api/peptide-bridge/checkout
   ```

6. **If protein store configured:**
   - Redirects to partner checkout
   - Partner completes payment
   - Partner calls webhook to update status

7. **If protein store NOT configured:**
   - Redirects to own order confirmation page
   - Status stays 'pending' until manually updated

---

## 🎯 PRODUCTION DEPLOYMENT

### Vercel Environment Variables

Add these to your Vercel project settings:

```env
VITE_SUPABASE_URL=https://ytacbvfcltikxzudlkzn.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_jRLtLGh7uslmqubJ_qQY7w_ogbknh7D
VITE_PROTEIN_STORE_URL=https://your-protein-store.com
VITE_PROTEIN_STORE_API_KEY=your_api_key
VITE_APP_URL=https://laminincollective.com
```

### Database Security (RLS Policies)

The schema includes Row Level Security policies that allow:
- ✅ Anyone can READ order_references (public order lookup)
- ✅ Anyone can CREATE order_references (checkout flow)
- ✅ Anyone can UPDATE order_references (status updates)

**⚠️ For Production:**
Consider tightening these policies or adding API keys.

---

## 📡 PARTNER STORE INTEGRATION

### Endpoint Expected

Your protein store should implement:

```
POST /api/peptide-bridge/checkout
```

**Request Body:**
```json
{
  "peptide_order_id": "PEP-20260330-AB12",
  "customer": {
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+61400000000",
    "address": "123 Main St",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000",
    "country": "Australia"
  },
  "peptide_items": [
    {
      "cfg_code": "CFG-034",
      "peptide_display_name": "Semax 10mg",
      "quantity": 2,
      "unit_price": 79.00,
      "line_total": 158.00
    }
  ],
  "protein_items": [
    {
      "cfg_code": "CFG-034",
      "protein_name": "Semax",
      "quantity": 2,
      "unit_price": 79.00,
      "line_total": 158.00
    }
  ],
  "totals": {
    "subtotal": 158.00,
    "shipping": 15.00,
    "tax": 15.80,
    "grand_total": 188.80
  }
}
```

**Response:**
```json
{
  "redirect_url": "https://protein-store.com/checkout/abc123"
}
```

### Status Update Webhook

Partner store should call this to update order status:

```typescript
// POST to your API endpoint (you'll need to create this)
POST https://laminincollective.com/api/orders/status

{
  "peptide_order_id": "PEP-20260330-AB12",
  "status": "paid",
  "protein_store_order_id": "PROT-12345"
}
```

---

## 🔧 TROUBLESHOOTING

### Orders not saving to Supabase?

**Check:**
1. Environment variables are set correctly
2. SQL schema was run successfully
3. Browser console for errors
4. Supabase dashboard > Logs for error messages

### "RLS policy violation" error?

**Fix:**
Re-run the schema SQL - the `DROP POLICY IF EXISTS` commands will reset permissions.

### Can't see orders in dashboard?

**Check:**
1. Table Editor > `order_references`
2. Filter by `created_at` (recent first)
3. Check `peptide_order_id` matches confirmation page

### LocalStorage fallback working?

If Supabase is down, orders save to `localStorage` as backup:
- Key: `laminin-checkout-orders`
- Check: Browser DevTools > Application > Local Storage

---

## 📚 USEFUL QUERIES

### Get recent orders:
```sql
SELECT
  peptide_order_id,
  customer_email,
  status,
  total_price,
  created_at
FROM order_references
ORDER BY created_at DESC
LIMIT 20;
```

### Update order status:
```sql
UPDATE order_references
SET status = 'paid', updated_at = NOW()
WHERE peptide_order_id = 'PEP-20260330-AB12';
```

### Get orders by customer:
```sql
SELECT *
FROM order_references
WHERE customer_email = 'customer@example.com'
ORDER BY created_at DESC;
```

### Check product mappings:
```sql
SELECT cfg_code, peptide_name, protein_name, price
FROM product_mappings
WHERE is_active = true
ORDER BY cfg_code;
```

---

## 🎉 YOU'RE ALL SET!

Your Supabase integration is ready. Orders will now:
- ✅ Save to Supabase automatically
- ✅ Fallback to localStorage if Supabase is down
- ✅ Track customer information
- ✅ Map CFG codes to protein products
- ✅ Support status updates from partner store

**Next Steps:**
1. Test a full checkout flow
2. Verify orders in Supabase dashboard
3. Set up partner store integration (optional)
4. Deploy to production with environment variables

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Supabase Dashboard: https://ytacbvfcltikxzudlkzn.supabase.co
- Project Support: Contact your development team
