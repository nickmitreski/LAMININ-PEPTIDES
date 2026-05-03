# Documentation Index

Guides are grouped by topic. Prefer editing here rather than scattering new markdown at the repo root.

---

## Current Architecture

**Stack:** React 18 + Vite + TypeScript frontend deployed to Vercel. Supabase cloud backend (PostgreSQL, Edge Functions, Auth, Storage).

**Key database tables:** `payment_tracking` (canonical orders), `product_mappings`, `customers`, `discount_codes`, `email_logs`, `sms_logs`, `inventory_transactions`, `product_images`.

**Edge Functions:** `send-order-email`, `notify-payment-received`, `secure-checkout-init`, `chat`, `send-contact-message`, `partner-payment-ready`, `twilio-status-callback`.

**Admin dashboard** (7 pages behind Supabase Auth): Orders, Products, Inventory, Discounts, Customers, Emails, Tools. Admin operations guarded by `jwt_is_admin()` and RLS policies.

**Deployment flow:** Push to GitHub main branch triggers Vercel build. Supabase edge functions deploy via `supabase functions deploy`. Secrets managed through Vercel environment variables and Supabase dashboard.

---

## Deployment

- [Deployment checklist](deployment/DEPLOYMENT-CHECKLIST.md)
- [Secrets checklist](deployment/SECRETS_CHECKLIST.md)
- [Quick start (historic)](deployment/QUICK_START.md)
- [Chatbot deployment](deployment/CHATBOT_DEPLOYMENT.md)
- [Twilio WhatsApp order alerts](deployment/TWILIO-WHATSAPP-ORDERS.md) -- notify your phone when a customer places an order

## Supabase

- [Supabase setup](supabase/SUPABASE-SETUP.md)
- [Supabase integration](supabase/SUPABASE-INTEGRATION.md)
- [Dashboard setup](supabase/SUPABASE_DASHBOARD_SETUP.md)
- [Setup instructions](supabase/SUPABASE_SETUP_INSTRUCTIONS.md)
- [Database setup](supabase/DATABASE-SETUP-COMPLETE.md)
- [Apply migration](supabase/APPLY_MIGRATION_NOW.md)

## Admin / Product Tooling

8 files covering admin dashboard features, navigation, product editing, and backend implementation.

See files in [`admin/`](admin/):

- [Admin navigation](admin/ADMIN_NAVIGATION_COMPLETE.md)
- [Admin panel features](admin/ADMIN_PANEL_FEATURES.md)
- [Admin quick reference](admin/ADMIN-QUICK-REFERENCE.md)
- [Admin system complete](admin/ADMIN-SYSTEM-COMPLETE.md)
- [Admin system guide](admin/ADMIN-SYSTEM-GUIDE.md)
- [Backend admin implementation](admin/BACKEND_ADMIN_IMPLEMENTATION.md)
- [Dashboard improvements and product editing](admin/DASHBOARD_IMPROVEMENTS_AND_PRODUCT_EDITING.md)
- [Product editor guide](admin/PRODUCT_EDITOR_GUIDE.md)

## Partner / Legacy

**Legacy -- CoreForge partner integration has been removed. These docs are kept for historical reference only.**

13 files of historical partner and CoreForge-related notes live in [`partner/`](partner/). These cover the former embedded checkout, payment link, and white-label referral flows that are no longer active.

## Archive

7 session summaries and change logs in [`archive/`](archive/):

- [Complete summary](archive/COMPLETE_SUMMARY.md)
- [CoreForge features removed](archive/COREFORGE_FEATURES_REMOVED.md)
- [Fixes applied](archive/FIXES-APPLIED.md)
- [Implementation complete](archive/IMPLEMENTATION_COMPLETE.md)
- [Inventory system updated](archive/INVENTORY_SYSTEM_UPDATED.md)
- [Restore to CoreForge version](archive/RESTORE_TO_COREFORGE_VERSION.md)
- [Testing inventory system](archive/TESTING_INVENTORY_SYSTEM.md)

## Quality

- [COA PDF coverage](quality/COA-COVERAGE.md) -- mapped peptides vs catalogue, `npm run verify:coa`
