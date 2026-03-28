# File Relationships & Dependencies Map

This document shows which files import which other files, making it easy to understand dependencies when making changes.

---

## 📊 Visual Dependency Tree

```
index.html
└── src/main.tsx
    ├── src/index.css (Tailwind)
    ├── src/styles/tokens.css
    ├── src/styles/base.css
    ├── src/styles/components.css
    ├── src/styles/utilities.css
    └── src/App.tsx
        ├── react-router-dom
        ├── src/components/layout/Header.tsx
        │   ├── react-router-dom (Link, useLocation)
        │   ├── lucide-react (Menu, X icons)
        │   ├── src/components/layout/Container.tsx
        │   └── src/components/ui/Button.tsx
        │
        ├── src/components/layout/Footer.tsx
        │   ├── react-router-dom (Link)
        │   ├── src/components/layout/Container.tsx
        │   ├── src/components/ui/Typography.tsx (Text, Label)
        │   └── images/brand/logo-white.png
        │
        └── src/pages/[Page].tsx
            └── [various section components]
```

---

## 🗺️ Complete File Import Map

### Entry Point Chain

```
index.html
  ↓ loads
src/main.tsx
  ↓ imports
  ├── src/index.css
  ├── src/styles/tokens.css
  ├── src/styles/base.css
  ├── src/styles/components.css
  ├── src/styles/utilities.css
  └── src/App.tsx
```

---

## 📄 Page Files

### src/pages/Home.tsx

**Imports:**
```typescript
import Hero from '../components/sections/Hero'
import TrustBar from '../components/sections/TrustBar'
import FeaturedProducts from '../components/sections/FeaturedProducts'
import PeptideToggleSection from '../components/sections/PeptideToggleSection'
import ResearchCategories from '../components/sections/ResearchCategories'
import Disclaimer from '../components/sections/Disclaimer'
import CTASection from '../components/sections/CTASection'
```

**Note:** Features section has been removed from homepage.

**Imported By:**
- `src/App.tsx`

---

### src/pages/Library.tsx

**Imports:**
```typescript
import { useState } from 'react'
import Section from '../components/layout/Section'
import Container from '../components/layout/Container'
import ToggleTabs from '../components/ui/ToggleTabs'
import Input from '../components/ui/Input'
import PeptideCard from '../components/peptides/PeptideCard'
import { peptideCategories, getPeptidesByCategory } from '../data/peptides'
```

**Imported By:**
- `src/App.tsx`

---

### src/pages/COA.tsx

**Imports:**
```typescript
import Section from '../components/layout/Section'
import Heading from '../components/ui/Typography'
import Card from '../components/ui/Card'
import { Download } from 'lucide-react'
```

**Imported By:**
- `src/App.tsx`

---

### src/pages/Contact.tsx

**Imports:**
```typescript
import Section from '../components/layout/Section'
import Heading from '../components/ui/Typography'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Button from '../components/ui/Button'
```

**Imported By:**
- `src/App.tsx`

---

## 🧩 Section Components

### src/components/sections/Hero.tsx

**Imports:**
```typescript
import { Link } from 'react-router-dom'
import Section from '../layout/Section'
import Button from '../ui/Button'
import { Heading, Text } from '../ui/Typography'
```

**Imported By:**
- `src/pages/Home.tsx`

**Assets Used:**
- None (removed watermark for aqua design)

---

### src/components/sections/FeaturedProducts.tsx

**Imports:**
```typescript
import { Link } from 'react-router-dom'
import Section from '../layout/Section'
import SectionTitle from '../ui/SectionTitle'
import Button from '../ui/Button'
import { Label, Text } from '../ui/Typography'
import { featuredProducts } from '../../data/featuredProducts'
```

**Imported By:**
- `src/pages/Home.tsx`

**Data Dependencies:**
- `src/data/featuredProducts.ts`

**Assets Used:**
- `/images/products/*.png` (8 product images)

---

### src/components/sections/Features.tsx

**Imports:**
```typescript
import { Link } from 'react-router-dom'
import Section from '../layout/Section'
import { Heading, Text } from '../ui/Typography'
```

**Imported By:**
- `src/pages/Home.tsx`

**Assets Used:**
- `/images/brand/symbol-teal-circle.png` (watermark)

---

### src/components/sections/PeptideToggleSection.tsx

**Imports:**
```typescript
import { useState } from 'react'
import Section from '../layout/Section'
import SectionTitle from '../ui/SectionTitle'
import ToggleTabs from '../ui/ToggleTabs'
import PeptideCard from '../peptides/PeptideCard'
import { peptideCategories, getPeptidesByCategory } from '../../data/peptides'
```

**Imported By:**
- `src/pages/Home.tsx`

**Data Dependencies:**
- `src/data/peptides.ts`

---

### src/components/sections/ResearchCategories.tsx

**Imports:**
```typescript
import Section from '../layout/Section'
import { Heading } from '../ui/Typography'
```

**Imported By:**
- `src/pages/Home.tsx`

**Assets Used:**
- `/images/products/retatrutide-10mg.png`
- `/images/products/bpc157-tb500-20mg.png`
- `/images/products/cjc1295-ipa-20mg.png`

---

### src/components/sections/Disclaimer.tsx

**Imports:**
```typescript
import Section from '../layout/Section'
import { Heading, Text } from '../ui/Typography'
import IconTile from '../ui/IconTile'
import { AlertTriangle } from 'lucide-react'
```

**Note:** No longer uses Card component - uses direct black box styling.

**Imported By:**
- `src/pages/Home.tsx`

---

### src/components/sections/CTASection.tsx

**Imports:**
```typescript
import { Link } from 'react-router-dom'
import { Heading, Text } from '../ui/Typography'
import Button from '../ui/Button'
import Section from '../layout/Section'
```

**Note:** Simplified - no longer uses icon components or feature cards.

**Imported By:**
- `src/pages/Home.tsx`

---

### src/components/sections/TrustBar.tsx

**Imports:**
```typescript
import Section from '../layout/Section'
import { Heading, Text } from '../ui/Typography'
```

**Imported By:**
- `src/pages/Home.tsx`

---

## 🎨 UI Components

### src/components/ui/Typography.tsx

**Imports:**
```typescript
import { ReactNode } from 'react'
```

**Exports:**
- `Heading` component
- `Text` component
- `Label` component

**Imported By:**
- Almost every component in the project
- Key users: All section components, SectionTitle, pages

---

### src/components/ui/Button.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/components/sections/Hero.tsx`
- `src/components/sections/FeaturedProducts.tsx`
- `src/components/sections/CTASection.tsx`
- `src/components/layout/Header.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Library.tsx`

---

### src/components/ui/Card.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/components/peptides/PeptideCard.tsx`
- `src/pages/COA.tsx`

**Note:** No longer used by Disclaimer.tsx (now uses direct black box styling)

---

### src/components/ui/SectionTitle.tsx

**Imports:**
```typescript
import { Label, Heading, Text } from './Typography'
```

**Imported By:**
- `src/components/sections/FeaturedProducts.tsx`
- `src/components/sections/PeptideToggleSection.tsx`

---

### src/components/ui/IconTile.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/components/sections/Disclaimer.tsx`

**Note:** No longer used by CTASection.tsx (feature cards removed)

---

### src/components/ui/ToggleTabs.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/components/sections/PeptideToggleSection.tsx`
- `src/pages/Library.tsx`

---

### src/components/ui/Input.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/pages/Library.tsx`
- `src/pages/Contact.tsx`

---

### src/components/ui/Textarea.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/pages/Contact.tsx`

---

### src/components/ui/Badge.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/components/peptides/PeptideCard.tsx`

---

## 🧱 Layout Components

### src/components/layout/Section.tsx

**Imports:**
```typescript
import { ReactNode } from 'react'
import Container from './Container'
```

**Imported By:**
- Almost every section component
- All page components

**Purpose:** Wrapper for page sections with consistent spacing and backgrounds

---

### src/components/layout/Container.tsx

**Imports:**
- None (pure component)

**Imported By:**
- `src/components/layout/Section.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/pages/Library.tsx`

**Purpose:** Content width container (max-width: 1280px)

---

### src/components/layout/Header.tsx

**Imports:**
```typescript
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Container from './Container'
import Button from '../ui/Button'
```

**Assets Used:**
- `/images/brand/logo-white.png`

**Sizing:**
- Header height: `h-20 md:h-24` (80px mobile, 96px desktop)
- Logo height: `h-10 md:h-12` (40px mobile, 48px desktop) - **Increased**
- Nav link text: `text-sm` (14px) - **Increased from text-xs**
- Nav link padding: `px-5 py-2.5` - **Increased**
- Search button: `size="md"` - **Increased from size="sm"**
- Mobile menu icon: `size={22}` - **Increased from size={18}**

**Imported By:**
- `src/App.tsx`

**Active State Styling:**
- Active nav link: Aqua background (`bg-accent`) with black text (`text-carbon-900`)
- Inactive nav links: 100% white text (`text-white`)
- Hover: White text with subtle background

**Updated:** March 28, 2026 - Sizes increased and active state updated to aqua

---

### src/components/layout/Footer.tsx

**Imports:**
```typescript
import { Link } from 'react-router-dom'
import Container from './Container'
import { Text, Label } from '../ui/Typography'
```

**Assets Used:**
- `/images/brand/logo-white.png`

**Imported By:**
- `src/App.tsx`

---

## 📊 Data Files

### src/data/featuredProducts.ts

**Exports:**
```typescript
export interface FeaturedProduct { ... }
export const featuredProducts: FeaturedProduct[]
```

**Imported By:**
- `src/components/sections/FeaturedProducts.tsx`

**Content:** 8 featured products with names, prices, image paths

---

### src/data/peptides.ts

**Exports:**
```typescript
export interface Peptide { ... }
export const peptides: Peptide[]
export const peptideCategories: string[]
export function getPeptidesByCategory(category: string): Peptide[]
```

**Imported By:**
- `src/components/sections/PeptideToggleSection.tsx`
- `src/pages/Library.tsx`

**Content:** All peptide data with categories, prices, descriptions

---

### src/data/features.ts ⚠️ UNUSED

**Exports:**
```typescript
export const features: Array<{ title, description, icon }>
```

**Imported By:**
- ❌ None (previously used by old Features.tsx)

**Status:** Can be archived or deleted

---

### src/data/trustBadges.ts ⚠️ UNUSED

**Exports:**
```typescript
export const trustBadges: Array<{ title, description, icon }>
```

**Imported By:**
- ❌ None (previously used by TrustBadges.tsx)

**Status:** Can be archived or deleted

---

### src/data/testimonials.ts ⚠️ UNUSED

**Exports:**
```typescript
export const testimonials: Array<{ name, role, quote }>
```

**Imported By:**
- ❌ None (previously used by Testimonials.tsx)

**Status:** Can be archived or deleted

---

## 🎨 Style Files

### src/index.css

**Imports:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Imported By:**
- `src/main.tsx` (first import)

**Purpose:** Tailwind CSS directive file

---

### src/styles/tokens.css

**Defines:**
- CSS custom properties (--color-*, --surface-*, --text-*)

**Imported By:**
- `src/main.tsx`

**Used By:**
- All components (via CSS variables)

---

### src/styles/base.css

**Defines:**
- Base HTML element styles (body, h1-h6, ::selection)

**Imported By:**
- `src/main.tsx`

---

### src/styles/components.css

**Defines:**
- `.btn` - Button base styles
- `.input` - Input base styles

**Imported By:**
- `src/main.tsx`

**Used By:**
- `src/components/ui/Button.tsx` (applies `.btn` class)
- `src/components/ui/Input.tsx` (applies `.input` class)

---

### src/styles/utilities.css

**Defines:**
- Custom utility classes (if any)

**Imported By:**
- `src/main.tsx`

---

## 🖼️ Asset Files

### /public/images/brand/

**Files:**
- `logo-white.png` - White logo for dark backgrounds
- `logo-colour.png` - Color logo for light backgrounds
- `logo-black.png` - Black logo
- `logo-reverse.png` - Reverse logo
- `symbol-teal.png` - Teal symbol (watermark)
- `symbol-teal-circle.png` - Teal symbol in circle (watermark)
- `symbol-dark.png` - Dark symbol

**Used By:**
- `src/components/layout/Header.tsx` → logo-white.png
- `src/components/layout/Footer.tsx` → logo-white.png
- `src/components/sections/Features.tsx` → symbol-teal-circle.png
- `index.html` → symbol-dark.png (favicon)

---

### /public/images/products/

**Files:** (10 product images)
- `semax-10mg.png`
- `selank-10mg.png`
- `retatrutide-10mg.png`
- `nad-1000mg.png`
- `mots-c-40mg.png`
- `klow-80mg.png`
- `ipamorelin-10mg.png`
- `glow-70mg.png`
- `bpc157-tb500-20mg.png`
- `cjc1295-ipa-20mg.png`

**Used By:**
- `src/components/sections/FeaturedProducts.tsx` → first 8 images
- `src/components/sections/ResearchCategories.tsx` → last 3 images

---

## 🔄 Dependency Chains

### Changing Colors

**If you change:**
`tailwind.config.js` colors

**You should also update:**
1. `src/styles/tokens.css` (CSS variables)
2. Check all components using those colors
3. Run `npm run build` to regenerate CSS

---

### Changing Typography

**If you change:**
`src/components/ui/Typography.tsx`

**This affects:**
- Every section component
- Every page component
- SectionTitle component
- Test thoroughly!

---

### Adding New Data

**To add a new product:**
1. Add image to `/public/images/products/`
2. Add entry to `src/data/peptides.ts`
3. Component will automatically pick it up

**To add a new featured product:**
1. Add image to `/public/images/products/`
2. Add entry to `src/data/featuredProducts.ts`
3. FeaturedProducts component will display it

---

### Removing Unused Files

**Safe to remove:**
- `src/components/sections/TrustBadges.tsx` (not imported)
- `src/components/sections/Testimonials.tsx` (not imported)
- `src/components/sections/LabResults.tsx` (not imported)
- `src/data/features.ts` (not imported)
- `src/data/trustBadges.ts` (not imported)
- `src/data/testimonials.ts` (not imported)

**Do NOT remove:**
- Any file imported by another file (see above)
- Any file in `/public/` (needed at runtime)

---

## 📈 Impact Analysis

### "If I change Section.tsx..."

**Direct impact:**
- All pages (Home, Library, COA, Contact, NotFound)
- All section components

**Recommendation:** Test ALL pages after changes

---

### "If I change Button.tsx..."

**Direct impact:**
- Hero section
- FeaturedProducts section
- CTASection section
- Header
- Contact page
- Library page

**Recommendation:** Test buttons on all pages

---

### "If I change Typography.tsx..."

**Direct impact:**
- Literally every component in the project

**Recommendation:** Full regression test required

---

### "If I change featuredProducts.ts..."

**Direct impact:**
- FeaturedProducts section (Home page only)

**Recommendation:** Test homepage only

---

### "If I change peptides.ts..."

**Direct impact:**
- PeptideToggleSection (Home page)
- Library page

**Recommendation:** Test homepage + library page

---

## 🔍 Quick Reference

**"Where is this component imported?"**
→ Search this file for the component name under "Imported By"

**"What does this component use?"**
→ Search this file for the component name under "Imports"

**"Can I delete this file?"**
→ Check "Imported By" - if it says "❌ None", it's safe to delete

**"What will break if I change this?"**
→ Check "Imported By" + "Impact Analysis" sections

---

**Last Updated:** March 28, 2026
**Maintained By:** Development Team
