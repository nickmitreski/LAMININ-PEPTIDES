# Supabase Backend Admin Panel Setup

This guide will help you set up the complete backend admin panel for the Laminin Peptide Lab e-commerce platform.

## Overview

The backend admin panel provides:
- **Complete order tracking** with full customer contact information
- **Customer details storage** including shipping addresses
- **Order management** with status updates
- **Detailed order view** with all customer information in a modal
- **Search and filter** capabilities for orders
- **Automatic customer stats tracking** (total orders, total spent)

## Step 1: Apply Database Migration

1. Open your Supabase project dashboard at: https://ytacbvfcltikxzudlkzn.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20260402_enhanced_customer_orders.sql`
5. Paste into the SQL Editor
6. Click **RUN** to execute the migration

This will:
- Add customer contact fields to `order_references` table (phone, address, city, state, postcode, country)
- Add shipping address fields to `customers` table
- Create automatic customer stats tracking (total orders, total spent)
- Create an `order_notes` table for internal admin notes
- Set up all necessary indexes and triggers

## Step 2: Verify Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```bash
VITE_SUPABASE_URL=https://ytacbvfcltikxzudlkzn.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_jRLtLGh7uslmqubJ_qQY7w_ogbknh7D
```

These are already configured in your project.

## Step 3: Test the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the checkout flow:**
   - Add a product to cart
   - Go to checkout
   - Fill in all customer information:
     - First Name, Last Name
     - Email
     - Phone
     - Full shipping address (Street, City, State, Postcode, Country)
   - Submit the order

3. **View in admin panel:**
   - Navigate to `/admin/login`
   - Login with admin credentials
   - You should see the order in the dashboard
   - Click the eye icon (👁️) to view full customer details in a modal

## Features

### Admin Dashboard (`/admin`)

The admin dashboard displays:
- **Order statistics**: Total orders, pending, processing, shipped, delivered
- **Order table** with columns:
  - Order ID
  - Customer name and location
  - Contact info (email and phone)
  - Order status
  - Total amount
  - Order date
  - Actions (view details, update status)

### Order Details Modal

Clicking the eye icon on any order opens a detailed modal showing:

**Order Information:**
- Order ID
- Status
- Total amount
- Order date

**Customer Information:**
- Full name
- Email (clickable to send email)
- Phone number (clickable to call)

**Shipping Address:**
- Complete street address
- City, State, Postcode
- Country

**Order Items:**
- List of all products ordered
- Quantities
- Individual prices
- Line totals

### Search & Filter

The admin panel includes:
- **Search** by: order ID, customer name, email, phone, or city
- **Filter** by order status: all, pending, paid, processing, shipped, delivered, cancelled
- **Refresh** button to reload orders

## Database Schema

### order_references Table (Enhanced)
```sql
- id (UUID)
- peptide_order_id (TEXT)
- customer_email (TEXT)
- customer_name (TEXT)
- customer_first_name (TEXT) ← NEW
- customer_last_name (TEXT) ← NEW
- customer_phone (TEXT) ← NEW
- customer_address (TEXT) ← NEW
- customer_city (TEXT) ← NEW
- customer_state (TEXT) ← NEW
- customer_postcode (TEXT) ← NEW
- customer_country (TEXT) ← NEW
- total_price (DECIMAL)
- status (TEXT)
- peptide_items (JSONB)
- protein_items (JSONB)
- notes (TEXT) ← NEW
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### customers Table (Enhanced)
```sql
- id (UUID)
- email (TEXT)
- first_name (TEXT)
- last_name (TEXT)
- phone (TEXT)
- address (TEXT) ← NEW
- city (TEXT) ← NEW
- state (TEXT) ← NEW
- postcode (TEXT) ← NEW
- country (TEXT) ← NEW
- total_orders (INTEGER) ← NEW (auto-updated)
- total_spent (DECIMAL) ← NEW (auto-updated)
- last_order_date (TIMESTAMPTZ) ← NEW (auto-updated)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### order_notes Table (New)
```sql
- id (UUID)
- order_id (UUID) - References order_references
- note (TEXT)
- created_by (TEXT)
- created_at (TIMESTAMPTZ)
```

## Automatic Features

### Customer Stats Auto-Update
When a new order is created, a database trigger automatically:
- Increments the customer's `total_orders` count
- Adds the order total to `total_spent`
- Updates `last_order_date`
- Fills in shipping address if not already set

### Order Status Tracking
Admins can update order status directly from the dashboard:
- Pending → Paid → Processing → Shipped → Delivered
- Or mark as Cancelled at any stage

## Matching the Protein-Main Style

The admin panel has been designed to match the style from `/public/protein-main/`:
- Clean, minimal design with accent colors
- Card-based layout
- Responsive tables
- Status badges with color coding
- Modal dialogs for detailed views
- Consistent typography and spacing

## Next Steps

### Optional Enhancements
1. **Email notifications** - Send emails when order status changes
2. **Export functionality** - Export orders to CSV
3. **Print packing slips** - Generate printable order documents
4. **Customer management page** - View all customers with order history
5. **Analytics dashboard** - Sales charts and metrics
6. **Bulk actions** - Update multiple orders at once

### Admin Access
To grant admin access to users, you'll need to implement an admin authentication system. For now, the admin panel is accessible at `/admin` for all authenticated users.

## Support

For issues or questions:
- Check Supabase logs in the dashboard
- Verify RLS policies are correctly set
- Ensure all environment variables are configured
- Check browser console for any errors

## Files Modified/Created

1. ✅ `supabase/migrations/20260402_enhanced_customer_orders.sql` - Database schema migration
2. ✅ `src/services/supabaseService.ts` - Updated order creation with customer details
3. ✅ `src/services/proteinCheckout.ts` - Updated to pass full customer information
4. ✅ `src/components/admin/OrderDetailsModal.tsx` - New modal component for order details
5. ✅ `src/pages/AdminDashboard.tsx` - Enhanced with customer details and modal
6. ✅ `SUPABASE_SETUP_INSTRUCTIONS.md` - This setup guide

---

**Last Updated:** April 2, 2026
**Project:** Laminin Peptide Lab E-commerce Platform
