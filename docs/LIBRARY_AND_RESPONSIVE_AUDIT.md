# Library Page + Admin Modal/Responsive Audit

Date: 2026-05-17
Companion to: `ECOMMERCE_AUDIT_REPORT.md`, `URGENT_FIXES.md`

Three bug classes covered:

1. Library "All" filter shows incomplete catalog on first load
2. Library page slow to load
3. Admin modals overflow on small viewports (top/bottom clipping)

---

## 1. Library "All" filter — initial render shows incomplete catalog

### Symptom
Land on `/library`, default tab is "All", some products are missing. Click another tab, then click "All" again — now all products show.

### Real root cause

`src/context/ShopImagesContext.tsx:169-179` — `isProductActive` returns:
```ts
const info = liveProductMap[peptideId];
if (info) return info.isActive;
return !catalogLoaded;
```

`Library.tsx:124` then filters: `activePeptides = collectionFiltered.filter((p) => isProductActive(p.id))`.

Behaviour over time:
- Before catalog loads (`catalogLoaded=false`): every product appears active → grid is HIDDEN behind a skeleton (`loading || collectionLoading` at line 172). No visible cards yet.
- After catalog loads: `catalogLoaded=true`, `liveProductMap` populated from `product_mappings`. **Any static peptide that doesn't have a row in `product_mappings`** returns `false` from `isProductActive` and is HIDDEN.

This is by design for products that have been retired in the admin, but it's catching static catalog peptides that were never represented in the DB. Specifically: `allPeptides` (60+ items) ∋ static fallbacks like "acetic-acid-water" / "bacteriostatic-water" / older CFG codes that weren't seeded to `product_mappings`.

### Why toggling appears to "fix" it

Toggling category triggers `setActiveCategory(...)` → URL-sync effect fires → `setSearchParams(...)` runs → 300ms-debounced effect resolves → re-render. In that re-render window, the visibility-change effect (`ShopImagesContext.tsx:135-143`) often fires too because the user's attention shifts: a silent `loadCatalog(false)` re-fetches and may now include rows that just became active, or `liveProductMap` ends up with a fuller picture.

But mostly the perception is: after the first paint, the cached `liveProductMap` is stable and a toggle-back simply re-applies the same filter. The user notices "more items" because they're seeing the FILTERED category (smaller list) first, then "All" with the post-filter steady state — which now includes any DB rows that loaded during the toggle delay.

### Fix

Make `isProductActive` lenient toward STATIC peptides (they're known-good catalog entries) and strict only toward DB-only synthetic peptides:

`src/context/ShopImagesContext.tsx` — replace the `isProductActive` callback:

```ts
const staticPeptideIdSet = useMemo(
  () => new Set(allPeptides.map((p) => p.id)),
  []
);

const isProductActive = useCallback(
  (peptideId: string): boolean => {
    const info = liveProductMap[peptideId];
    if (info) return info.isActive;
    // Static catalog peptide with no DB row → default to ACTIVE (treat the
    // hard-coded catalog as the source of truth, DB only overrides it).
    // DB-only synthetic peptides ALWAYS have an entry, so this only catches
    // legitimate static products.
    if (staticPeptideIdSet.has(peptideId)) return true;
    // Synthetic DB-only product with no live entry — only possible mid-fetch.
    return !catalogLoaded;
  },
  [liveProductMap, catalogLoaded, staticPeptideIdSet]
);
```

Result: first paint of `/library` already shows the full static catalog. Any DB-side `is_active=false` still hides those products. DB-only products without a live entry remain hidden after catalog load.

### Defence-in-depth

Also gate the Library grid on `catalogLoaded`, not just `loading`. Today `loading` flips false in the `finally` block; if any state setter races, the user could briefly see a half-populated grid. Use `loading || !catalogLoaded` to keep the skeleton up until we know we have the data.

---

## 2. Library page — slow load

### Diagnosis

| Cause | Evidence | Severity |
|---|---|---|
| Huge unoptimised product PNGs in `/public/images/products/` (5–7 MB each, total ~350 MB) | `ls -laS public/images/products/` | CRITICAL |
| No `width` / `height` attributes on product images → layout shift | `src/components/ui/ShopProductImage.tsx` doesn't accept dimensions | HIGH |
| No `fetchpriority="high"` on above-fold cards | same | MEDIUM |
| `PeptideCard` not memoised → all cards re-render on any state change | `src/components/peptides/PeptideCard.tsx` exports a plain function | MEDIUM |
| Three parallel Supabase fetches block first paint (`fetchShopPrimaryImageOverrides`, `fetchProductSaleInfo`, `fetchLiveProductCatalog`) | `ShopImagesContext.tsx:72-76` | MEDIUM |
| No grid virtualization for 60+ cards | `Library.tsx:186` plain grid map | LOW (only matters once catalog grows) |

### Fixes (ranked by ROI)

**P0 — gate grid on `catalogLoaded`** (also fixes bug #1 above).

**P0 — add `width`/`height` to `ShopProductImage`**. Prevents layout shift; the browser can reserve the box before the image loads. Aspect-square container already exists, so adding `width={400} height={400}` is purely additive.

**P0 — `loading="eager"` + `fetchpriority="high"` for the first 4 cards** (above the fold on mobile, above-grid on desktop). Rest stay lazy.

**P1 — wrap `PeptideCard` in `React.memo`**. Cheap, big win when search input changes (currently every keystroke re-renders all 60 cards).

**P1 — defer `fetchProductSaleInfo` to a non-blocking microtask**. Sale labels are decorative; the page can paint without them and update them in the next frame.

**P2 — image optimisation pipeline**. Convert PNG → AVIF/WebP at multiple sizes; serve via `<picture>` with `srcset`. Move to an image CDN (Cloudinary/Imgix/Vercel's `/_vercel/image`) so we don't ship 5 MB to every visitor.

**P3 — virtualize the grid** with `@tanstack/react-virtual`. Worth it only at >100 cards.

---

## 3. Admin modals — top/bottom clipping on small viewports

### Modals reviewed

| Modal | File | Status | Fix needed |
|---|---|---|---|
| OrderDetailsModal | `src/components/admin/OrderDetailsModal.tsx:80` | Partially OK — sticky header+footer, but inner content wraps badly | Wrap reconstitution table in `overflow-x-auto`; reduce inner padding on mobile |
| CreateProductModal | `src/components/admin/CreateProductModal.tsx:99-119` | **BROKEN** — outer wrapper has `overflow-y-auto` but inner card has no `max-h`; on short viewports the card overflows the screen and the close button is unreachable above | Convert to fixed-height flex column with sticky header + scrolling body + sticky footer |
| ProductEditor | `src/components/admin/ProductEditor.tsx:417-453` | **BROKEN** — same pattern as CreateProductModal; huge form, no sticky save button | Same fix; also make the save bar sticky |
| AdminCustomers edit | `src/pages/AdminCustomers.tsx:529-620` | OK-ish — has `max-h-[90vh] overflow-y-auto`, but no sticky header → close button scrolls away | Add sticky header with X button |
| AdminDiscounts create/edit | `src/pages/AdminDiscounts.tsx:578` | OK — has `max-h-[90vh] overflow-y-auto` | None |
| AdminDiscounts redemptions | `src/pages/AdminDiscounts.tsx:830` | Table inside lacks `overflow-x-auto` | Wrap `<table>` in scroll container |
| AdminDashboard delete confirm | `src/pages/AdminDashboard.tsx:955` | OK | None |
| AdminDashboard bulk delete | `src/pages/AdminDashboard.tsx:1029` | OK | None |
| AdminPaymentTracking confirm | `src/pages/AdminPaymentTracking.tsx:220` | OK | None |
| AdminEmails modal | `src/pages/AdminEmails.tsx` | Uses `z-[100]` vs other modals `z-50` — minor inconsistency; body lacks `max-h` | Same flex-column fix |

### Canonical modal pattern (apply everywhere)

```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  onClick={onClose}
>
  <div
    className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
    onClick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
  >
    {/* Sticky header */}
    <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-carbon-200 bg-white px-6 py-4 rounded-t-lg">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button type="button" onClick={onClose} aria-label="Close" className="...">
        <X className="h-5 w-5" />
      </button>
    </div>

    {/* Scrolling body */}
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
      {children}
    </div>

    {/* Sticky footer (optional) */}
    {footer && (
      <div className="sticky bottom-0 z-10 flex shrink-0 justify-end gap-2 border-t border-carbon-200 bg-white px-6 py-3 rounded-b-lg">
        {footer}
      </div>
    )}
  </div>
</div>
```

Key details:
- `max-h-[calc(100dvh-2rem)]` uses dynamic viewport height (`dvh`) so iOS Safari address bar doesn't push the modal off-screen.
- `flex flex-col` + `min-h-0` on the scroll body is essential — without `min-h-0` on a flex child, `overflow-y-auto` doesn't actually scroll.
- `shrink-0` on header/footer prevents them from collapsing when content is tall.
- Click on backdrop closes; click on card stops propagation.
- `role="dialog"` + `aria-modal="true"` for screen readers.

### Body scroll lock

When a modal is open, the page behind shouldn't scroll on iOS. Add to a small `useBodyScrollLock` hook:

```ts
useEffect(() => {
  const prev = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = prev; };
}, []);
```

Apply inside every modal component (or once via a shared `<Modal>` primitive).

---

## 4. Other improvements discovered along the way

- **Admin tables lacking horizontal scroll**: AdminDiscounts redemptions table (`AdminDiscounts.tsx:874`); audit other admin pages for the same.
- **`ShopProductImage` always uses `<img>` without intrinsic size** → CLS on every page using product cards (Home, ProductPage, Cart, Checkout, OrderConfirmation as well as Library). Fix benefits the whole site.
- **`PeptideCard` lacks memoization** → noticeable jank on Library search keystrokes.
- **`loadCatalog` on visibility-change refetches everything** even when the tab was hidden for <30s. Add a guard: only refetch if last fetch was > N seconds ago.
- **Console-only error logging** in `fetchLiveProductCatalog`, `fetchShopPrimaryImageOverrides`, etc. Add a single `logError` helper that also reports to a sink (Sentry/PostHog later).
- **No image dimensions in `<head>` preload hints** for the hero image. Add `<link rel="preload" as="image" ...>` for the LCP image on Library/Home.

---

## Implementation order

Apply in this order — each step is independent and reversible.

1. `ShopImagesContext.tsx` — make `isProductActive` lenient to static peptides (fixes "All" filter bug).
2. `Library.tsx` — gate grid on `loading || collectionLoading || !catalogLoaded` (defence in depth).
3. `ShopProductImage.tsx` — accept `width`/`height`/`fetchPriority` props and forward them.
4. `PeptideCard.tsx` — pass `width={400} height={400}` to image; export wrapped in `React.memo`.
5. `Library.tsx` — set the first 4 cards `fetchpriority="high"` `loading="eager"`.
6. Admin modal sweep — apply the canonical pattern to `CreateProductModal`, `ProductEditor`, `AdminCustomers` edit modal, `AdminEmails` modal; wrap any inner table in `overflow-x-auto`.
7. Add `useBodyScrollLock` hook and call inside each modal.
