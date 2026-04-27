# 🧪 Testing Your New Inventory System

## ✅ Ready to Test!

Your AdminInventory.tsx has been completely rewritten to use the Supabase database. Here's how to test it right now.

---

## 🚀 Quick Start

### **1. Start Dev Server** (Already Running)
Your dev server is already running at:
```
http://localhost:5173/
```

### **2. Navigate to Inventory Page**
Go to one of these URLs:
```
http://localhost:5173/admin/inventory
http://localhost:5173/admin/login (then navigate to inventory)
```

### **3. Login** (If Required)
You'll need admin authentication. Use your admin credentials set up in Supabase.

---

## 🧪 Test Scenarios

### **Test 1: View All Products** ✅
**What to check:**
- [ ] Product list loads on the left sidebar
- [ ] Products show: Name, Strength, CFG Code, Stock quantity
- [ ] Stock levels have color coding:
  - 🟢 Green = healthy stock
  - 🟡 Yellow = low stock
  - 🔴 Red = out of stock
- [ ] Product count shows in header (e.g., "Products (45)")

**Expected behavior:**
- Products load from `product_mappings` table in Supabase
- All active products (`is_active = true`) are displayed

---

### **Test 2: Select a Product** ✅
**What to check:**
- [ ] Click any product in the list
- [ ] Right panel shows product details:
  - Product name (e.g., "BPC-157")
  - Strength and CFG code
  - Price in AUD
- [ ] Three stat boxes show:
  - **Current Stock** (color-coded)
  - **Low Stock Alert** threshold
  - **Tracking** status (✓ or ✗)

**Expected behavior:**
- Selected product highlights with dark border
- Background changes to grey
- Details panel populates with product info

---

### **Test 3: Low Stock Alert Banner** ⚠️
**Setup:**
Make sure you have at least one product where:
- `stock_quantity` ≤ `low_stock_threshold`
- `track_inventory` = true

**What to check:**
- [ ] Yellow alert banner appears at top
- [ ] Shows count: "X products running low"
- [ ] Lists up to 5 low stock items as clickable chips
- [ ] Clicking a chip selects that product

**Expected behavior:**
- Banner only shows if low stock products exist
- Clicking chip jumps to that product in the list

---

### **Test 4: Add Stock (New Shipment)** ➕
**Steps:**
1. Select a product (e.g., BPC-157 10mg)
2. Note current stock (e.g., 10 units)
3. Click **➕ Add Stock** button (turns green)
4. Enter quantity: `50`
5. Add note: `Test shipment - New inventory`
6. Click **Apply Adjustment**

**What to check:**
- [ ] Success alert: "✅ Inventory updated successfully"
- [ ] Stock quantity updates: 10 → 60
- [ ] New transaction appears in history below
- [ ] Transaction shows:
  - ↑ Green up arrow
  - Type: "Restock"
  - Change: +50
  - Before: 10 → After: 60
  - Notes: "Test shipment - New inventory"
  - Timestamp
- [ ] Form fields reset (quantity and notes cleared)
- [ ] Product list updates with new stock

**Expected database result:**
```sql
-- New row in inventory_transactions
cfg_code: 'CFG-031'
transaction_type: 'restock'
quantity_change: 50
quantity_before: 10
quantity_after: 60
notes: 'Test shipment - New inventory'
```

---

### **Test 5: Remove Stock (Damage/Loss)** ➖
**Steps:**
1. Select same product
2. Note current stock (e.g., 60 units)
3. Click **➖ Remove Stock** button (turns red)
4. Enter quantity: `5`
5. Add note: `Damaged units removed`
6. Click **Apply Adjustment**

**What to check:**
- [ ] Success alert appears
- [ ] Stock quantity updates: 60 → 55
- [ ] New transaction appears with:
  - ↓ Red down arrow
  - Type: "Sale"
  - Change: -5
  - Before: 60 → After: 55

**Expected database result:**
```sql
-- New row in inventory_transactions
transaction_type: 'sale'
quantity_change: -5
```

---

### **Test 6: Set Exact Quantity (Physical Count)** 🔢
**Steps:**
1. Select same product
2. Note current stock (e.g., 55 units)
3. Click **🔢 Set Exact** button (turns blue)
4. Enter new total: `100`
5. Notice preview text: "Will change by: +45"
6. Add note: `Physical inventory count - Test`
7. Click **Apply Adjustment**

**What to check:**
- [ ] Preview shows correct calculation (100 - 55 = +45)
- [ ] Success alert appears
- [ ] Stock quantity updates: 55 → 100
- [ ] Transaction shows:
  - Type: "Adjustment"
  - Change: +45
  - Before: 55 → After: 100

**Expected database result:**
```sql
-- New row in inventory_transactions
transaction_type: 'adjustment'
quantity_change: 45  -- Automatically calculated
```

---

### **Test 7: View Transaction History** 📜
**What to check:**
- [ ] History section shows all 3 test transactions:
  1. Restock: +50
  2. Sale: -5
  3. Adjustment: +45
- [ ] Each transaction shows:
  - Date and time
  - Transaction type
  - Quantity change (color-coded)
  - Before/After quantities
  - Notes
  - Admin email
- [ ] Transactions ordered by most recent first
- [ ] Scrollable if more than ~10 transactions

**Expected behavior:**
- History loads via `get_inventory_history` RPC function
- Shows last 50 transactions per product

---

### **Test 8: Switch Between Products** 🔄
**Steps:**
1. Select Product A (e.g., BPC-157)
2. Note its transaction history
3. Select Product B (e.g., TB-500)
4. Check its transaction history

**What to check:**
- [ ] History updates to show Product B's transactions
- [ ] Stock quantities are different for each product
- [ ] Form resets when switching products
- [ ] No mixing of transaction histories

**Expected behavior:**
- Each product has its own independent transaction log
- History filtered by `cfg_code`

---

### **Test 9: Edge Cases** ⚠️

#### **Invalid Quantity**
**Steps:**
1. Select a product
2. Click any adjustment mode
3. Enter: `-10` or `0` or leave empty
4. Click Apply

**What to check:**
- [ ] Alert: "Please enter a valid quantity greater than 0"
- [ ] No database update occurs
- [ ] Stock quantity unchanged

#### **Empty Notes**
**Steps:**
1. Make adjustment without adding notes
2. Click Apply

**What to check:**
- [ ] Adjustment succeeds
- [ ] Transaction saved with `notes: null`
- [ ] No error occurs

#### **No Product Selected**
**Steps:**
1. Don't select any product
2. Center panel shows: "📦 Select a Product"

**What to check:**
- [ ] Placeholder message displayed
- [ ] No adjustment controls shown
- [ ] No errors in console

---

### **Test 10: Database Verification** 💾

#### **Check product_mappings Table**
Run in Supabase SQL Editor:
```sql
SELECT cfg_code, peptide_id, strength, stock_quantity, low_stock_threshold, track_inventory
FROM product_mappings
WHERE peptide_id = 'bpc-157'
ORDER BY strength;
```

**What to check:**
- [ ] `stock_quantity` matches what you see in UI
- [ ] Values updated after adjustments

#### **Check inventory_transactions Table**
```sql
SELECT *
FROM inventory_transactions
WHERE cfg_code = 'CFG-031'
ORDER BY created_at DESC
LIMIT 10;
```

**What to check:**
- [ ] All 3 test transactions recorded
- [ ] `quantity_before` and `quantity_after` are correct
- [ ] `notes` saved properly
- [ ] `created_at` timestamps are accurate
- [ ] `created_by` shows admin email

---

## 🐛 Common Issues & Fixes

### **Issue 1: Products Not Loading**
**Symptoms:**
- Sidebar shows "Loading products..." forever
- Empty product list

**Debug Steps:**
1. Open browser console (F12)
2. Look for errors like:
   - `RPC function not found`
   - `column does not exist`
   - `relation "product_mappings" does not exist`

**Fix:**
```sql
-- Check table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'product_mappings';

-- Check columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'product_mappings'
AND column_name IN ('stock_quantity', 'track_inventory', 'low_stock_threshold');
```

If columns missing, re-run the inventory management SQL script.

---

### **Issue 2: "adjust_inventory function not found"**
**Symptoms:**
- Error when clicking "Apply Adjustment"
- Message: "function adjust_inventory does not exist"

**Fix:**
```sql
-- Check function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'adjust_inventory';
```

If not found, re-run the SQL schema from `ADMIN_DASHBOARD_COMPLETE_GUIDE.md`.

---

### **Issue 3: Transaction History Empty**
**Symptoms:**
- "No transaction history yet" message
- Even after making adjustments

**Debug:**
```sql
-- Check transactions table
SELECT * FROM inventory_transactions LIMIT 5;

-- Check RPC function
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_inventory_history';
```

**Fix:**
Re-run the inventory management SQL schema.

---

### **Issue 4: Supabase Not Configured**
**Symptoms:**
- Console error: "Supabase not configured"
- Products don't load

**Fix:**
1. Check `.env.local` exists in project root:
```env
VITE_SUPABASE_URL=https://ytacbvfcltikxzudlkzn.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Restart dev server:
```bash
npm run dev
```

---

## ✅ Expected Final State

After all tests, you should have:

### **Database Changes:**
- ✅ `product_mappings.stock_quantity` updated to 100 for test product
- ✅ 3 new rows in `inventory_transactions` table
- ✅ Complete audit trail of all changes

### **UI State:**
- ✅ Product list shows updated stock quantities
- ✅ Transaction history shows 3 entries for test product
- ✅ Low stock alerts update dynamically
- ✅ All color coding works (green/yellow/red)

### **Functionality Verified:**
- ✅ Add stock works
- ✅ Remove stock works
- ✅ Set exact works
- ✅ Notes system works
- ✅ Transaction history loads
- ✅ Low stock alerts appear
- ✅ Form validation works
- ✅ Real-time updates work

---

## 📊 Performance Metrics

**Expected load times:**
- Product list: < 1 second
- Transaction history: < 500ms
- Stock adjustment: < 1 second

**Database queries:**
- Load products: 1 query to `product_mappings`
- Load history: 1 RPC call to `get_inventory_history`
- Adjust inventory: 1 RPC call to `adjust_inventory`

---

## 🎯 Next Testing Phase

Once basic inventory works, test:

1. **Multiple Admin Users**
   - Different admins making adjustments
   - Check `created_by` field tracking

2. **High Volume**
   - Make 50+ adjustments to one product
   - Verify history scrolling works
   - Check last 50 limit

3. **Edge Cases**
   - Products with 0 stock
   - Products with `track_inventory = false`
   - Very large quantities (999999)
   - Negative stock attempts

4. **Concurrent Updates**
   - Two admins adjusting same product simultaneously
   - Check for race conditions

---

## 📝 Test Checklist

Print this checklist and tick off each test:

- [ ] Test 1: View All Products
- [ ] Test 2: Select a Product
- [ ] Test 3: Low Stock Alert Banner
- [ ] Test 4: Add Stock
- [ ] Test 5: Remove Stock
- [ ] Test 6: Set Exact Quantity
- [ ] Test 7: View Transaction History
- [ ] Test 8: Switch Between Products
- [ ] Test 9: Edge Cases
- [ ] Test 10: Database Verification

---

**Current Status:** ✅ Ready to Test
**URL:** http://localhost:5173/admin/inventory
**Project:** Laminin Peptides
**Database:** Supabase (ytacbvfcltikxzudlkzn)

🎉 **Start testing now!**
