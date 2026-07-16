# LAMININ Overall Improvement Plan - 2026-07-03

This is the master plan for improving the whole project after reviewing this codebase, the existing audit docs, and the 25 open-source ecommerce repos previously found.

Important note: the external repo pass reviewed public repo/package metadata across all 25 and used the strongest architectural patterns. It was not a full line-by-line audit of every external repository.

## Current project summary

This project is already a serious Vite + React + TypeScript + Supabase ecommerce app. It has:

- public storefront
- product pages
- cart and checkout
- bank transfer payment flow
- admin dashboard
- payment tracking
- customer records
- discounts
- emails and SMS-related Edge Functions
- Supabase migrations
- first-party analytics event collection
- Vitest and Playwright tooling

The main issue is not missing features. The main issue is that too much logic has grown inside large files and client-side flows.

## Biggest current risks

| Area | Risk | Why it matters |
|---|---|---|
| Checkout | Mostly client-driven totals/order data | Browser totals and cart data should not be trusted as final truth |
| Orders | `payment_tracking` is doing too much | Orders, payments, items, status history, and audit logs should be separate concepts |
| Code size | Many files over 500 lines | Harder to test, change, and debug |
| Supabase service layer | `src/services/supabaseService.ts` is 1775 lines | Too many responsibilities in one file |
| Admin | Admin pages are large and mixed | UI, queries, transforms, filters, and mutations should be separated |
| Analytics | Collection exists, dashboard does not | Events are useful only once admin can read summaries |
| Payment provider | Bank transfer only | This may be correct for this industry, but the backend should still support payment attempts/events |
| Git | This folder is not a git repo | Rollback, diffs, and safe refactors are weaker |

## What the external ecommerce repos showed

| Repo | Useful pattern to borrow |
|---|---|
| [MarcosCamara01/ecommerce-template](https://github.com/MarcosCamara01/ecommerce-template) | Typed DB layer, Stripe, React Query, Vercel analytics/speed insights, clean scripts |
| [clonglam/HiyoRi-Ecommerce-Nextjs-Supabase](https://github.com/clonglam/HiyoRi-Ecommerce-Nextjs-Supabase) | Drizzle + Supabase, typed schema/codegen, admin tables, Stripe |
| [taiwo-adewale/ecommerce-admin](https://github.com/taiwo-adewale/ecommerce-admin) | Dedicated admin app patterns, TanStack Query/Table, charts |
| [pooranjoyb/popShop](https://github.com/pooranjoyb/popShop) | React/Vite admin + storefront pattern, forms, charts |
| [lyes-mersel/megashop](https://github.com/lyes-mersel/megashop) | Large ecommerce module separation, product/admin concepts |
| [talha5978/ecommerce-rr7-supabase](https://github.com/talha5978/ecommerce-rr7-supabase) | Separate admin/front apps, shared package direction |
| [mehrabgholamsamani/Lumiere](https://github.com/mehrabgholamsamani/Lumiere) | Simple Vite + Supabase storefront baseline |
| [aenlco/champions-ecommerce-website](https://github.com/aenlco/champions-ecommerce-website) | Vite + React Router 7 + Supabase + Vercel analytics |
| [kassyke/maison-perle-ecommerce-site](https://github.com/kassyke/maison-perle-ecommerce-site) | Modern Vite/Supabase storefront structure |
| [Aditya-Idnani/Pebble-Ecommerce](https://github.com/Aditya-Idnani/Pebble-Ecommerce) | shadcn/Radix-style reusable UI, React Query, Zustand |
| [alexovask/celulares-ecommerce](https://github.com/alexovask/celulares-ecommerce) | Product variants, React Query, Zustand, admin/catalog patterns |
| [Victorralp/nigeria-ecommerce-platform](https://github.com/Victorralp/nigeria-ecommerce-platform) | Payment provider flow with Paystack, Supabase, React Query |
| [AndreNicolasCordeiro/Ecommerce-anc-store](https://github.com/AndreNicolasCordeiro/Ecommerce-anc-store) | Stripe scripts/webhook mindset |
| [bhattrajat/tonyschocolonely](https://github.com/bhattrajat/tonyschocolonely) | Stripe + Supabase helper pattern |
| [Cassius202/ecommerce-site](https://github.com/Cassius202/ecommerce-site) | Supabase SSR, Resend/email, lightweight store state |
| [Sajib-Bhattacharjee/fullstack-ecommerce-react-supabase](https://github.com/Sajib-Bhattacharjee/fullstack-ecommerce-react-supabase) | Simple React Router 7 + Supabase ecommerce baseline |
| [nishant0820/Ved-Stationary-Ecommerce-WebApp](https://github.com/nishant0820/Ved-Stationary-Ecommerce-WebApp) | Vite + Supabase + PWA direction |
| [totolr/boutique-pleinelulu](https://github.com/totolr/boutique-pleinelulu) | Stripe + Resend + Supabase minimal stack |
| [comsianabrar/eshop-react-supabase-stripe](https://github.com/comsianabrar/eshop-react-supabase-stripe) | React/Supabase/Stripe example flow |
| [akshay0611/tanjore-degree-coffee](https://github.com/akshay0611/tanjore-degree-coffee) | Supabase + email + polished commerce UI |
| [pramit-marattha/SupabaseEcommerce](https://github.com/pramit-marattha/SupabaseEcommerce) | Older Supabase/Prisma ecommerce reference |
| [fabiodelllima/terraviva-ecommerce-fullstack](https://github.com/fabiodelllima/terraviva-ecommerce-fullstack) | Full-stack ecommerce direction, useful conceptually |
| [jorgegauna-dev/NextGen-Depot-Full-Stack-Ecommerce-Demo](https://github.com/jorgegauna-dev/NextGen-Depot-Full-Stack-Ecommerce-Demo) | Persisted order/order item direction |
| [DanielAR27/biskoto-ecommerce](https://github.com/DanielAR27/biskoto-ecommerce) | Admin/checkout/inventory reference |
| [oyousaf/legxcy](https://github.com/oyousaf/legxcy) | Needs deeper manual inspection; no root package detected |

## Best ideas to copy

1. Add a proper typed data layer.
   - Use generated Supabase types first.
   - Consider Drizzle only if the SQL layer keeps growing.

2. Use TanStack Query for admin/storefront data fetching.
   - Replace scattered loading/error state.
   - Add cache invalidation after admin mutations.

3. Normalize order data.
   - Split `orders`, `order_items`, `payments`, `payment_events`, `order_status_history`, `admin_audit_log`.

4. Move checkout writes behind Edge Functions.
   - Browser submits cart/contact details.
   - Server recalculates totals.
   - Server creates the order.
   - Server sends email.

5. Build the analytics dashboard now that event collection exists.
   - checkout abandonment
   - time before abandonment
   - time on site
   - most clicked buttons
   - total clicks
   - top paths
   - visits by hour/day
   - country/region/city where available
   - click heatmap data

6. Split admin into smaller components and hooks.
   - Pages should orchestrate.
   - Hooks should fetch/mutate.
   - Components should render.
   - Services should only talk to Supabase/Edge Functions.

## Recommended architecture

```text
src/
  app/
    routes/
  components/
    admin/
    checkout/
    products/
    analytics/
    ui/
  features/
    orders/
      api.ts
      hooks.ts
      types.ts
      components/
    checkout/
      api.ts
      hooks.ts
      validation.ts
      components/
    products/
    customers/
    discounts/
    analytics/
  lib/
    supabase.ts
    analytics.ts
    logger.ts
  types/
    database.ts
    order.ts
    product.ts
```

Do not move everything at once. Move one feature at a time.

## Database target model

Minimum improved ecommerce schema:

```text
orders
order_items
payments
payment_attempts
payment_events
order_status_history
admin_audit_log
analytics_events
inventory
product_variants
discount_redemptions
```

Main rule: keep customer-visible order snapshots. Do not rebuild old orders from changed product rows.

## Phase plan

### Phase 0 - Stabilise

- Turn this folder into a git repo or move it into one.
- Deploy the analytics migration and `analytics-event` Edge Function.
- Add/update `.env.example`.
- Confirm all public/private env vars.
- Add a short `LOCAL_SETUP.md`.
- Keep `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test -- --run` green.

### Phase 1 - Analytics admin dashboard

Build `AdminAnalytics`.

Reports:

- checkout abandonment count/rate
- average time before checkout abandonment
- checkout funnel: start → submit → success/error
- total clicks
- most clicked buttons/links
- time on site/page
- visits by hour/day
- traffic by country/region/city when headers exist
- top referrers
- heatmap export by page

Add SQL views or RPCs so the frontend is not doing heavy aggregation.

### Phase 2 - Refactor the huge frontend files

Split first:

- `src/services/supabaseService.ts`
- `src/pages/Checkout.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/components/admin/ProductEditor.tsx`
- `src/pages/AdminDiscounts.tsx`
- `src/pages/AdminEmails.tsx`
- `src/pages/AdminProducts.tsx`
- `src/components/admin/OrderDetailsModal.tsx`
- `src/pages/AdminCustomers.tsx`
- `src/pages/AdminInventory.tsx`
- `src/pages/ProductPage.tsx`

Target file size: under 350 lines where practical. Over 500 lines should be temporary only.

### Phase 3 - Backend checkout

Create Edge Function:

```text
create-order
```

It should:

- validate cart items
- fetch live product/variant prices
- re-apply discount rules
- calculate shipping/tax server-side
- create order rows
- create order item rows
- create initial payment attempt
- send confirmation email
- return order reference

The browser should never be the final authority for totals.

### Phase 4 - Payment system

For this industry, keep bank transfer as the safest default unless a compliant payment provider is confirmed.

Still build the backend like a real payment system:

- `payments`
- `payment_attempts`
- `payment_events`
- admin mark-paid flow
- audit trail
- webhook-ready structure

If adding Stripe/other provider later:

- create checkout session server-side
- store provider session/payment IDs
- verify webhook signatures
- never expose provider secret keys
- update orders only from trusted server/webhook code

### Phase 5 - Admin operating system

Improve admin into a real operations panel:

- order timeline
- internal notes
- status history
- audit log
- resend email
- export CSV
- filters and saved views
- customer detail page
- inventory alerts
- product variant editor
- discount usage reports

### Phase 6 - Product/catalog improvements

- Make product variants first-class.
- Move hardcoded product content into Supabase where safe.
- Keep SEO-critical content renderable.
- Add product status: draft, active, hidden, archived.
- Add COA/document management.
- Add related products and collections from DB.

### Phase 7 - Performance, SEO, accessibility

- Add image `srcset`/WebP/AVIF support.
- Add route-level lazy loading where useful.
- Add Lighthouse budget checks.
- Add sitemap verification.
- Improve modal focus trapping and ESC close behavior.
- Add mobile checkout regression tests.

### Phase 8 - Testing and CI

Add tests for:

- checkout validation
- server total calculation
- discount edge cases
- analytics event insert
- admin auth rejection
- order status transitions
- payment mark-paid flow
- product editor save flow

Add Playwright smoke tests:

- browse product
- add to cart
- checkout validation failure
- bank transfer order success
- admin non-admin blocked
- admin order visible

### Phase 9 - Observability and logging

Keep the new analytics event system, then add:

- frontend logger wrapper
- Edge Function structured logs
- admin error log viewer
- order/payment audit logs
- failed email/SMS tracking
- deploy/build check notes

## First 10 tasks to do next

1. Deploy analytics migration and function.
2. Add `AdminAnalytics` page.
3. Split `supabaseService.ts` into focused services.
4. Split `Checkout.tsx` into hooks/components/validation.
5. Add `create-order` Edge Function.
6. Add `orders` and `order_items` tables while keeping legacy compatibility.
7. Move server-side total calculation into Edge Function or RPC.
8. Add `payment_attempts` and `payment_events`.
9. Add admin audit log for payment/status changes.
10. Add Playwright checkout smoke test.

## Short recommendation

The best path is not a full rewrite. Keep Vite + React + Supabase, but make the backend authoritative and split the frontend into feature modules.

The first real improvement sprint should be:

1. analytics dashboard
2. checkout refactor
3. backend `create-order`
4. normalized orders/order_items
5. admin order timeline/audit log

