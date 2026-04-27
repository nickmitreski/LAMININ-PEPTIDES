# 🎯 Dashboard Improvements & Product Editing Guide

## ✅ COMPLETED: Sticky Navigation Header

The admin navigation is now **sticky** across all pages! It stays at the top when you scroll, making it easy to navigate between sections.

**Updated Pages:**
- ✅ AdminDashboard (Orders)
- ✅ AdminInventory
- ✅ AdminProducts
- ✅ AdminPaymentTracking
- ✅ AdminCustomers

**CSS Applied:**
```css
sticky top-0 z-50 shadow-sm
```

This means the navigation bar will:
- Stay visible at the top when scrolling
- Appear above all other content (z-50)
- Have a subtle shadow for depth

---

## 📊 RECOMMENDED DASHBOARD FEATURES

Here are features I recommend adding to make your admin dashboard even better:

### **🔥 High Priority (Implement Soon)**

#### 1. **Analytics Dashboard** 📈
**New Page:** `/admin/analytics`

**Features:**
- Sales over time (daily, weekly, monthly charts)
- Revenue trends
- Top-selling products
- Customer growth metrics
- Average order value
- Conversion rates

**Implementation:**
```typescript
// Use Chart.js or Recharts
- Line charts for sales trends
- Bar charts for product comparisons
- Pie charts for category distribution
- Date range selector
```

---

#### 2. **Export Functionality** 📥
**Add to existing pages:**

**Orders Page:**
- Export orders to CSV
- Filter by date range, status
- Include customer details

**Customers Page:**
- Export customer list
- Include order history
- GDPR-compliant data export

**Inventory Page:**
- Export stock levels
- Export transaction history
- Stock valuation report

**Implementation:**
```typescript
import { exportToCSV } from '../utils/export';

const exportOrders = () => {
  const data = orders.map(o => ({
    OrderID: o.peptide_order_id,
    Customer: o.customer_email,
    Total: o.total_price,
    Status: o.status,
    Date: o.created_at
  }));
  exportToCSV(data, 'orders.csv');
};
```

---

#### 3. **Bulk Actions** ⚡
**Orders Page:**
- Select multiple orders
- Bulk status update
- Bulk delete
- Print packing slips

**Products Page:**
- Bulk price update
- Bulk activate/deactivate
- Bulk category assignment

**Implementation:**
```typescript
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const bulkUpdateStatus = async (newStatus: OrderStatus) => {
  await Promise.all(
    selectedIds.map(id => updateOrderStatus(id, newStatus))
  );
  setSelectedIds([]);
  loadOrders();
};
```

---

#### 4. **Activity Log / Audit Trail** 📝
**New Table:** `admin_activity_log`

Track all admin actions:
- Who made changes
- What was changed
- When it happened
- Before/after values

**SQL:**
```sql
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'order_status_update', 'product_edit', etc.
  resource_type TEXT NOT NULL, -- 'order', 'product', 'customer'
  resource_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 5. **Email Notifications** 📧
**Features:**
- Notify customers on status changes
- Send order confirmations
- Low stock alerts to admin
- New order notifications

**Implementation:**
- Use Resend API (already in your .env)
- Create email templates
- Trigger on status updates

---

### **⭐ Medium Priority (Nice to Have)**

#### 6. **Customer Lifetime Value (CLV)** 💰
**Dashboard Widget:**
- Show top customers by total spent
- Customer segments (new, returning, VIP)
- Retention rate
- Repeat purchase rate

---

#### 7. **Inventory Alerts** 🔔
**Features:**
- Real-time low stock notifications
- Reorder point automation
- Stock expiry tracking (if applicable)
- Supplier management

---

#### 8. **Order Timeline** 📅
**Order Details Page:**
- Visual timeline of order journey
- Status change history
- Admin notes with timestamps
- Customer communications log

---

#### 9. **Quick Actions Bar** ⚡
**Add to top of pages:**
- Quick create order
- Quick add customer
- Quick stock adjustment
- Quick status updates

---

#### 10. **Dark Mode** 🌙
**User Preference:**
- Toggle in navigation
- Saved to localStorage
- Applies to all admin pages

---

## 🖼️ PRODUCT EDITING: Images, Stock, Prices

### **Current System Overview**

Your products are stored in TWO places:

1. **`src/data/peptides.ts`** - Frontend product catalog (what customers see)
2. **`product_mappings` table** - Backend database (what admins manage)

---

### **How Product Editing Works**

#### **Option A: Edit via Database (Current)**

**Editing Stock & Prices:**
```sql
-- Update stock quantity
UPDATE product_mappings
SET stock_quantity = 100
WHERE cfg_code = 'CFG-031';

-- Update price
UPDATE product_mappings
SET price = 109.00
WHERE cfg_code = 'CFG-031';
```

**This affects:**
- ✅ Inventory system
- ✅ Admin dashboard
- ❌ **NOT the customer-facing site** (that uses `peptides.ts`)

---

#### **Option B: Full Product Management System (Recommended)**

I'll create an **AdminProductEditor** component that lets you:
- Edit product details
- Update prices
- Change stock levels
- Upload/change images
- Sync with frontend catalog

---

### **📸 Image Management System**

#### **Current Image Setup:**

Images are stored in:
```
public/images/products/
├── CFG-001_119.png
├── CFG-002_69.png
├── CFG-031_99.png
└── ...
```

**Naming convention:** `{CFG_CODE}_{PRICE}.png`

---

#### **How to Add Product Editing with Images:**

I'll create this system for you:

**1. Create Supabase Storage Bucket**
```sql
-- Run in Supabase Storage
CREATE BUCKET product_images;

-- Set public access
UPDATE storage.buckets
SET public = true
WHERE name = 'product_images';
```

**2. Product Editor Component**
Features:
- Image upload (drag & drop)
- Image preview
- Multiple images per product
- Set primary image
- Automatic resizing/compression
- CDN delivery via Supabase Storage

**3. Edit Product Modal**
```typescript
interface ProductEditorProps {
  product: Product;
  onSave: (updated: Product) => void;
  onCancel: () => void;
}

// Features:
- Edit name, description
- Update price
- Adjust stock
- Upload new images
- Reorder image gallery
- Set primary image
- Save all changes
```

---

### **🔧 Implementation Plan for Product Editing**

Let me create this for you step by step:

#### **Step 1: Create Product Editor Component**

Features:
```typescript
AdminProductEditor.tsx
├── Product Info Form
│   ├── Product Name
│   ├── Description
│   ├── CFG Code (read-only)
│   └── Active/Inactive toggle
├── Pricing Section
│   ├── Price (AUD)
│   └── Currency selector
├── Inventory Section
│   ├── Current Stock
│   ├── Low Stock Threshold
│   └── Track Inventory toggle
└── Images Section
    ├── Upload new images
    ├── Image gallery
    ├── Set primary image
    └── Delete images
```

---

#### **Step 2: Database Schema for Images**

```sql
-- Create product_images table
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES product_mappings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
```

---

#### **Step 3: Image Upload Functions**

```typescript
// src/utils/imageUpload.ts

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}_${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from('product_images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('product_images')
    .getPublicUrl(filePath);

  return publicUrl;
}
```

---

### **🎨 Complete Product Editor Example**

Here's what the UI would look like:

```
┌─────────────────────────────────────────────┐
│ Edit Product: BPC-157 10mg                  │
├─────────────────────────────────────────────┤
│                                             │
│ Product Information                         │
│ ┌─────────────────────────────────────┐    │
│ │ Name: [BPC-157 10mg              ]  │    │
│ │ CFG Code: CFG-031 (read-only)     │    │
│ │ Description:                        │    │
│ │ ┌───────────────────────────────┐  │    │
│ │ │ Promotes healing and recovery │  │    │
│ │ │                                 │  │    │
│ │ └───────────────────────────────┘  │    │
│ │ Status: ☑ Active                   │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Pricing                                     │
│ ┌─────────────────────────────────────┐    │
│ │ Price: [$99.00] AUD                │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Inventory                                   │
│ ┌─────────────────────────────────────┐    │
│ │ Stock: [50     ]  units            │    │
│ │ Low Stock Alert: [10     ]  units  │    │
│ │ ☑ Track Inventory                  │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Product Images                              │
│ ┌─────────────────────────────────────┐    │
│ │ [Upload]  [Drop files here]        │    │
│ │                                      │    │
│ │  ┌────┐ ┌────┐ ┌────┐              │    │
│ │  │Img1│ │Img2│ │Img3│              │    │
│ │  │ ⭐ │ │    │ │    │              │    │
│ │  └────┘ └────┘ └────┘              │    │
│ │   (Primary)                          │    │
│ └─────────────────────────────────────┘    │
│                                             │
│         [Cancel]  [Save Changes]            │
└─────────────────────────────────────────────┘
```

---

### **📋 Quick Implementation Checklist**

To add full product editing:

**Backend (Supabase):**
- [ ] Create Supabase Storage bucket for images
- [ ] Create `product_images` table
- [ ] Add RLS policies for image uploads
- [ ] Create `update_product` RPC function

**Frontend (React):**
- [ ] Create `AdminProductEditor` component
- [ ] Add image upload utility
- [ ] Create product edit modal
- [ ] Update `AdminProducts` page with "Edit" buttons
- [ ] Add form validation
- [ ] Handle image compression

**Integration:**
- [ ] Sync `product_mappings` with `peptides.ts`
- [ ] Update image paths
- [ ] Test image upload flow
- [ ] Add success/error notifications

---

### **🚀 Want Me to Build This?**

I can create the complete product editing system with:

1. ✅ **Product Editor Modal** - Edit all product details
2. ✅ **Image Upload** - Drag & drop with preview
3. ✅ **Price Management** - Update prices from admin
4. ✅ **Stock Management** - Already have inventory system
5. ✅ **Image Gallery** - Multiple images per product
6. ✅ **Database Schema** - All SQL scripts needed
7. ✅ **Full CRUD** - Create, Read, Update, Delete products

---

## 💡 **My Recommendations:**

### **Do Now:**
1. ✅ Sticky navigation (DONE!)
2. ✅ Export to CSV (simple, high value)
3. ✅ Product editor with image upload
4. ✅ Basic analytics dashboard

### **Do Later:**
5. Email notifications (requires Resend setup)
6. Bulk actions (after testing workflow)
7. Activity log (for compliance)
8. Advanced analytics (once you have data)

---

## 🎯 **Next Steps:**

**Choose what you want:**

**Option A: Build Product Editor**
- I'll create the full product editing system with image upload
- Edit prices, stock, images from admin panel
- No more manual file editing

**Option B: Add Analytics Dashboard**
- Sales charts and revenue tracking
- Customer metrics
- Top products report

**Option C: Add Export Functionality**
- Export orders, customers, inventory to CSV
- Quick and valuable feature

**Let me know which you want, and I'll build it!** 🚀

---

**Created:** 2026-04-22
**Status:** Ready to implement your choice
