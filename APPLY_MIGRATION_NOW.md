# 🚀 Quick Start: Apply Database Migration

## Step 1: Open Supabase SQL Editor

Go to: **https://ytacbvfcltikxzudlkzn.supabase.co**

1. Click **SQL Editor** in the left sidebar
2. Click **New Query**

## Step 2: Copy the Migration Script

Open this file:
```
supabase/migrations/20260402_enhanced_customer_orders.sql
```

Copy the entire contents (92 lines).

## Step 3: Execute the Migration

1. Paste the SQL into the Supabase SQL Editor
2. Click the **RUN** button
3. Wait for success message

You should see:
```
Success. No rows returned.
```

## Step 4: Verify the Migration

Run this query in SQL Editor to verify:
```sql
-- Check that new columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'order_references'
  AND column_name IN ('customer_phone', 'customer_address', 'customer_city');
```

You should see 3 rows returned.

## Step 5: Test the System

```bash
npm run dev
```

Then:
1. ✅ Add a product to cart
2. ✅ Go to `/checkout`
3. ✅ Fill in all customer information
4. ✅ Submit the order
5. ✅ Go to `/admin`
6. ✅ See the order with customer details
7. ✅ Click the eye icon (👁️) to view full details

## That's It!

Your backend admin panel is now fully configured and ready to capture customer information from every order.

---

**Need Help?**
- Check `BACKEND_ADMIN_IMPLEMENTATION.md` for complete documentation
- See `SUPABASE_SETUP_INSTRUCTIONS.md` for detailed setup guide
- Review `supabase/migrations/20260402_enhanced_customer_orders.sql` for what the migration does
