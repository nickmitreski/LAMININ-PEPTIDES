# Project Architecture Documentation
**Laminin Peptide Lab - Complete System Guide**

---

## 📁 Directory Structure

```
/modaz-package/main/
├── public/                    # Static assets served directly
│   └── images/
│       ├── brand/            # Brand logos and symbols
│       └── products/         # Product photography
│
├── src/                       # Source code
│   ├── components/           # React components
│   │   ├── layout/          # Layout components (Header, Footer, Section, Container)
│   │   ├── sections/        # Page sections (Hero, Features, etc.)
│   │   ├── peptides/        # Peptide-specific components
│   │   └── ui/              # Reusable UI components (Button, Card, Typography)
│   │
│   ├── data/                # Static data files
│   ├── pages/               # Page components (Home, Library, COA, Contact)
│   ├── styles/              # CSS files (tokens, base, components, utilities)
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind imports
│
├── branding-kit/             # Original brand assets (reference only)
├── product_images/           # Original product images (reference only)
├── extra/                    # Design reference images
├── page-content/             # Content files
│
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
└── package.json              # Dependencies and scripts
```

---

## 🎨 Design System Architecture

### Color System

**Location:** `tailwind.config.js` + `src/styles/tokens.css`

```
Carbon (Black)
├── carbon-950: #000000
├── carbon-900: #000000  ← Primary dark color
├── carbon-800: #1a1a1a
└── carbon-700: #333333

Neutral (Greys)
├── neutral-50:  #F7F7F7  ← Lightest grey
├── neutral-100: #EDEDEE  ← Grey sections background
├── neutral-200: #DDDEDE  ← Borders
├── neutral-500: #7A7B7B  ← Muted text
└── neutral-900: #1A1B1B  ← Dark grey

Accent (Aqua)
├── accent:       #89D1D1  ← Primary accent
├── accent-light: #A5DEDE
├── accent-dark:  #6BBFBF
└── accent-muted: #E8F5F5

Backgrounds
├── platinum/grey: #F1F2F2  ← Page background
└── white: #FFFFFF          ← Cards/elevated surfaces
```

### Typography Scale

**Location:** `src/components/ui/Typography.tsx` + `tailwind.config.js`

```
Headings (Heading component)
├── level 1: text-2xl md:text-3xl lg:text-4xl (Hero titles)
├── level 2: text-lg md:text-xl lg:text-2xl  (Section titles)
├── level 3: text-base md:text-lg             (Subsection titles)
├── level 4: text-sm md:text-base             (Card titles)
├── level 5: text-sm md:text-base             (Small headings)
└── level 6: text-xs                          (Tiny headings)

Text (Text component)
├── lead:    text-lg md:text-xl               (Large body text)
├── body:    text-base                        (Standard body text)
├── small:   text-sm                          (Small text)
└── caption: text-xs                          (Captions)

Label (Label component)
└── text-xs tracking-widest uppercase         (Labels, tags)
```

### Spacing System

**Location:** `src/components/layout/Section.tsx`

```
Section Spacing
├── sm:   py-12 md:py-16
├── md:   py-16 md:py-20 lg:py-24
├── lg:   py-20 md:py-24 lg:py-28
├── xl:   py-20 md:py-28 lg:py-32
├── 2xl:  py-28 md:py-44 lg:py-56
└── 3xl:  py-32 md:py-52 lg:py-64
```

---

## 🔄 Component Hierarchy

### App Flow

```
App.tsx
│
├── Router
│   ├── Header (always visible)
│   │   ├── Logo
│   │   ├── Navigation Links
│   │   └── Search Button
│   │
│   ├── Routes
│   │   ├── / → Home.tsx
│   │   ├── /library → Library.tsx
│   │   ├── /coa → COA.tsx
│   │   ├── /contact → Contact.tsx
│   │   └── * → NotFound.tsx
│   │
│   └── Footer (always visible)
│       ├── Logo
│       ├── Link Groups
│       └── Bottom Bar
```

### Home Page Structure

```
Home.tsx
│
├── Hero (Aqua background, white buttons, larger text)
├── TrustBar
├── FeaturedProducts
├── PeptideToggleSection (Aqua active tabs)
├── ResearchCategories
├── Disclaimer (Black box with white text)
└── CTASection (Aqua background, text and buttons only)
```

---

## 📦 Component Inventory

### Layout Components
**Location:** `src/components/layout/`

| Component | Purpose | Props | Notes |
|-----------|---------|-------|-------|
| **Header** | Top navigation bar | None | Height: h-20 md:h-24, Logo: h-10 md:h-12, Nav: text-sm |
| **Footer** | Bottom site footer | None | 100% white text opacity |
| **Section** | Page section wrapper | background, spacing, container, className, id | |
| **Container** | Content width container | children, className | Max-width: 1280px |

### Section Components
**Location:** `src/components/sections/`

| Component | Purpose | Data Source | Background | Notes |
|-----------|---------|-------------|-----------|-------|
| **Hero** | Main hero section | Hardcoded | `accent` (aqua) | White buttons, larger text sizes |
| **TrustBar** | Trust indicators | Hardcoded | `dark` | |
| **FeaturedProducts** | Product showcase grid | `data/featuredProducts.ts` | `white` | |
| **PeptideToggleSection** | Filterable peptide list | `data/peptides.ts` | `neutral` | Aqua active tabs |
| **ResearchCategories** | Category showcase | Hardcoded | `accent` (aqua) | |
| **Disclaimer** | Legal disclaimer | Hardcoded | `white` | Black box with white text |
| **CTASection** | Call-to-action | Hardcoded | `accent` (aqua) | Text and buttons only, no cards |
| **Features** | ❌ REMOVED | Hardcoded | - | No longer on homepage |
| **TrustBadges** | ❌ UNUSED | `data/trustBadges.ts` | - | |
| **Testimonials** | ❌ UNUSED | `data/testimonials.ts` | - |
| **LabResults** | ❌ UNUSED | Hardcoded | - |

### UI Components
**Location:** `src/components/ui/`

| Component | Purpose | Variants | File |
|-----------|---------|----------|------|
| **Button** | Clickable actions | primary, secondary, white, outline, ghost, link | Button.tsx |
| **Card** | Content container | default, bordered, elevated | Card.tsx |
| **Badge** | Status indicators | default, success, warning, error | Badge.tsx |
| **Input** | Text input field | - | Input.tsx |
| **Textarea** | Multi-line text input | - | Textarea.tsx |
| **IconTile** | Icon container | light, muted | IconTile.tsx |
| **ToggleTabs** | Tab navigation | - | ToggleTabs.tsx |
| **TextLink** | Styled link | - | TextLink.tsx |
| **StatusMessage** | Status notifications | success, error, info | StatusMessage.tsx |
| **SectionTitle** | Section heading | - | SectionTitle.tsx |

### Typography Components
**Location:** `src/components/ui/Typography.tsx`

| Component | Purpose | Props |
|-----------|---------|-------|
| **Heading** | Headings (h1-h6) | level (1-6), className, as |
| **Text** | Body text | variant, weight, muted, tone, className, as |
| **Label** | Small labels | uppercase, muted, inheritColor, tone, className, as |

---

## 🗂️ Data Files

**Location:** `src/data/`

| File | Purpose | Used By | Status |
|------|---------|---------|--------|
| **featuredProducts.ts** | Featured product data | FeaturedProducts.tsx | ✅ Active |
| **peptides.ts** | All peptide data | PeptideToggleSection.tsx, Library.tsx | ✅ Active |
| **features.ts** | Feature descriptions | ❌ None | ⚠️ Unused |
| **trustBadges.ts** | Trust badge data | ❌ None | ⚠️ Unused |
| **testimonials.ts** | Testimonial data | ❌ None | ⚠️ Unused |

---

## 🎨 CSS Files

**Location:** `src/styles/`

| File | Purpose | Loaded In |
|------|---------|-----------|
| **tokens.css** | CSS custom properties (color variables) | main.tsx |
| **base.css** | Base HTML element styles | main.tsx |
| **components.css** | Component utility classes (.btn, .input) | main.tsx |
| **utilities.css** | Custom utility classes | main.tsx |
| **animations.css** | Animation keyframes | main.tsx |

**Import Order (main.tsx):**
```tsx
import './index.css';           // 1. Tailwind directives
import './styles/tokens.css';   // 2. CSS variables
import './styles/base.css';     // 3. Base styles
import './styles/components.css'; // 4. Components
import './styles/utilities.css';  // 5. Utilities
```

---

## 🔌 Third-Party Dependencies

**Location:** `package.json`

### Production Dependencies
- **react** (^18.3.1) - UI library
- **react-dom** (^18.3.1) - React DOM renderer
- **react-router-dom** (^7.13.2) - Client-side routing
- **lucide-react** (^0.344.0) - Icon library
- **@supabase/supabase-js** (^2.57.4) - Supabase client (if using backend)

### Development Dependencies
- **vite** (^5.4.2) - Build tool
- **typescript** (^5.5.3) - Type checking
- **tailwindcss** (^3.4.1) - CSS framework
- **autoprefixer** (^10.4.18) - CSS post-processor
- **eslint** (^9.9.1) - Code linting

---

## 🚀 Build & Development

### Available Scripts

```bash
npm run dev       # Start development server (port 5173)
npm run build     # Production build → /dist
npm run preview   # Preview production build
npm run typecheck # Run TypeScript type checking
npm run lint      # Run ESLint
```

### Build Process

1. **Vite** reads `index.html`
2. Processes `src/main.tsx` (entry point)
3. Bundles all imports
4. Processes Tailwind CSS
5. Outputs to `/dist`

### File Processing

```
Input                    →  Process               →  Output
──────────────────────────────────────────────────────────────
src/main.tsx             →  TypeScript + Bundle   →  dist/assets/index-[hash].js
src/index.css            →  Tailwind + PostCSS    →  dist/assets/index-[hash].css
public/images/           →  Copy                  →  dist/images/
index.html               →  Transform imports     →  dist/index.html
```

---

## 🔗 Component Relationships

### Section → UI Component Dependencies

```
Hero
├── Section
├── Button
└── Heading, Text

FeaturedProducts
├── Section
├── SectionTitle
│   ├── Label
│   ├── Heading
│   └── Text
├── Label
├── Text
└── Button

Features
├── Section
├── Heading
├── Text
└── Link (react-router-dom)

PeptideToggleSection
├── Section
├── SectionTitle
├── ToggleTabs
└── PeptideCard
    ├── Card
    ├── Badge
    ├── Heading
    └── Text

CTASection
├── Section
├── Button
├── IconTile
├── Heading
└── Text
```

### Data Flow

```
Data Files (src/data/)
│
├── featuredProducts.ts
│   └── imported by → FeaturedProducts.tsx
│
├── peptides.ts
│   ├── imported by → PeptideToggleSection.tsx
│   └── imported by → Library.tsx
│
└── [unused data files]
```

---

## 🎯 Section Background Colors (Homepage)

```
Header            bg-carbon-900  (#000000 black)
Hero              bg-accent      (#89D1D1 aqua) - White buttons, larger text
TrustBar          bg-dark        (#000000 black)
FeaturedProducts  bg-white       (#FFFFFF white)
PeptideToggle     bg-neutral     (#EDEDEE grey) - Aqua active tabs
ResearchCat       bg-accent      (#89D1D1 aqua)  ← BOLD moment
Disclaimer        bg-white       (#FFFFFF white) - Black box with white text
CTASection        bg-accent      (#89D1D1 aqua) - Text and buttons only
Footer            bg-carbon-900  (#000000 black) - 100% white text
```

**Pattern:** Black → Aqua → Black → White → Grey → Aqua → White → Aqua → Black

**Note:** Features (Analytical Transparency) section has been removed from homepage.

---

## 📱 Responsive Breakpoints

**Tailwind Default Breakpoints (used throughout):**

```
sm:  640px   (small tablets)
md:  768px   (tablets)
lg:  1024px  (laptops)
xl:  1280px  (desktops)
2xl: 1536px  (large screens)
```

### Component Responsive Behavior

- **Header:** Collapses to mobile menu on `lg` breakpoint
- **Section spacing:** Increases padding at `md` and `lg` breakpoints
- **Grid layouts:**
  - FeaturedProducts: `grid-cols-2 md:grid-cols-4`
  - PeptideToggle: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Typography:** Most headings scale up at `md` and `lg`

---

## 🔍 How to Find Things

### "Where is the homepage content?"
→ `src/pages/Home.tsx` imports sections from `src/components/sections/`

### "Where are the colors defined?"
→ `tailwind.config.js` (Tailwind utilities)
→ `src/styles/tokens.css` (CSS variables)

### "How do I change button styles?"
→ `src/components/ui/Button.tsx` (component)
→ `src/styles/components.css` (.btn base styles)

### "Where is the product data?"
→ `src/data/featuredProducts.ts` (featured 8 products)
→ `src/data/peptides.ts` (all peptides)

### "How do I add a new section to homepage?"
1. Create component in `src/components/sections/`
2. Import it in `src/pages/Home.tsx`
3. Add between other sections in desired order

### "Where are the brand logos?"
→ `public/images/brand/` (used in production)
→ `branding-kit/` (original source files)

---

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| **tailwind.config.js** | Tailwind CSS configuration (colors, fonts, spacing) |
| **tsconfig.json** | TypeScript compiler options |
| **tsconfig.app.json** | TypeScript config for app code |
| **tsconfig.node.json** | TypeScript config for build tools |
| **vite.config.ts** | Vite build tool configuration |
| **postcss.config.js** | PostCSS plugins (Tailwind, Autoprefixer) |
| **eslint.config.js** | ESLint linting rules |
| **package.json** | Dependencies, scripts, metadata |

---

**For detailed component APIs, see:** `COMPONENT-API.md`
**For design guidelines, see:** `DESIGN-GUIDELINES.md`
**For file relationships, see:** `FILE-RELATIONSHIPS.md`
