# Fixes Applied — 2026-05-17 (Pass 2)

Pass 1 fixed the P0 order-items bug, the Library "All" filter race, and the
sticky-header/footer pattern on 5 admin modals. This pass tackles the deeper
audit items: image optimisation, modal a11y primitive, scroll-lock, focus trap,
ESC-to-close, throttled background fetches, and the pre-existing lint/test debt
that was blocking CI.

## 1. Image asset optimisation pipeline

Originals: 39 product PNGs at ~4–7 MB each (2722×1568) — **174 MB total**.

**Build pipeline**: `scripts/optimize-product-images.sh`
- Reads `public/images/products/*.png`, outputs `public/images/products/optimized/<stem>-{400,800,1200}w.{avif,webp,png}`
- AVIF at quality 60 (avifenc `-q`), WebP at 82 (cwebp `-q`)
- Resampling via macOS `sips` (zero-dep on dev machines that have Xcode CLT)
- Idempotent — only regenerates outputs older than the source
- Runs via `npm run images:optimize`

**Result**:
| Format | 400w | 800w | 1200w |
|---|---|---|---|
| AVIF | ~5 KB | ~12 KB | ~23 KB |
| WebP | ~5 KB | ~14 KB | ~30 KB |
| PNG  | ~150 KB | ~400 KB | ~700 KB |

Per-card download (mobile): **5 KB AVIF vs 7,200 KB original = ~1400× smaller.**
Total optimized output: 77 MB (vs 174 MB originals; users only fetch the AVIF
for their viewport size).

**Runtime wiring**:
- `src/lib/optimizedImage.ts` — `buildOptimizedSources(src)` produces AVIF/WebP/PNG srcsets when src matches `/images/products/*.png`. Preserves URL encoding for filenames with spaces/em-dashes. Returns null for Supabase storage URLs (admin uploads), which fall through to the original `<img>`.
- `src/components/ui/ShopProductImage.tsx` — emits `<picture>` with three `<source>` elements + `<img>` fallback when optimised variants exist. Accepts `sizes` prop with a sensible default.
- All five callsites now pass `width`/`height` (kills CLS): `PeptideCard`, `FeaturedProducts`, `SuggestedPeptides`, `ProductHeroVisual`, plus the implicit hero on Home.
- `PeptideCard` accepts `priority?: boolean` → first 4 Library cards get `loading="eager"` + `fetchpriority="high"`.

**Test**: `src/lib/optimizedImage.test.ts` — 5 cases covering URL gates, srcset shape, URL-encoded filenames.

## 2. Generic `<Modal>` primitive

`src/components/ui/Modal.tsx` was a low-level portal+ESC+backdrop primitive
used by `ProductDescriptionModal` and `BankTransferModal`. Evolved into:

**Modal (default export)** — low-level. Backwards-compatible with existing
callers. Now also provides:
- Focus trap (Tab/Shift-Tab cycle within the dialog)
- Restores focus to the previously-focused element on close
- Scrollbar-width compensation (no layout jump behind modal)
- `disableBackdropClose` / `disableEscClose` props for "must answer" dialogs

**ModalShell (named export)** — opinionated wrapper. Sticky header (with X),
scrolling body, optional sticky footer. `max-h-[calc(100dvh-2rem)]` so iOS Safari's
collapsing toolbar doesn't push content off-screen. Sizes via `size="lg"` etc.

`src/hooks/useBodyScrollLock.ts` — extracted scrollbar-compensating body lock
(used internally by `Modal`).

## 3. Admin modals — now use the primitive

Five admin modals migrated to `Modal` (keeping their bespoke internal layout)
or `ModalShell` (when the layout was simple):

| File | Migration |
|---|---|
| `OrderDetailsModal` | Wrap with `Modal` (keeps complex internal layout); gains focus trap + ESC + scroll lock |
| `CreateProductModal` | Wrap with `Modal`; disables backdrop/ESC close while saving |
| `ProductEditor` | Wrap with `Modal`; disables backdrop/ESC close while saving or deleting |
| `AdminCustomers` edit | Full migration to `ModalShell` — much shorter source |
| `AdminEmails` template editor | Wrap with `Modal`; disables close while saving |

All five now have:
- ESC closes (unless explicitly disabled mid-save)
- Backdrop click closes (unless mid-save)
- Body scroll lock with scrollbar compensation
- Focus trap
- Focus restored to the trigger element on close
- Sticky header X always reachable on tall content
- Footer always visible at bottom (action bar never hidden by overflow)
- Works on iOS Safari short viewports (`100dvh` not `100vh`)

## 4. Pre-existing lint / test debt — cleared

- `discountService.test.ts` — assertion updated to match production error format
  (`/^Could not redeem discount \(.+\)$/`); production code intentionally
  appends an error code for diagnostics.
- `AdminDashboard.tsx:540` — removed unused `loadedShown`.
- `AdminDashboard.tsx:217` — removed unused `eslint-disable-next-line`.

## 5. ShopImagesContext throttling

Quick tab-flip used to hit `fetchShopPrimaryImageOverrides + fetchProductSaleInfo + fetchLiveProductCatalog` again on every visibility change. Now throttled to once per 60 seconds (`VISIBILITY_REFRESH_MIN_MS`).

## 6. Final regression test surface added

- `src/services/supabaseService.test.ts` (7 tests) — locks down `paymentRowToOrder` so the items-shape bug can never silently regress. Tests:
  - Field names match what `OrderDetailsModal` reads
  - `line_total` computed when missing
  - Multiple items handled
  - Defensive coercion of nulls/undefined
  - Non-array `cart_items` passes through (null)
  - Customer address flat-column mapping
  - `order_reference → peptide_order_id` rename

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | **49/49 pass** (was 36/37 before this pass) |
| `npm run lint` | **zero errors, zero warnings** (was 1 error, 1 warning) |
| `npm run build` | succeeds; `dist/images/products/optimized/` correctly populated; bundle references the optimised path |
| `npm run images:optimize` | new |

## Files added

- `scripts/optimize-product-images.sh`
- `src/lib/optimizedImage.ts`
- `src/lib/optimizedImage.test.ts`
- `src/services/supabaseService.test.ts`
- `src/hooks/useBodyScrollLock.ts`
- `public/images/products/optimized/` (351 generated variants)
- `docs/FIXES_APPLIED_2026-05-17_PASS_2.md` (this file)

## Files modified

- `package.json` — `npm run images:optimize` script
- `src/components/ui/Modal.tsx` — extended primitive + `ModalShell` export
- `src/components/ui/ShopProductImage.tsx` — `<picture>` with srcset, accepts `sizes`
- `src/components/sections/FeaturedProducts.tsx` — width/height
- `src/components/products/ProductHeroVisual.tsx` — width/height, `sizes` hint
- `src/components/products/SuggestedPeptides.tsx` — width/height
- `src/context/ShopImagesContext.tsx` — visibility-change throttle
- `src/services/supabaseService.ts` — export `paymentRowToOrder` and the row type for tests
- `src/services/discountService.test.ts` — assertion regex
- `src/pages/AdminDashboard.tsx` — pre-existing lint cleanup
- `src/components/admin/OrderDetailsModal.tsx` — wrap with `Modal`
- `src/components/admin/CreateProductModal.tsx` — wrap with `Modal`
- `src/components/admin/ProductEditor.tsx` — wrap with `Modal`
- `src/pages/AdminCustomers.tsx` — migrate edit modal to `ModalShell`
- `src/pages/AdminEmails.tsx` — wrap template editor with `Modal`

## What's still untouched (deliberately out of scope)

Backlog items still pending — see `IMPROVEMENT_BACKLOG.md`:
- **`CREATE TABLE payment_tracking` migration**: needs a `pg_dump --schema-only` against the live project; can't be done from the repo alone.
- **Server-side total recompute**: changes the RPC + DB function; needs migration ordering.
- **`orders` / `order_items` table promotion**: multi-phase migration.
- **Dedicated `/admin/orders/:id` page**: scope expansion.
- **Stripe / proper payment provider integration**: scope expansion.
- **Strip originals from `dist/images/products/`**: trivial but slightly risky for direct references (emails, social cards); leave for a separate review.
- **Preload hint in `<head>` for LCP image**: hard to pin a single image across all pages; the `fetchpriority="high"` on the first cards already covers this for the Library.
