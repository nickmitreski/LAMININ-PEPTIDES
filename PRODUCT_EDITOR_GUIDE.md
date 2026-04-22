# Product Editor Setup & Usage Guide

## Overview

The Product Editor system allows you to manage products directly from the Admin Dashboard, including:
- Edit product names, descriptions, and pricing
- Manage product images (upload, delete, set primary)
- Control inventory tracking and stock levels
- Activate/deactivate products

## Setup Instructions

### Step 1: Run the Database Setup SQL (5 Parts)

The SQL setup has been split into 5 parts to avoid syntax errors. Run each part in order:

**PART 1: Add columns to product_mappings**
1. Open your Supabase Dashboard
2. Go to: https://ytacbvfcltikxzudlkzn.supabase.co/project/ytacbvfcltikxzudlkzn/sql/new
3. Open `PRODUCT_EDITOR_PART1.sql`
4. Copy and paste into SQL Editor
5. Click "Run"
6. Expected: List of columns including description, category, peptide_id, strength

**PART 2: Create product_images table**
1. Open `PRODUCT_EDITOR_PART2.sql`
2. Copy and paste into SQL Editor
3. Click "Run"
4. Expected: List of 10 columns (id, product_id, image_url, etc.)

**PART 3: Create RLS policies**
1. Open `PRODUCT_EDITOR_PART3.sql`
2. Copy and paste into SQL Editor
3. Click "Run"
4. Expected: 4 policies listed for product_images table

**PART 4: Create first 2 RPC functions**
1. Open `PRODUCT_EDITOR_PART4.sql`
2. Copy and paste into SQL Editor
3. Click "Run"
4. Expected: 2 functions (set_primary_product_image, update_product)

**PART 5: Create last 2 RPC functions**
1. Open `PRODUCT_EDITOR_PART5.sql`
2. Copy and paste into SQL Editor
3. Click "Run"
4. Expected: 4 functions total (delete_product_image, get_product_with_images, set_primary_product_image, update_product)

### Step 2: Create Supabase Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Click "New bucket"
3. Bucket name: `product-images`
4. **IMPORTANT:** Toggle "Public bucket" to ON
5. Click "Create bucket"

### Step 3: Set Storage Bucket Policies

After creating the bucket:

1. Click on the `product-images` bucket
2. Go to "Policies" tab
3. Click "New policy"

**Policy 1: Anyone can view images**
- Policy name: `Anyone can view images`
- Allowed operation: SELECT
- Target roles: `public`
- Policy definition: `true`
- Click "Review" → "Save policy"

**Policy 2: Admins can upload images**
- Policy name: `Admins can upload images`
- Allowed operation: INSERT
- Target roles: `authenticated`, `anon`
- Policy definition: `true`
- Click "Review" → "Save policy"

**Policy 3: Admins can delete images**
- Policy name: `Admins can delete images`
- Allowed operation: DELETE
- Target roles: `authenticated`, `anon`
- Policy definition: `true`
- Click "Review" → "Save policy"

### Step 4: Verify Setup

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if product_images table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'product_images'
) as product_images_exists;

-- Check if all functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_product',
    'set_primary_product_image',
    'delete_product_image',
    'get_product_with_images'
  )
ORDER BY routine_name;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'product-images';
```

Expected results:
- `product_images_exists`: true
- 4 functions listed
- 1 bucket with `public = true`

## Using the Product Editor

### Accessing the Product Editor

1. Log in to Admin Dashboard
2. Click "Products" in the navigation header
3. Find the product you want to edit
4. Click the "Edit" button in the Actions column
5. The Product Editor modal will open

### Editing Product Information

**Fields available:**
- **Peptide Name**: The name shown to customers
- **Protein Name**: The protein product name
- **Description**: Detailed product description (supports markdown)
- **Price**: Product price in USD
- **Category**: Product category for organization
- **Status**: Active/Inactive toggle
- **Stock Quantity**: Current inventory count
- **Low Stock Threshold**: Alert when stock falls below this number
- **Track Inventory**: Enable/disable inventory tracking

**To update:**
1. Modify any field
2. Click "Save Changes" button
3. Success notification will appear
4. Modal will close automatically
5. Product list will refresh

### Managing Product Images

#### Upload New Images

1. Click "Product Images" section in editor
2. Either:
   - Click "Choose Files" and select images from your computer
   - Drag and drop image files into the upload area
3. Supported formats: JPG, PNG, WebP
4. Maximum file size: 5MB per image
5. Images are automatically compressed and resized to 1200x1200px

**Upload Progress:**
- You'll see upload progress for each image
- Multiple images can be uploaded at once
- Failed uploads will show error messages

#### Set Primary Image

The primary image is the main product photo shown to customers.

1. Find the image you want to set as primary
2. Click "Set as Primary" button
3. The image will be marked with a "PRIMARY" badge
4. Only one image can be primary at a time

#### Delete Images

1. Click the "Delete" button on any image
2. Confirm the deletion
3. Image will be removed from:
   - Database record
   - Supabase Storage
   - Product display

**Warning:** Image deletion is permanent and cannot be undone.

### Inventory Management

If you enable "Track Inventory":
- Stock quantity will be monitored
- Orders will automatically decrease stock
- Low stock alerts will show when below threshold
- Out of stock products cannot be purchased

If disabled:
- Product always shows as available
- No stock tracking occurs
- Suitable for digital products or made-to-order items

## Troubleshooting

### "Upload failed" Error

**Possible causes:**
1. Storage bucket not created or not public
2. File too large (max 5MB)
3. Invalid file type (only JPG, PNG, WebP)
4. Network connection issue

**Solution:**
- Verify storage bucket is public
- Check file size and format
- Try uploading one image at a time
- Check browser console for detailed error

### "Failed to load product" Error

**Possible causes:**
1. SQL functions not created
2. Database connection issue
3. Product was deleted

**Solution:**
- Re-run PRODUCT_EDITOR_SETUP.sql
- Check Supabase project status
- Refresh the page and try again

### Images not displaying

**Possible causes:**
1. Storage bucket not public
2. RLS policies not set correctly
3. Image was deleted from storage

**Solution:**
- Verify bucket is public in Supabase Dashboard
- Check storage policies allow SELECT
- Re-upload the image

### "Product updated successfully" but changes don't appear

**Possible causes:**
1. Browser cache
2. Product list not refreshing

**Solution:**
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Check if update actually saved in Supabase Dashboard

## Technical Details

### Database Schema

**product_images table:**
```sql
id              UUID PRIMARY KEY
product_id      UUID REFERENCES product_mappings(id)
image_url       TEXT (public URL)
storage_path    TEXT (storage bucket path)
is_primary      BOOLEAN (only one per product)
display_order   INTEGER (for sorting)
file_name       TEXT (original filename)
file_size       INTEGER (bytes)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**product_mappings new columns:**
```sql
description             TEXT
category                TEXT
peptide_id              TEXT
strength                TEXT
stock_quantity          INTEGER
low_stock_threshold     INTEGER
track_inventory         BOOLEAN
```

### RPC Functions

1. **update_product(p_product_id, ...)**
   - Updates product fields
   - Only updates provided (non-null) values
   - Automatically sets updated_at timestamp

2. **get_product_with_images(p_product_id)**
   - Returns product with all images
   - Images sorted by is_primary DESC, display_order ASC
   - Returns JSONB with success/error status

3. **set_primary_product_image(p_image_id, p_product_id)**
   - Unsets all other primary flags
   - Sets specified image as primary
   - Validates image belongs to product

4. **delete_product_image(p_image_id)**
   - Deletes database record
   - Returns storage_path for cleanup
   - Client-side deletes from storage

### Image Processing

**Compression settings:**
- Max width: 1200px
- Max height: 1200px
- Quality: 0.8 (80%)
- Maintains aspect ratio
- Uses HTML Canvas API

**Storage path format:**
```
products/{productId}_{timestamp}.{ext}
```

## Best Practices

1. **Image Guidelines:**
   - Use high-quality product photos
   - Recommended size: 1200x1200px or larger
   - Use consistent lighting and backgrounds
   - Set the best angle as primary image

2. **Product Descriptions:**
   - Be detailed and accurate
   - Include key features and benefits
   - Use clear, professional language
   - Update when product changes

3. **Inventory Tracking:**
   - Enable for physical products with limited stock
   - Set realistic low stock thresholds
   - Disable for digital or unlimited items
   - Monitor and restock proactively

4. **Pricing:**
   - Use consistent decimal places (e.g., $19.99)
   - Update prices during off-peak hours
   - Consider active orders before changing prices

5. **Categories:**
   - Use consistent naming conventions
   - Create meaningful categories
   - Don't create too many categories
   - Group similar products together

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Verify all setup steps were completed correctly
3. Check Supabase Dashboard for database/storage status
4. Review the SQL setup script for any errors
5. Test with a different browser

## Next Steps

Now that the Product Editor is set up:

1. Test editing a product
2. Upload sample product images
3. Try setting primary images
4. Enable inventory tracking on select products
5. Update product descriptions and categories

The system is production-ready and fully functional!
