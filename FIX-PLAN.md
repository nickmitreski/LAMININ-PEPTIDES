# Critical Fixes Implementation Plan

## 🎯 Goal
Fix the most critical design system issues in order of impact.

---

## Phase 1: Color System Restoration (CRITICAL)

### Step 1: Update Tailwind Config

**File:** `tailwind.config.js`

**Replace the `colors` section with:**

```javascript
colors: {
  // Primary brand color - Carbon (dark charcoal, not pure black)
  carbon: {
    950: '#141B1C',
    900: '#1E2526',  // PRIMARY DARK - Use this for headers, text, dark sections
    800: '#2B3536',
    700: '#3A4849',
    600: '#4F5F60',
    500: '#667677',
  },

  // Neutral greys for backgrounds and muted text
  neutral: {
    50:  '#F7F7F7',
    100: '#EDEDEE',  // Grey sections background
    200: '#DDDEDE',  // Subtle borders
    300: '#CBCCCC',
    400: '#A3A4A4',
    500: '#7A7B7B',  // Muted text
    600: '#5A5B5B',
    700: '#3D3E3E',
    800: '#272828',
    900: '#1A1B1B',
  },

  // Brand accent - Aqua/Teal
  accent: {
    DEFAULT: '#89D1D1',
    light:   '#A5DEDE',
    dark:    '#6BBFBF',
    muted:   '#E8F5F5',
  },

  // Page background - soft off-white
  platinum: '#F1F2F2',
},
```

**Why:** This restores the full sophisticated color palette from the brand guide.

---

### Step 2: Update CSS Tokens

**File:** `src/styles/tokens.css`

**Replace entire file with:**

```css
:root {
  /* Brand Colors - Raw values */
  --brand-carbon-950: #141b1c;
  --brand-carbon-900: #1e2526;
  --brand-carbon-800: #2b3536;
  --brand-accent: #89d1d1;
  --brand-accent-light: #a5dede;
  --brand-accent-dark: #6bbfbf;
  --brand-accent-muted: #e8f5f5;
  --brand-platinum: #f1f2f2;

  /* Semantic Tokens - What colors mean */
  --surface-primary: #f1f2f2;     /* Page background (Platinum) */
  --surface-elevated: #ffffff;    /* Cards, elevated elements (White) */
  --surface-muted: #ededee;       /* Subtle background sections (Neutral 100) */

  --text-primary: #1e2526;        /* Body text (Carbon 900) */
  --text-muted: #7a7b7b;          /* Secondary text (Neutral 500) */

  --border-subtle: #dddede;       /* Borders (Neutral 200) */
}
```

**Why:** Creates semantic meaning and matches Tailwind config exactly.

---

### Step 3: Fix Section Component

**File:** `src/components/layout/Section.tsx`

**Replace the `backgroundClasses` object:**

```typescript
const backgroundClasses = {
  white: 'bg-white',               // True white (#FFFFFF)
  platinum: 'bg-platinum',         // Page background (#F1F2F2)
  elevated: 'bg-white',            // Same as white, semantic name
  neutral: 'bg-neutral-100',       // Grey sections (#EDEDEE)
  dark: 'bg-carbon-900 text-white', // Dark sections (#1E2526)
  accent: 'bg-accent text-carbon-900', // Aqua sections (#89D1D1)
  none: '',
};
```

**Update the TypeScript interface:**

```typescript
background?: 'white' | 'platinum' | 'elevated' | 'neutral' | 'dark' | 'accent' | 'none';
```

**Why:** Fixes the critical bug where `white` was rendering as grey.

---

## Phase 2: Fix Typography System

### Step 4: Update Typography Component

**File:** `src/components/ui/Typography.tsx`

**In the `Heading` component, fix level 1:**

```typescript
const styles = {
  1: 'text-2xl md:text-3xl lg:text-4xl font-light tracking-luxury uppercase',
  //                                      ^^^^^^^^^^^ Change from font-extralight
  2: 'text-lg md:text-xl lg:text-2xl font-light tracking-luxury uppercase',
  // ... rest stays the same
};
```

**Update the `tones` in Text component:**

```typescript
const tones = {
  default: '',
  muted: 'text-neutral-500',      // Was text-carbon-900/50
  inverse: 'text-white',
  'inverse-muted': 'text-white/50',
};
```

**Update the `tones` in Label component:**

```typescript
const tones = {
  default: 'text-neutral-500',    // Was text-carbon-900/50
  muted: 'text-neutral-400',      // Was text-carbon-900/35
  inverse: 'text-white',
  'inverse-muted': 'text-white/40',
};
```

**Why:** Uses proper neutral colors for muted text instead of faded black.

---

## Phase 3: Fix Hero Section

### Step 5: Restore Correct Hero Design

**File:** `src/components/sections/Hero.tsx`

**Replace entire file with:**

```tsx
import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import Button from '../ui/Button';
import { Heading, Text } from '../ui/Typography';

export default function Hero() {
  return (
    <Section background="dark" spacing="2xl" className="relative overflow-hidden">
      {/* Laminin symbol watermark */}
      <img
        src="/images/brand/symbol-teal.png"
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[40vw] opacity-[0.03] pointer-events-none select-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <Heading
          level={1}
          className="text-white tracking-hero mb-6 animate-fadeInUp leading-relaxed"
        >
          LABORATORY VERIFIED PEPTIDES
        </Heading>

        <Text
          variant="small"
          weight="light"
          tone="inverse-muted"
          className="max-w-md mx-auto mb-14 animate-fadeInUp leading-relaxed md:text-base"
        >
          high purity compounds supported by analytical testing and documented quality
        </Text>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp">
          <Link to="/library">
            <Button variant="white" size="lg" className="min-w-[200px] uppercase">
              Browse Library
            </Button>
          </Link>
          <Link to="/coa">
            <Button variant="white" size="lg" className="min-w-[200px] uppercase">
              View Certificates
            </Button>
          </Link>
        </div>
      </div>
    </Section>
  );
}
```

**Why:**
- Restores dark background (not aqua)
- Adds symbol watermark
- Removes all !important hacks
- Uses proper text sizing

---

## Phase 4: Fix Features Section

### Step 6: Restore Features Watermark

**File:** `src/components/sections/Features.tsx`

**Replace entire file with:**

```tsx
import { Link } from 'react-router-dom';
import Section from '../layout/Section';
import { Heading, Text } from '../ui/Typography';

export default function Features() {
  return (
    <Section background="platinum" spacing="xl" className="relative overflow-hidden">
      {/* Laminin symbol watermark - positioned right, partially clipped */}
      <img
        src="/images/brand/symbol-teal-circle.png"
        alt=""
        className="absolute right-0 md:right-[-5%] top-1/2 -translate-y-1/2 w-[300px] md:w-[400px] opacity-[0.18] pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* Centered white card with content */}
      <div className="relative z-10 max-w-xl mx-auto bg-white rounded-xl shadow-sm p-10 md:p-12">
        <Heading level={3} className="text-accent tracking-wider mb-6">
          Analytical Transparency
        </Heading>

        <Text variant="small" className="mb-4">
          Each compound supplied by{' '}
          <strong className="font-medium">Laminin Peptide Lab</strong> is
          supported by analytical documentation verifying identity and purity.
        </Text>

        <Text variant="small" muted className="mb-6">
          Our testing framework ensures every batch meets strict research grade
          standards, with Certificates of Analysis available for review.
        </Text>

        <div className="text-center">
          <Link
            to="/coa"
            className="text-xs text-neutral-600 hover:text-carbon-900 underline underline-offset-4 transition-colors"
          >
            View Certificates of Analysis
          </Link>
        </div>
      </div>
    </Section>
  );
}
```

**Why:**
- Restores platinum background (not white/grey)
- Adds the distinctive watermark
- White card now has proper contrast
- Uses semantic color (neutral-600) for link

---

## Phase 5: Fix App Architecture

### Step 7: Move Hero into Home Page

**File:** `src/App.tsx`

**Simplify to:**

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Library from './pages/Library';
import COA from './pages/COA';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-platinum text-carbon-900">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/collection" element={<Library />} />
          <Route path="/coa" element={<COA />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
```

**File:** `src/pages/Home.tsx`

**Update to include Hero:**

```tsx
import Hero from '../components/sections/Hero';
import TrustBar from '../components/sections/TrustBar';
import FeaturedProducts from '../components/sections/FeaturedProducts';
import Features from '../components/sections/Features';
import PeptideToggleSection from '../components/sections/PeptideToggleSection';
import ResearchCategories from '../components/sections/ResearchCategories';
import Disclaimer from '../components/sections/Disclaimer';
import CTASection from '../components/sections/CTASection';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedProducts />
      <Features />
      <PeptideToggleSection />
      <ResearchCategories />
      <Disclaimer />
      <CTASection />
    </>
  );
}
```

**Why:** Clean separation of concerns. Hero belongs to Home, not App layout.

---

## Phase 6: Update Button Component

### Step 8: Fix Button Colors

**File:** `src/components/ui/Button.tsx`

**Update the `variants` object:**

```typescript
const variants = {
  primary: 'bg-carbon-900 text-white hover:bg-carbon-800 active:bg-carbon-700',
  secondary: 'bg-neutral-100 text-carbon-900 hover:bg-neutral-200 active:bg-neutral-300',
  white: 'bg-white text-carbon-900 hover:bg-neutral-50 active:bg-neutral-100',
  outline: 'border border-neutral-200 text-carbon-900 hover:border-carbon-900 hover:bg-neutral-50 active:bg-neutral-100',
  ghost: 'text-carbon-900 hover:bg-neutral-50 active:bg-neutral-100',
  link: 'text-carbon-900 hover:text-carbon-700 underline-offset-4 hover:underline',
};
```

**Why:** Uses proper carbon/neutral colors with semantic hover states.

---

## Phase 7: Update Card Component

### Step 9: Fix Card Borders

**File:** `src/components/ui/Card.tsx`

**Update the `variants` object:**

```typescript
const variants = {
  default: 'bg-white border border-neutral-200',
  bordered: 'bg-white border-2 border-neutral-300',
  elevated: 'bg-white shadow-md border border-neutral-100',
};
```

**Why:** Consistent use of neutral colors for borders.

---

## Phase 8: Fix CSS Import Order

### Step 10: Reorder Imports

**File:** `src/main.tsx`

**Change import order to:**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Tailwind FIRST
import './index.css';

// Then custom styles in order
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/utilities.css';
```

**Why:** Ensures Tailwind loads first, custom styles can override properly.

---

## Testing Checklist

After implementing all fixes:

### Visual Tests
- [ ] Hero section is dark (not aqua) with subtle symbol
- [ ] Features section has platinum background with watermark
- [ ] All text is dark charcoal (#1E2526), not pure black
- [ ] Grey sections use neutral-100 (#EDEDEE), not platinum
- [ ] Buttons have consistent hover states
- [ ] Cards have subtle neutral borders

### Technical Tests
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] No console errors
- [ ] No TypeScript warnings

### Browser Tests
- [ ] Chrome - All sections render correctly
- [ ] Safari - Colors match design
- [ ] Mobile - Responsive breakpoints work
- [ ] Dark mode (if applicable)

---

## Implementation Time Estimate

| Phase | Time | Priority |
|-------|------|----------|
| Phase 1: Color System | 1 hour | CRITICAL |
| Phase 2: Typography | 15 min | HIGH |
| Phase 3: Hero Section | 10 min | HIGH |
| Phase 4: Features Section | 10 min | HIGH |
| Phase 5: App Architecture | 15 min | MEDIUM |
| Phase 6: Button Component | 10 min | MEDIUM |
| Phase 7: Card Component | 5 min | LOW |
| Phase 8: CSS Import Order | 5 min | LOW |
| Testing | 30 min | CRITICAL |

**Total: ~2.5 hours**

---

## Quick Validation Script

After making changes, run:

```bash
# Check TypeScript
npm run typecheck

# Build production
npm run build

# Start dev server and test visually
npm run dev
```

---

## Before/After Comparison

### Before (Current Issues):
- ❌ Pure black (#000000) everywhere
- ❌ Hero section is aqua (wrong!)
- ❌ Features section has no watermark
- ❌ "White" backgrounds render as grey
- ❌ Text uses black/50 for muted (muddy)
- ❌ Hero uses !important overrides

### After (Fixed):
- ✅ Sophisticated carbon (#1E2526) throughout
- ✅ Hero section is dark with symbol
- ✅ Features has platinum bg + watermark
- ✅ White backgrounds are actually white
- ✅ Text uses neutral-500 for muted (clean)
- ✅ No !important hacks

---

## Rollback Plan

If issues occur:

```bash
# Commit before starting
git add .
git commit -m "Pre-refactor checkpoint"

# Create branch for fixes
git checkout -b fix/color-system

# If problems occur
git checkout main
git branch -D fix/color-system
```

---

**Ready to implement? Start with Phase 1 (Color System) - it's the foundation for everything else.**
