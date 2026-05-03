# Admin Dashboard - Quick Reference

## Access

**URL:** `/admin/login`

**Auth:** Supabase email/password login. The user must have `app_metadata.admin = true` set in Supabase Authentication. To grant admin access, go to **Supabase Dashboard > Authentication > Users**, select the user, and add `{ "admin": true }` to their **App metadata**.

All admin operations are gated by `jwt_is_admin()` on the backend.

---

## Admin Pages

### Orders (`/admin/dashboard`)

Unified order and payment tracking. Displays all orders from the `payment_tracking` table with search, filters, and real-time stats. Status lifecycle: **pending > viewed > paid > processing > shipped > delivered > cancelled**. Marking an order as "paid" triggers an SMS notification to the customer via Twilio. Each order's detail view includes a reconstitution guide showing mixing instructions for the ordered peptides.

### Products (`/admin/products`)

Full product CRUD: add, edit, and delete products. Supports sale pricing via `compare_at_price` and `sale_label` fields. Includes search and bulk toggle for active/inactive status. Product images are stored in the Supabase Storage bucket `product-images`.

### Inventory (`/admin/inventory`)

Stock level management using the `adjust_inventory` RPC. All stock changes are recorded in an audit trail via the `inventory_transactions` table.

### Discounts (`/admin/discounts`)

Create, edit, and delete discount codes. Tracks redemption counts and history for each code.

### Customers (`/admin/customers`)

Auto-populated from checkout data. View customer details and their complete order history.

### Emails (`/admin/emails`)

View email delivery logs and edit email templates used for order communications.

### Tools (`/admin/tools`)

Provides a shareable link to the reconstitution calculator for customers.

---

## Common Tasks

### Adding a Product

1. Go to `/admin/products` and click **Add Product**.
2. Fill in product details (name, description, price, category).
3. To show a sale price, set `compare_at_price` (the original/crossed-out price) and optionally a `sale_label` (e.g. "20% OFF").
4. Upload a product image (stored in the `product-images` bucket).
5. Save. Toggle active/inactive to control storefront visibility.

### Editing or Deleting a Product

- Click a product row to open the edit form. Make changes and save.
- To delete, open the product and use the delete action. This removes it from the storefront.

### Managing Orders

1. Go to `/admin/dashboard` to see all orders.
2. Use search to find orders by order ID, customer email, or name.
3. Filter by status to focus on specific stages.
4. Click an order to view full details, including a reconstitution guide for the ordered products.
5. Update the order status using the status dropdown. The full lifecycle is: **pending > viewed > paid > processing > shipped > delivered > cancelled**.
6. When you mark an order as **paid**, an SMS is automatically sent to the customer via Twilio.

### Creating Discount Codes

1. Go to `/admin/discounts` and click **Add Discount**.
2. Set the code, discount type (percentage or fixed), and value.
3. Save. The code is immediately available for customers at checkout.
4. Monitor redemption counts from the discounts list.

### Using the Tools Page

Go to `/admin/tools` to get a shareable link to the reconstitution calculator. Copy and send this link to customers who need mixing guidance.

### Reconstitution Guide in Order Details

When viewing an order's detail panel, a reconstitution guide section shows the recommended mixing instructions (BAC water volume, resulting concentration) for each peptide in that order. This helps when advising customers on product preparation.

---

## Security

- All admin routes are protected. Unauthenticated users are redirected to `/admin/login`.
- Backend operations require `jwt_is_admin()` -- only users with `app_metadata.admin = true` in Supabase can perform admin actions.
- The `VITE_ADMIN_EMAIL_ALLOWLIST` env var is no longer used. Admin access is controlled exclusively through Supabase `app_metadata`.

---

## Troubleshooting

**Cannot log in:** Verify the user exists in Supabase Authentication and has `{ "admin": true }` in App metadata.

**Orders not loading:** Check Supabase connection settings in `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Verify the `payment_tracking` table exists.

**SMS not sending on mark-as-paid:** Confirm Twilio secrets are set in Supabase Edge Function Secrets (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`). Check that `MOCK_SMS_DELIVERY` is not set to `true`.

**Product images not displaying:** Verify the `product-images` bucket exists in Supabase Storage and that the image was uploaded successfully.

---

**Last Updated:** May 2026
