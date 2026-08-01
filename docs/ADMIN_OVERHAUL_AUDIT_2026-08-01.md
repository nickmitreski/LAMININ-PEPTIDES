# Laminin admin overhaul audit — 2 August 2026

## Outcome

The admin has been reorganised into a modern commerce dashboard with a fixed desktop sidebar, compact mobile header/drawer, grouped navigation, consistent page spacing and a dedicated Certificates area. The product workflow now continues from product creation into images and COA setup.

## Implemented

- Replaced the overcrowded horizontal admin header with responsive grouped navigation.
- Added shared admin page headers and applied the new shell across all admin routes.
- Added `/admin/coas` for certificate coverage, search, missing-COA visibility and history management.
- Added PDF, PNG and JPEG COA uploads with a 10 MB limit, metadata, draft/published/archived states and current-certificate selection.
- Added image and COA setup as a first-class product editor tab.
- Changed new-product UX into a two-step flow: create the record, then add media and a certificate.
- Fixed database-only product images, categories, sale data and live COA links in the storefront catalog.
- Prevented duplicated products from sharing source image/COA storage records.
- Added safe storage cleanup on failed image saves and product deletion.
- Parallelised bulk active/inactive updates and improved partial-failure feedback.
- Fixed price and low-stock updates so zero is preserved instead of treated as empty.
- Added tests for COA file validation and the protected Certificates route.

## Supabase migration deployed

`20260801134049_admin_catalog_coa_management.sql` adds or repairs:

- `product_images` schema, indexes, grants and RLS.
- `product_coas` version history, one-current-per-product enforcement, grants and RLS.
- Public `product-images` and `coa-documents` buckets with file type/size limits.
- Admin-only Storage mutation policies.
- Admin-only product/COA RPC execution and explicit privilege revocation from `PUBLIC` and `anon`.
- Transactional RPCs to publish or archive a COA while synchronising `product_mappings.coa_link_url`.

The owner applied this migration successfully to Supabase project `ytacbvfcltikxzudlkzn`. Public read checks confirmed that `product_mappings`, `product_images`, and `product_coas` are reachable after deployment. Authenticated admin mutations and hosted Database/Storage advisors still require a signed-in owner/admin session for final verification.

## Required owner steps

1. Confirm the intended admin user has `app_metadata.admin = true`. Do not use editable `user_metadata` for authorisation.
2. Run the hosted Supabase Database and Storage advisors, then review any findings.
3. Test one complete flow with an admin session: create an inactive product, upload an image, upload/publish a COA, preview the storefront, activate it, archive the COA and confirm the public link clears.
4. Add a scheduled database backup and a retention policy before regular catalog operations begin.

## Verification completed

- TypeScript: pass.
- ESLint: pass.
- Unit/service tests: 73 pass across 16 files.
- Production build: pass on the repository's current Vite 5.4 release line.
- Playwright: 5 admin authentication/route checks pass, including protected `/admin/coas` routing.
- DOMPurify, PostCSS and compatible transitive packages were upgraded to patched releases.

## Verification still required

- Run hosted Supabase Database and Storage advisors after migration.
- Perform authenticated desktop/mobile visual QA once an admin test session is available.
- Confirm whether COAs should retain history (recommended) or permanently replace old files.

## Dependency audit note

`npm audit --omit=dev` reports two high findings from one React Router RSC-mode advisory. This site uses declarative `BrowserRouter`, not React Server Components or Router actions, and npm currently proposes a forced downgrade as its fix. The full audit also reports eight build/development findings under Vite/esbuild and Sharp. Those require breaking upgrades and should be handled as a separate tested dependency project rather than forced into this admin release.
