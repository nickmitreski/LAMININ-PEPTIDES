# SQL Reference & Templates

This directory contains ad-hoc SQL scripts used during development of the Laminin Peptide Lab database. They serve as **reference templates** for setting up similar Supabase-backed e-commerce projects.

> **Production migrations** live in `/supabase/migrations/` with proper timestamps. These scripts are reference copies — do NOT run them on a production database without reviewing them first.

---

## Database Architecture Overview

**Platform:** Supabase (PostgreSQL + Auth + Edge Functions + Storage)

### Core Tables

| Table | Purpose |
|-------|---------|
| `customers` | Customer records (email, name, address, order stats) |
| `payment_tracking` | Order records with status, amounts, payment method |
| `order_references` | Legacy order reference table |
| `order_notes` | Admin notes attached to orders |
| `product_mappings` | Product catalog (name, description, pricing, images) |
| `product_images` | Product image gallery (multiple images per product) |
| `discount_codes` | Discount/promo code system |
| `email_templates` | Email template storage |
| `email_logs` | Sent email audit trail |
| `inventory_transactions` | Stock movement history |
| `checkout_secure_sessions` | Encrypted checkout session data |

### Key RPC Functions

| Function | Purpose |
|----------|---------|
| `delete_customer_and_orders(email)` | Cascade delete customer + all orders |
| `delete_order(order_id)` | Delete single order + notes |
| `jwt_is_admin()` | Check if current JWT has admin role |
| `upsert_product_mapping(...)` | Create/update product catalog entry |
| `update_stock_quantity(...)` | Adjust inventory with transaction log |

### Security Model

- **RLS (Row Level Security)** enabled on all tables
- **Admin functions** use `SECURITY DEFINER` with `jwt_is_admin()` guard
- **Anon access** restricted to read-only on public-facing data
- **Auth** via Supabase Auth with `app_metadata.admin = true` for admin users

---

## Script Index

### Setup Scripts (run in order for new project)

| File | Purpose | Run Order |
|------|---------|-----------|
| `COMPLETE_INVENTORY_SETUP.sql` | Full inventory system (tables, RLS, RPC functions) | 1 |
| `EMAIL_STEP1_TABLES.sql` | Email system tables | 2a |
| `EMAIL_STEP2_RLS_INDEXES.sql` | Email RLS policies and indexes | 2b |
| `EMAIL_STEP3_FUNCTIONS.sql` | Email RPC functions | 2c |
| `EMAIL_STEP4_SEED.sql` | Default email templates | 2d |
| `PRODUCT_EDITOR_SETUP.sql` | Product editor (combined script) | 3 |
| `ADMIN_DELETE_CUSTOMER.sql` | Customer deletion RPC function | 4 |
| `SETUP_RPC_FUNCTIONS_FIXED.sql` | Inventory management RPCs (latest) | 5 |

### Multi-Part Scripts (alternative to combined scripts)

| File | Purpose |
|------|---------|
| `PRODUCT_EDITOR_PART1.sql` | Add columns to product_mappings |
| `PRODUCT_EDITOR_PART2_FIXED.sql` | Create product_images table |
| `PRODUCT_EDITOR_PART3.sql` | RLS policies for product editor |
| `PRODUCT_EDITOR_PART4.sql` | RPC functions part 1 |
| `PRODUCT_EDITOR_PART5_FINAL.sql` | RPC functions part 2 (use this version) |

### Maintenance & Debugging

| File | Purpose |
|------|---------|
| `BACKEND_AUDIT.sql` | Full backend health check (tables, RLS, functions, indexes) |
| `CHECK_TABLE_STRUCTURE.sql` | Quick table column inspection |
| `CLEANUP_FUNCTIONS.sql` | Remove duplicate function signatures |
| `DROP_OLD_FUNCTIONS.sql` | Drop old function versions |
| `FORCE_DROP_FUNCTIONS.sql` | Force-drop all function versions (use before recreation) |
| `DROP_AND_CREATE_FUNCTIONS.sql` | Combined drop + recreate |

### One-Off / Duplicate Scripts

| File | Purpose | Notes |
|------|---------|-------|
| `EMAIL_SYSTEM_SETUP.sql` | Combined email setup | Use STEP1-4 instead |
| `FINAL_INVENTORY_SETUP.sql` | Corrected column names version | Superseded by COMPLETE_INVENTORY_SETUP |
| `CREATE_FUNCTIONS.sql` | Inventory RPCs | Superseded by SETUP_RPC_FUNCTIONS_FIXED |
| `SETUP_RPC_FUNCTIONS.sql` | Original RPC setup | Use _FIXED version |
| `RUN_THIS_SQL.sql` | Copy of ADMIN_DELETE_CUSTOMER | Duplicate |
| `PRODUCT_EDITOR_PART2.sql` | Original part 2 | Use _FIXED version |
| `PRODUCT_EDITOR_PART5.sql` | Original part 5 | Use _FINAL version |
| `PRODUCT_EDITOR_PART5_FIXED.sql` | Intermediate fix | Use _FINAL version |

---

## Production Migrations

Located in `/supabase/migrations/` (run automatically by Supabase CLI):

| Migration | Purpose |
|-----------|---------|
| `20260401_initial_customers_and_orders` | Base schema: customers, order_references, order_notes |
| `20260402_enhanced_customer_orders` | Add order stats, address fields |
| `20260403_security_linter_hardening` | RLS tightening, SQL injection prevention |
| `20260403_checkout_secure_sessions` | Encrypted checkout session table |
| `20260404_checkout_session_contact_audit` | Audit trail for checkout sessions |
| `20260405_jwt_is_admin_robust` | Robust admin JWT validation |
| `20260406_partner_pay_link_sms_tracking` | Partner payment link + SMS tracking |
| `20260407_customers_anon_update_for_upsert` | Allow anon upsert on customers |
| `20260408_discount_codes` | Discount code system |
| `20260408_discount_rpc_execute_grants` | Execute grants for discount RPCs |
| `20260409_security_audit_fixes` | Security hardening (revoke anon access) |
| `20260409_product_management_enhancements` | Product editor schema additions |
| `20260410_payment_tracking_fixes` | Payment tracking table fixes |

---

## Using as a Template

To reuse this database architecture for a new project:

1. Copy `/supabase/schema.sql` as your starting schema
2. Run the setup scripts in order (see Setup Scripts above)
3. Configure Supabase Auth with admin user (`app_metadata.admin = true`)
4. Set up Edge Functions for email delivery (Resend) and SMS (Twilio)
5. Configure RLS policies to match your access patterns
6. Run `BACKEND_AUDIT.sql` to verify everything is working
