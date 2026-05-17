# Fixes Applied — 2026-05-17

Single-pass implementation of the audit findings. All changes typecheck clean and pass the existing test suite (one pre-existing `discountService` failure remains, untouched).

## 1. Admin order detail — items now display

- `src/services/supabaseService.ts:paymentRowToOrder` — when mapping `payment_tracking.cart_items` (shape `{id,name,price,quantity,image}`) into `peptide_items`, now transforms each item to include the field names `OrderDetailsModal` reads (`cfg_code, peptide_display_name, unit_price, line_total`) while preserving the originals for back-compat.
- `src/components/admin/OrderDetailsModal.tsx` — items list now uses fallback chains (`peptide_display_name || name || cfg_code || id`, etc.), and `formatPrice` receives a computed line total rather than `0` when the field is missing. Truncation + `break-words` on long product names. `min-w-0 pr-3` to prevent overflow on narrow viewports.

Result: existing orders render correctly on next refresh, no DB change required.

## 2. Library page — "All" filter on first load

- `src/context/ShopImagesContext.tsx:isProductActive` — for static catalog peptides with no DB row, now defaults to active. Previously they were hidden once the catalog finished loading. DB-only synthetic products still respect their `is_active` flag.
- `src/context/ShopImagesContext.tsx` — exposes `catalogLoaded` on the context value.
- `src/pages/Library.tsx` — grid is now gated on `loading || collectionLoading || !catalogLoaded` instead of just `loading || collectionLoading`. Prevents the grid from rendering mid-fetch with a partial product list.

## 3. Library page — slow load / layout shift

- `src/components/ui/ShopProductImage.tsx` — accepts `width` and `height` props, forwarded to the underlying `<img>`. Lets the browser reserve the box before the image streams in (kills CLS).
- `src/components/peptides/PeptideCard.tsx`:
  - accepts a `priority?: boolean` prop
  - passes `width={400} height={400}` always
  - sets `loading="eager"` + `fetchpriority="high"` when `priority` is true
  - exported wrapped in `React.memo` — search-typing on Library no longer re-renders every card
- `src/pages/Library.tsx` — passes `priority={idx < 4}` to the first four cards on the grid.

## 4. Admin modals — top/bottom clipping on small viewports

Applied the canonical flex-column modal pattern (sticky header, scrolling body, footer outside the scroll container, dynamic viewport height for iOS Safari, backdrop click closes, `role="dialog" aria-modal="true"`):

- `src/components/admin/CreateProductModal.tsx`
- `src/components/admin/ProductEditor.tsx`
- `src/components/admin/OrderDetailsModal.tsx`
- `src/pages/AdminCustomers.tsx` (edit customer modal)
- `src/pages/AdminEmails.tsx` (template editor)

Key changes per modal:
- Outer wrapper: `flex max-h-[calc(100dvh-2rem)] flex-col` (uses `100dvh` so iOS Safari's collapsing toolbar doesn't push content offscreen).
- Header: `sticky top-0 shrink-0 bg-white border-b` — close button always reachable.
- Body: `min-h-0 flex-1 overflow-y-auto` — scrolls independently, no whole-page scroll.
- Footer: `shrink-0 border-t` — outside the scroll container, save/cancel always visible.
- Backdrop click closes; click on card stops propagation.
- Responsive padding: `p-4 sm:p-6` so tight viewports get more breathing room.

## 5. Admin table overflow

- `src/pages/AdminDiscounts.tsx` — redemption table wrapped in `overflow-x-auto` with `min-w-[520px]`, so narrow admin viewports get horizontal scroll instead of mangled layout.

## Verification

- `npm run typecheck` — clean.
- `npm test` — 36 / 37 pass; the failing test (`discountService > returns failure when RPC returns error`) is pre-existing on `main` and unrelated.
- `npm run build` — succeeds.
- Manual checklist:
  - [ ] Admin > Dashboard > click an order → item names, qty, unit price, line total all render.
  - [ ] Admin > Payment Tracking — no regression.
  - [ ] /library — "All" tab shows the full static catalog on first paint.
  - [ ] Resize browser to ~480 × 700 → open admin product editor → close button visible at top, save bar visible at bottom, content scrolls between.
  - [ ] Lighthouse / DevTools network: above-fold Library product images have `fetchpriority=high` and `loading=eager`.

## Untouched (out of scope this pass — tracked in IMPROVEMENT_BACKLOG.md)

- Image asset optimisation (PNG → AVIF/WebP, image CDN). The real Library speedup will come from this.
- `CREATE TABLE payment_tracking` migration.
- Server-side total recompute in `upsert_payment_tracking`.
- Order_items table promotion.
- Pre-existing `AdminDashboard.tsx:540` unused-var lint error.
- Pre-existing `discountService.test.ts` failing assertion.
