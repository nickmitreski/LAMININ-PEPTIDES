# Admin Panel Features & UI Guide

## Dashboard Overview (`/admin`)

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                  [Products] │
│ Welcome back, Admin                                [Logout] │
└─────────────────────────────────────────────────────────────┘
```

### Statistics Cards (5 Cards in a Row)
```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Orders │   Pending    │  Processing  │   Shipped    │  Delivered   │
│     42       │      8       │      12      │      15      │      7       │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```
- **Total Orders:** Blue left border
- **Pending:** Yellow left border
- **Processing:** Blue left border
- **Shipped:** Purple left border
- **Delivered:** Green left border

### Search & Filter Bar
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Search by order ID, email, or customer name...    [Status ▼] [🔄] │
└─────────────────────────────────────────────────────────────────────┘
```
- **Search:** Real-time search across order ID, email, name, phone, city
- **Filter:** Dropdown to filter by status (All, Pending, Paid, Processing, etc.)
- **Refresh:** Button to reload orders from database

### Orders Table

```
┌──────────────┬──────────────┬──────────────┬──────────┬────────┬────────────┬─────────────┐
│ Order ID     │ Customer     │ Contact      │ Status   │ Total  │ Date       │ Actions     │
├──────────────┼──────────────┼──────────────┼──────────┼────────┼────────────┼─────────────┤
│ PEP-20260402 │ John Smith   │ john@ex.com  │ PENDING  │ $249   │ Apr 2      │ 👁️ [Status▼]│
│ -AB12        │ Sydney, NSW  │ 0412345678   │          │        │ 10:30 AM   │             │
├──────────────┼──────────────┼──────────────┼──────────┼────────┼────────────┼─────────────┤
│ PEP-20260401 │ Jane Doe     │ jane@ex.com  │ SHIPPED  │ $179   │ Apr 1      │ 👁️ [Status▼]│
│ -XY78        │ Melbourne,VIC│ 0498765432   │          │        │ 2:15 PM    │             │
└──────────────┴──────────────┴──────────────┴──────────┴────────┴────────────┴─────────────┘
```

**Table Columns Explained:**

1. **Order ID**
   - Format: PEP-YYYYMMDD-XXXX
   - Monospace font for easy copying
   - Unique identifier for each order

2. **Customer**
   - Line 1: Full name (bold)
   - Line 2: City, State (muted)

3. **Contact**
   - Line 1: Email address
   - Line 2: Phone number (if provided, muted)

4. **Status**
   - Color-coded badge:
     - 🟡 Yellow: Pending
     - 🟢 Green: Paid, Delivered
     - 🔵 Blue: Processing
     - 🟣 Purple: Shipped
     - 🔴 Red: Cancelled

5. **Total**
   - Order total in AUD
   - Bold, prominent display

6. **Date**
   - Line 1: Date (Apr 2)
   - Line 2: Time (10:30 AM)

7. **Actions**
   - 👁️ Eye icon: Opens order details modal
   - Status dropdown: Update order status inline

## Order Details Modal

Click the 👁️ icon on any order to open a comprehensive details view:

### Modal Header
```
┌──────────────────────────────────────────────────┐
│ Order Details                               [×]  │
└──────────────────────────────────────────────────┘
```

### Order Information Card
```
┌──────────────────────────────────────────────────┐
│ Order ID: PEP-20260402-AB12  │  Status: PENDING  │
│ Total: $249.00                │  Date: Apr 2, 2026│
└──────────────────────────────────────────────────┘
```
- Blue accent left border
- Grid layout for key info
- Easy to scan at a glance

### Customer Information Card
```
┌──────────────────────────────────────────────────┐
│ 📧 Customer Information                          │
│                                                  │
│ Name                                             │
│ John Smith                                       │
│                                                  │
│ Email                                            │
│ john@example.com (click to email)                │
│                                                  │
│ Phone                                            │
│ 📞 0412 345 678 (click to call)                  │
└──────────────────────────────────────────────────┘
```
- Email is clickable (mailto: link)
- Phone is clickable (tel: link)
- Icons for visual clarity

### Shipping Address Card
```
┌──────────────────────────────────────────────────┐
│ 📍 Shipping Address                              │
│                                                  │
│ 123 Main Street                                  │
│ Sydney, NSW 2000                                 │
│ Australia                                        │
└──────────────────────────────────────────────────┘
```
- Complete address formatted nicely
- Easy to copy for shipping labels
- Handles missing data gracefully

### Order Items Card
```
┌──────────────────────────────────────────────────┐
│ 📦 Order Items (3)                               │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ CJC-1295 (no DAC) 10mg          $119.00     │ │
│ │ Code: CFG-001 • Qty: 1           $119.00/ea │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ BPC-157 10mg                     $99.00      │ │
│ │ Code: CFG-031 • Qty: 1            $99.00/ea │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Bacteriostatic Water 3ml         $5.00       │ │
│ │ Code: CFG-028 • Qty: 1             $5.00/ea │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```
- Each item in its own bordered box
- Product name and total on right
- CFG code and quantity on left
- Unit price shown clearly

### Internal Notes (if present)
```
┌──────────────────────────────────────────────────┐
│ Internal Notes                                   │
│                                                  │
│ Customer requested express shipping.             │
│ Priority handling required.                      │
└──────────────────────────────────────────────────┘
```
- Gray background to differentiate
- For admin use only
- Not visible to customer

### Modal Footer
```
┌──────────────────────────────────────────────────┐
│                                        [Close]   │
└──────────────────────────────────────────────────┘
```
- Sticky footer, always visible
- Easy to close modal

## Features in Action

### 1. Real-Time Search
Type in search box to filter orders by:
- Order ID: "PEP-20260402"
- Customer name: "John"
- Email: "john@example.com"
- Phone: "0412"
- City: "Sydney"

Results update instantly as you type.

### 2. Status Filtering
Click status dropdown to show only:
- All orders (default)
- Pending orders
- Paid orders
- Processing orders
- Shipped orders
- Delivered orders
- Cancelled orders

### 3. Quick Status Update
Click status dropdown in table row to change order status:
```
[Pending ▼] → Select "Paid" → ✅ Order status updated to paid
```
- Updates immediately in database
- Shows success toast notification
- Table refreshes to show change

### 4. View Full Details
Click 👁️ icon to open modal with:
- Complete customer contact information
- Full shipping address
- All order items with pricing
- Any internal notes
- Easy to print or reference

### 5. Responsive Design
- **Desktop:** Full table with all columns
- **Tablet:** Scrollable table, sticky header
- **Mobile:** Optimized view, stacked information

## Color Scheme

Matches your existing design system:

- **Primary Text:** Carbon-900 (#0A0A0A)
- **Muted Text:** Neutral-600 (#525252)
- **Accent:** Accent color from theme
- **Background:** White and Platinum
- **Borders:** Carbon-900/10 (subtle)

### Status Badge Colors
- **Pending:** Yellow-100 bg, Yellow-800 text
- **Paid:** Green-100 bg, Green-800 text
- **Processing:** Blue-100 bg, Blue-800 text
- **Shipped:** Purple-100 bg, Purple-800 text
- **Delivered:** Green-100 bg, Green-800 text
- **Cancelled:** Red-100 bg, Red-800 text

## Keyboard Shortcuts

- **ESC:** Close order details modal
- **Click outside:** Close modal
- **Tab:** Navigate through form fields
- **Enter:** Submit search

## Mobile Optimizations

- Touch-friendly tap targets (minimum 44px)
- Scrollable table on small screens
- Modal takes full screen on mobile
- Sticky header and footer in modal
- Reduced padding on small screens
- Stacked layout for better readability

## Data Validation

The system handles:
- ✅ Missing phone numbers gracefully
- ✅ Incomplete addresses (shows "N/A")
- ✅ Empty order items list
- ✅ Null customer fields
- ✅ Various date formats
- ✅ Currency formatting

## Performance

- **Fast Load:** Orders cached in memory
- **Efficient Search:** Client-side filtering (instant results)
- **Lazy Loading:** Modal loads only when opened
- **Optimized Queries:** Supabase indexes on key fields
- **Minimal Re-renders:** React optimization techniques

## Accessibility

- **ARIA Labels:** All buttons and inputs labeled
- **Keyboard Navigation:** Full keyboard support
- **Focus Management:** Proper focus states
- **Screen Reader Friendly:** Semantic HTML
- **Color Contrast:** WCAG AA compliant

## What Admins Can Do

1. ✅ View all orders at a glance
2. ✅ Search orders quickly
3. ✅ Filter by status
4. ✅ See customer contact info
5. ✅ View complete order details
6. ✅ Update order status
7. ✅ Copy customer information
8. ✅ Email customers directly (click email)
9. ✅ Call customers directly (click phone)
10. ✅ Refresh order list

## What Happens Automatically

1. ✅ Customer stats update on new order
2. ✅ Timestamps track creation and updates
3. ✅ Addresses stored from first order
4. ✅ Total spending calculated
5. ✅ Order count incremented

---

## Summary

The admin panel provides everything you need to manage orders and customer information efficiently:

- **Professional Design** - Matches your brand
- **Easy to Use** - Intuitive interface
- **Complete Information** - All customer details stored
- **Quick Actions** - Update status inline
- **Detailed View** - Modal with full order details
- **Search & Filter** - Find orders fast
- **Mobile Friendly** - Works everywhere
- **Production Ready** - Secure and scalable

**Next:** Apply the database migration and start using it!

---

**Created:** April 2, 2026
**For:** Laminin Peptide Lab Admin Panel
