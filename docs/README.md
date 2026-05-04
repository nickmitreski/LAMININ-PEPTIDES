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

## SQL Reference & Templates

27 ad-hoc SQL scripts (setup, migrations, debugging) plus a comprehensive index. Useful as a template for future Supabase projects.

See [`sql-reference/README.md`](sql-reference/README.md) for the full index covering:
- Database architecture (tables, RPC functions, security model)
- Setup script run order for new projects
- Production migration reference
- Maintenance and debugging scripts

## Admin

- [Admin quick reference](admin/ADMIN-QUICK-REFERENCE.md) -- current admin dashboard guide

Deprecated admin docs moved to [`archive/admin/`](archive/admin/).

## Quality

- [COA PDF coverage](quality/COA-COVERAGE.md) -- mapped peptides vs catalogue, `npm run verify:coa`

## Archive

Historical session notes, change logs, and deprecated documentation:

- [`archive/`](archive/) -- 7 session summaries and change logs
- [`archive/admin/`](archive/admin/) -- 7 deprecated admin docs (superseded by ADMIN-QUICK-REFERENCE)
- [`archive/partner/`](archive/partner/) -- 13 deprecated CoreForge partner integration docs (removed April 2026)
