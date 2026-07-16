# LAMININ Project Audit and Research - 2026-07-02

## What changed in this pass

- Added Supabase-backed analytics collection:
  - `analytics_events` table migration.
  - `analytics-event` Supabase Edge Function.
  - frontend page/click/time/checkout tracker.
- Tracks:
  - page visits and page leave duration
  - time on site/page
  - checkout start, submit, validation failure, success, error, abandonment
  - button/link/form-control clicks
  - total click events
  - click coordinates for heatmap-style reporting
  - scroll depth
  - viewport size
  - referrer
  - coarse country/region/city headers when available
- Fixed existing TypeScript errors in:
  - `src/pages/AdminPaymentTracking.tsx`
  - `src/services/emailService.ts`
  - `src/services/supabaseService.test.ts`
- Ran safe dependency audit fix.

## Verification

- `npm run typecheck` passed.
- `npm run build` passed.
- `npm test -- --run` passed: 9 files, 55 tests.
- `npm audit --omit=dev` passed: 0 production vulnerabilities.

Remaining audit note: dev-only Vite/esbuild advisory remains unless doing a breaking Vite upgrade. Do not expose `npm run dev` to the public internet.

## Analytics notes

The new analytics setup is first-party and simple. It does not do real eye tracking. The heatmap data is based on clicks, scroll depth, viewport size, and page path.

For Australian/local traffic, the Edge Function stores whatever geo headers the host provides:

- `cf-ipcountry`
- `x-vercel-ip-country`
- `x-vercel-ip-country-region`
- `x-vercel-ip-city`
- similar proxy headers if present

If those headers are empty in production, add a tiny Vercel proxy endpoint later so Vercel Geo can enrich analytics before forwarding to Supabase.

## High-priority project issues

1. `src/services/supabaseService.ts` is 1775 lines. Split into orders, customers, products, collections, payments, images, and research services.
2. Several admin pages are too large:
   - `src/pages/AdminDashboard.tsx` - 1288 lines
   - `src/components/admin/ProductEditor.tsx` - 1023 lines
   - `src/pages/AdminDiscounts.tsx` - 906 lines
   - `src/pages/AdminEmails.tsx` - 769 lines
   - `src/pages/Checkout.tsx` - 747 lines
   - `src/pages/AdminProducts.tsx` - 688 lines
   - `src/components/admin/OrderDetailsModal.tsx` - 646 lines
   - `src/pages/AdminCustomers.tsx` - 645 lines
   - `src/pages/AdminInventory.tsx` - 599 lines
   - `src/pages/ProductPage.tsx` - 537 lines
3. Edge functions are also too large:
   - `secure-checkout-init` - 627 lines
   - `send-order-email` - 511 lines
4. Checkout is still mostly client-driven. Best backend fix is to move order creation fully behind an Edge Function.
5. `verify_jwt = false` is used on public Edge Functions. That is fine for public endpoints only if each function has its own validation/rate limit.
6. Current payment flow is bank transfer/manual. For a stronger payment system, add a provider-backed `payments` table and webhook flow.
7. Admin auth correctly uses Supabase `app_metadata.admin`, not a public email allowlist.
8. Analytics needs an admin dashboard page to aggregate the new events.
9. This folder is not currently a git repo, so change tracking/rollback is weaker than it should be.

## Suggested refactor plan

1. Split `supabaseService.ts`:
   - `services/ordersService.ts`
   - `services/customerService.ts`
   - `services/productService.ts`
   - `services/paymentService.ts`
   - `services/collectionsService.ts`
   - `services/researchService.ts`
2. Split `Checkout.tsx`:
   - `checkout/types.ts`
   - `checkout/checkoutValidation.ts`
   - `checkout/useCheckoutForm.ts`
   - `checkout/CheckoutContactForm.tsx`
   - `checkout/CheckoutAddressForm.tsx`
   - `checkout/CheckoutDiscountBox.tsx`
3. Split admin pages into table, filters, cards, modals, hooks.
4. Move all direct `payment_tracking` writes to Edge Functions.
5. Add an `AdminAnalytics` page with:
   - checkout abandonment rate
   - average time before abandonment
   - most clicked buttons
   - total clicks
   - top paths
   - traffic by country/region/city
   - visits by hour/day
   - heatmap export data
6. Add Playwright smoke tests for:
   - browse product
   - add to cart
   - cart to checkout
   - checkout validation errors
   - successful bank-transfer order
   - admin login blocked when not admin

## Payment research direction

For peptide/research-chemical style sites, many public repos are simple static storefronts and do not reveal strong payment handling. The useful pattern is not "copy a peptide site"; it is:

- keep product/catalog public
- create order server-side
- store order items normalized
- use a payment provider webhook or manual bank transfer confirmation
- keep payment secrets server-side only
- never trust browser totals
- use admin audit logs for status changes

For this project, the next payment architecture should be:

- `orders`
- `order_items`
- `payments`
- `payment_events`
- `payment_attempts`
- `admin_audit_log`
- Edge Function: `create-order`
- Edge Function: `payment-webhook`
- Edge Function: `mark-bank-transfer-paid`

## Open-source Supabase ecommerce repos

Useful research list from GitHub API searches:

- [MarcosCamara01/ecommerce-template](https://github.com/MarcosCamara01/ecommerce-template) - Next.js ecommerce, Supabase, Stripe.
- [clonglam/HiyoRi-Ecommerce-Nextjs-Supabase](https://github.com/clonglam/HiyoRi-Ecommerce-Nextjs-Supabase) - Next.js 14, CMS, Supabase, Drizzle.
- [taiwo-adewale/ecommerce-admin](https://github.com/taiwo-adewale/ecommerce-admin) - admin dashboard, Next.js, Supabase.
- [lyes-mersel/megashop](https://github.com/lyes-mersel/megashop) - multi-vendor ecommerce, analytics, admin.
- [pooranjoyb/popShop](https://github.com/pooranjoyb/popShop) - React TS ecommerce with admin and Supabase.
- [pramit-marattha/SupabaseEcommerce](https://github.com/pramit-marattha/SupabaseEcommerce) - Supabase ecommerce.
- [talha5978/ecommerce-rr7-supabase](https://github.com/talha5978/ecommerce-rr7-supabase) - React Router, inventory, payment, Supabase.
- [mehrabgholamsamani/Lumiere](https://github.com/mehrabgholamsamani/Lumiere) - React, TypeScript, Supabase, RLS.
- [Sajib-Bhattacharjee/fullstack-ecommerce-react-supabase](https://github.com/Sajib-Bhattacharjee/fullstack-ecommerce-react-supabase) - React TS, COD, admin, email.
- [nishant0820/Ved-Stationary-Ecommerce-WebApp](https://github.com/nishant0820/Ved-Stationary-Ecommerce-WebApp) - Vite, React, Supabase, Razorpay.
- [aenlco/champions-ecommerce-website](https://github.com/aenlco/champions-ecommerce-website) - Vite, React, Supabase, Stripe.
- [kassyke/maison-perle-ecommerce-site](https://github.com/kassyke/maison-perle-ecommerce-site) - React Vite, Supabase, Stripe.
- [Aditya-Idnani/Pebble-Ecommerce](https://github.com/Aditya-Idnani/Pebble-Ecommerce) - marketplace, React Vite, Supabase.
- [alexovask/celulares-ecommerce](https://github.com/alexovask/celulares-ecommerce) - variants, checkout, order management.
- [Victorralp/nigeria-ecommerce-platform](https://github.com/Victorralp/nigeria-ecommerce-platform) - Paystack, SMS, admin, Supabase.
- [jorgegauna-dev/NextGen-Depot-Full-Stack-Ecommerce-Demo](https://github.com/jorgegauna-dev/NextGen-Depot-Full-Stack-Ecommerce-Demo) - persisted orders/order items.
- [DanielAR27/biskoto-ecommerce](https://github.com/DanielAR27/biskoto-ecommerce) - admin, checkout, inventory.
- [Cassius202/ecommerce-site](https://github.com/Cassius202/ecommerce-site) - Next.js, Supabase, Paystack.
- [AndreNicolasCordeiro/Ecommerce-anc-store](https://github.com/AndreNicolasCordeiro/Ecommerce-anc-store) - Next.js, Supabase, Stripe, webhooks.
- [bhattrajat/tonyschocolonely](https://github.com/bhattrajat/tonyschocolonely) - Next.js, Supabase, Stripe.
- [akshay0611/tanjore-degree-coffee](https://github.com/akshay0611/tanjore-degree-coffee) - Next.js, Supabase ecommerce.
- [comsianabrar/eshop-react-supabase-stripe](https://github.com/comsianabrar/eshop-react-supabase-stripe) - Supabase + Stripe.
- [kiyo022/ecommerce-app](https://github.com/kiyo022/ecommerce-app) - React, Supabase, Stripe.
- [totolr/boutique-pleinelulu](https://github.com/totolr/boutique-pleinelulu) - React, Stripe Checkout, Supabase.
- [fabiodelllima/terraviva-ecommerce-fullstack](https://github.com/fabiodelllima/terraviva-ecommerce-fullstack) - Stripe, PostgreSQL, Supabase storage.

## Peptide website GitHub repos found

Many are static or small, but useful for market/design/payment research:

- [dotkaio/peptide](https://github.com/dotkaio/peptide) - selling peptides website.
- [ResearchlabEU/PeptideWebsite](https://github.com/ResearchlabEU/PeptideWebsite)
- [AGCol1/PeptidePlug](https://github.com/AGCol1/PeptidePlug)
- [JuanBPS/directpeptides-mock](https://github.com/JuanBPS/directpeptides-mock)
- [EminenceHairBoutique/Noir-Peptides](https://github.com/EminenceHairBoutique/Noir-Peptides)
- [thecompoundpeptides/compound-website](https://github.com/thecompoundpeptides/compound-website)
- [NaturesBleszn/PeptideWatch](https://github.com/NaturesBleszn/PeptideWatch)
- [nicrami77-ai/RAMpeptides](https://github.com/nicrami77-ai/RAMpeptides)
- [Salo12313/catalyx-website](https://github.com/Salo12313/catalyx-website)
- [redyinn/PeptideDB](https://github.com/redyinn/PeptideDB)
- [carolina502/peptides-australia](https://github.com/carolina502/peptides-australia)
- [geraldcracknell21-coder/nextgen-site](https://github.com/geraldcracknell21-coder/nextgen-site)
- [alexdji733/Elite-Peptides](https://github.com/alexdji733/Elite-Peptides)
- [arcthaneaidelta/Peptide-Website](https://github.com/arcthaneaidelta/Peptide-Website)
- [advisorysolana-bit/peptides-website](https://github.com/advisorysolana-bit/peptides-website)
- [braindvts/peptide-websites](https://github.com/braindvts/peptide-websites)
- [Silkwormx/Vista-Peptides-website](https://github.com/Silkwormx/Vista-Peptides-website)
- [IbrahimBAko/Peptide-Website](https://github.com/IbrahimBAko/Peptide-Website)
- [towerdog03/Peptide-website](https://github.com/towerdog03/Peptide-website)
- [encapsulserum-hash/Peptide-website-](https://github.com/encapsulserum-hash/Peptide-website-)
- [Pu11en/peptide-website](https://github.com/Pu11en/peptide-website)
- [abhicloses7838/vailchem-website-v2](https://github.com/abhicloses7838/vailchem-website-v2)
- [faizulki/peptide-website](https://github.com/faizulki/peptide-website)
- [litonsarker369/Peptide-Brand-Website-Homepage](https://github.com/litonsarker369/Peptide-Brand-Website-Homepage)
- [DevKafiluddin/Peptide-Brand-Website-Homepage](https://github.com/DevKafiluddin/Peptide-Brand-Website-Homepage)

## Source searches used

- GitHub API: `react supabase ecommerce`
- GitHub API: `nextjs supabase ecommerce`
- GitHub API: `vite supabase ecommerce`
- GitHub API: `peptide website`
