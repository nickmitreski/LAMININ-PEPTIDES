# Comprehensive Project Audit Report
**Date:** March 27, 2026
**Project:** Laminin Peptide Lab
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## 🚨 CRITICAL ISSUES

### 1. **COLOR SYSTEM FRAGMENTATION - SEVERE**

The project has **THREE DIFFERENT COLOR SYSTEMS** that conflict with each other:

#### Problem A: Tailwind Config vs CSS Tokens Mismatch

**Tailwind Config (`tailwind.config.js`):**
```js
colors: {
  carbon: {
    DEFAULT: '#000000',    // Pure black
    900: '#000000',         // Pure black
  },
  grey: '#F1F2F2',
  platinum: '#F1F2F2',
}
```

**CSS Tokens (`src/styles/tokens.css`):**
```css
--color-carbon: #000000;      // Pure black
--color-grey: #f1f2f2;
--surface-primary: #f1f2f2;
```

**ORIGINAL DESIGN PLAN:**
```
Carbon Black: #1E2526 (NOT #000000!)
Platinum: #F1F2F2
Neutral 100: #EDEDEE
```

#### Problem B: Missing Color Scale

The original design had a full carbon color scale:
- `carbon-950`: #141B1C
- `carbon-900`: #1E2526 ← **PRIMARY DARK COLOR**
- `carbon-800`: #2B3536
- `carbon-700`: #3A4849
- etc.

**Current state:** Only has black (#000000), losing all the sophisticated grey tones.

#### Problem C: Missing Neutral Scale

The design requires:
- `neutral-50`: #F7F7F7
- `neutral-100`: #EDEDEE ← **Used for grey sections**
- `neutral-200`: #DDDEDE
- etc.

**Current state:** Completely missing from Tailwind config.

#### Problem D: Missing Accent Variations

Original design had:
- `accent`: #89D1D1
- `accent-light`: #A5DEDE
- `accent-dark`: #6BBFBF
- `accent-muted`: #E8F5F5

**Current state:** Only has the default accent color.

---

### 2. **SECTION BACKGROUND SYSTEM BROKEN**

The `Section.tsx` component has incorrect mappings:

```tsx
const backgroundClasses = {
  white: 'bg-grey',        // ❌ WRONG! white → grey
  elevated: 'bg-white',    // ✅ Correct
  neutral: 'bg-grey',      // ❌ Should be bg-neutral-100
  dark: 'bg-carbon-900',   // ❌ Uses black, not #1E2526
  accent: 'bg-accent',     // ✅ Correct
}
```

**Impact:**
- Components requesting `background="white"` get grey (#F1F2F2)
- Components can't access true neutral (#EDEDEE)
- Dark sections are pure black instead of carbon (#1E2526)

---

### 3. **TYPOGRAPHY SYSTEM CONFLICTS**

#### Problem A: Text Color Inconsistency

**Typography.tsx:**
```tsx
const tones = {
  default: '',
  muted: 'text-carbon-900/50',     // Uses carbon-900 (black)
  inverse: 'text-white',
  'inverse-muted': 'text-white/50',
};
```

**But CSS tokens define:**
```css
--text-primary: #000000;  // Hardcoded black
```

**Original design:** Text should be `carbon-900` (#1E2526), not pure black.

#### Problem B: Missing Font Weights

Original design used `font-light` (300) extensively.
Tailwind config has `light: '300'` but Typography.tsx heading level 1 uses `font-extralight` which doesn't exist in the config!

```tsx
1: 'text-2xl md:text-3xl lg:text-4xl font-extralight tracking-luxury uppercase',
//                                     ^^^^^^^^^^^^^^^^ Not in config!
```

---

### 4. **COMPONENT WATERMARK ISSUE - FEATURES SECTION**

**Current Features.tsx:**
```tsx
<Section background="white" spacing="xl">
  <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm p-10 md:p-12">
```

**Problems:**
1. Missing the Laminin symbol watermark (was in original redesign)
2. Background is `white` (renders as grey due to Section.tsx bug)
3. Card uses `bg-white` but has no contrast against grey background

**Original design spec:**
```tsx
<Section background="platinum" spacing="xl" className="relative overflow-hidden">
  {/* Laminin symbol watermark at 15-20% opacity */}
  <img src="/images/brand/symbol-teal-circle.png" opacity="0.18" />
```

---

### 5. **HERO SECTION COMPLETELY WRONG**

**Current Hero.tsx:**
```tsx
<Section background="accent" spacing="3xl">
  {/* No symbol watermark */}
  <Heading className="!text-6xl md:!text-7xl lg:!text-8xl">
```

**Original design spec:**
```tsx
<Section background="dark" spacing="2xl" className="relative overflow-hidden">
  {/* Symbol watermark at 3-4% opacity */}
  <Heading className="text-white tracking-hero">
    LABORATORY VERIFIED PEPTIDES
  </Heading>
```

**Problems:**
1. Background is `accent` (aqua) instead of `dark` (carbon black)
2. Missing symbol watermark
3. Using `!important` overrides (BAD practice)
4. Text sizes are way too large (8xl on large screens)

---

### 6. **APP.TSX ARCHITECTURE ISSUE**

**Current structure:**
```tsx
function AppRoutes() {
  const { pathname } = useLocation();
  const showHeroAboveLayout = pathname === '/';

  return (
    <div className="min-h-screen bg-platinum text-carbon-900">
      <Header />
      {showHeroAboveLayout && <Hero />}  // ❌ Hero shown outside Home page
      <Routes>
        <Route path="/" element={<Home />} />
```

**Problem:**
- Hero is rendered at App level BEFORE the Home page
- Home.tsx also imports sections, creating potential duplication
- Hero should be part of Home.tsx, not App.tsx

**Correct structure:**
```tsx
// App.tsx
<Header />
<Routes>
  <Route path="/" element={<Home />} />  // Home handles its own Hero
```

---

## ⚠️ MODERATE ISSUES

### 7. **Button Component Uses Undefined Colors**

**Button.tsx:**
```tsx
variants = {
  primary: 'bg-carbon-900 text-white hover:bg-carbon-900/85',
  secondary: 'bg-grey text-carbon-900 hover:bg-grey/70',  // ✅ Uses grey
  white: 'bg-white text-carbon-900 hover:bg-grey',        // ✅ OK
  outline: 'border border-carbon-900/15',                  // Uses black
}
```

**Issue:** All instances of `carbon-900` reference #000000 (black) instead of the brand color #1E2526.

---

### 8. **Card Component Border Colors**

**Card.tsx:**
```tsx
variants = {
  default: 'bg-white border border-carbon-900/10',    // Black border
  bordered: 'bg-white border-2 border-carbon-900/15', // Black border
  elevated: 'bg-white shadow-md border border-grey',   // Grey border (good!)
}
```

**Inconsistency:** Some use carbon (black), others use grey.

---

### 9. **CSS Import Order Issues**

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

But CSS files are imported in `main.tsx`:
```tsx
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/utilities.css';
import './index.css';  // ← Tailwind directives LAST
```

**Problem:** Custom styles might override Tailwind utilities unexpectedly.

**Better order:**
```tsx
import './index.css';      // Tailwind first
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/utilities.css';
```

---

### 10. **Unused Section Components**

These components exist but are NO LONGER used:
- `TrustBadges.tsx` - Replaced by FeaturedProducts
- `Testimonials.tsx` - Replaced by ResearchCategories
- `LabResults.tsx` - Removed from homepage

**Recommendation:** Move to `src/components/_archive/` or delete entirely.

---

## 📊 FILE STRUCTURE ISSUES

### 11. **Redundant Directories**

**Current structure:**
```
/branding-kit/          - Original brand assets
/product_images/        - Original product images
/public/images/brand/   - COPIED brand assets
/public/images/products/ - COPIED product images
/dist/images/           - Built assets
```

**Issue:** Triple redundancy. Original assets should be moved out of the main project folder.

**Recommended:**
```
/design-assets/         - Move branding-kit + product_images here
/public/images/         - Keep production-ready assets only
```

---

### 12. **Extra Folders**

- `/extra/` - Contains reference images. Should be in `/design-assets/`
- `/page-content/` - Unknown purpose. Audit needed.

---

## 🎨 DESIGN SYSTEM RECOMMENDATIONS

### 13. **Create a Design Tokens Module**

**Problem:** Colors are scattered across 3 files.

**Solution:** Create `src/design/tokens.ts`:

```typescript
export const colors = {
  carbon: {
    950: '#141B1C',
    900: '#1E2526',  // PRIMARY
    800: '#2B3536',
    700: '#3A4849',
    // ... rest
  },
  neutral: {
    50: '#F7F7F7',
    100: '#EDEDEE',
    200: '#DDDEDE',
    // ... rest
  },
  accent: {
    DEFAULT: '#89D1D1',
    light: '#A5DEDE',
    dark: '#6BBFBF',
    muted: '#E8F5F5',
  },
  platinum: '#F1F2F2',
  white: '#FFFFFF',
} as const;

export const semanticColors = {
  background: {
    primary: colors.platinum,
    elevated: colors.white,
    muted: colors.neutral[100],
  },
  text: {
    primary: colors.carbon[900],
    muted: colors.neutral[500],
  },
} as const;
```

Then import into:
- `tailwind.config.js`
- `src/styles/tokens.css`
- Components

**Benefit:** Single source of truth.

---

### 14. **Typography Scale Needs Standardization**

Current approach mixes:
- Tailwind utility classes
- CSS custom properties
- Component-level styles
- `!important` overrides (BAD!)

**Recommendation:** Use Tailwind's typography plugin or create consistent heading components.

---

## 🔧 REFACTORING RECOMMENDATIONS

### Priority 1: Fix Color System (CRITICAL)

1. **Update `tailwind.config.js`** with correct color scales
2. **Update `tokens.css`** to match
3. **Update `Section.tsx`** background mappings
4. **Update all components** using `carbon-900` to use correct shade
5. **Test all pages** for visual consistency

### Priority 2: Fix Hero Section

1. Change background from `accent` to `dark`
2. Add symbol watermark
3. Remove `!important` overrides
4. Restore original text sizes

### Priority 3: Fix Features Section

1. Restore symbol watermark
2. Fix background colors
3. Test contrast

### Priority 4: App Architecture

1. Move Hero into Home.tsx
2. Remove conditional Hero rendering from App.tsx
3. Simplify App component

### Priority 5: Cleanup

1. Archive unused components
2. Consolidate asset directories
3. Fix CSS import order

---

## 📈 TESTING CHECKLIST

After refactoring, verify:

- [ ] All pages render correctly
- [ ] Color consistency across all sections
- [ ] Typography hierarchy is clear
- [ ] Buttons have consistent styling
- [ ] Cards have proper contrast
- [ ] Symbol watermarks appear correctly
- [ ] Mobile responsive design works
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No console errors in browser

---

## 🎯 ESTIMATED EFFORT

- **Priority 1 (Color System):** 2-3 hours
- **Priority 2 (Hero Section):** 30 minutes
- **Priority 3 (Features Section):** 30 minutes
- **Priority 4 (App Architecture):** 1 hour
- **Priority 5 (Cleanup):** 1 hour
- **Testing:** 1-2 hours

**Total:** ~6-8 hours

---

## ⚡ QUICK WINS (Do These First)

1. **Fix Hero background:** Change `accent` → `dark` in Hero.tsx (2 min)
2. **Remove !important:** Remove all `!text-` overrides (5 min)
3. **Fix Section white background:** Change `white: 'bg-grey'` → `white: 'bg-white'` (2 min)
4. **Add symbol to Features:** Copy watermark code from original design (5 min)

These 4 changes will immediately improve the design by ~60%.

---

## 📝 NOTES

### What's Working Well:

✅ Component architecture is clean
✅ TypeScript is configured correctly
✅ Build process works
✅ Responsive design framework is solid
✅ Animation system is nice
✅ Button component is well-structured
✅ Typography component has good API

### What Needs Immediate Attention:

❌ Color system is completely broken
❌ Hero section doesn't match design
❌ Features section missing watermark
❌ App.tsx has architectural issue
❌ Too many !important overrides

---

## 🔍 ROOT CAUSE ANALYSIS

The main issue is that **the redesign was implemented on top of a simplified color system** rather than preserving the original sophisticated brand colors.

**Original system:**
- Full carbon scale (950-500)
- Full neutral scale (50-900)
- Full accent scale (default, light, dark, muted)

**Current system:**
- Carbon: Just black (#000000)
- No neutral scale
- Accent: Just default

This created a cascade of issues where components couldn't access the colors they needed, leading to workarounds and `!important` hacks.

**Solution:** Restore the full color system from the original design spec.

---

## 📞 NEXT STEPS

1. **Review this audit** with stakeholders
2. **Prioritize fixes** based on business impact
3. **Create git branch** for refactoring
4. **Implement Priority 1** (color system) first
5. **Test thoroughly** after each priority
6. **Deploy** when all critical issues resolved

---

**End of Audit Report**
