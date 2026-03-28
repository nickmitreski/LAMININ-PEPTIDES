# Design Guidelines
**Visual design principles and usage rules**

---

## 🎨 Color Usage Guide

### When to Use Each Color

#### Pure Black (`#000000`)
**Tailwind:** `carbon-900`, `carbon-950`, `bg-carbon-900`, `text-carbon-900`

**Use for:**
- Header background
- Footer background
- Primary text color
- Dark section backgrounds
- Primary buttons

**Examples:**
```tsx
<Section background="dark">  // Black section
<Button variant="primary">   // Black button
<Text className="text-carbon-900">  // Black text
```

**Don't use for:**
- ❌ Borders (too harsh) - use neutral-200 instead
- ❌ Muted text (too strong) - use neutral-500 instead

---

#### Aqua Accent (`#89D1D1`)
**Tailwind:** `accent`, `bg-accent`, `text-accent`

**Use for:**
- Hero section background (primary brand moment)
- ResearchCategories section background (secondary brand moment)
- Section title labels
- Accent elements
- Secondary buttons
- Active navigation link background (in header)

**Examples:**
```tsx
<Section background="accent">  // Aqua section
<Button variant="secondary">   // Aqua button
<Label tone="accent">FEATURED</Label>
```

**Rules:**
- Use sparingly - only 2 sections per page maximum
- Always pair with dark text (`text-carbon-900`)
- Never use for body text

**Don't use for:**
- ❌ More than 2 sections per page (dilutes impact)
- ❌ Small UI elements (too prominent)
- ❌ Text on white backgrounds (not enough contrast)

---

#### White (`#FFFFFF`)
**Tailwind:** `white`, `bg-white`, `text-white`

**Use for:**
- Card backgrounds
- Elevated surfaces
- Content section backgrounds
- Text on dark backgrounds
- White buttons (on aqua or dark backgrounds)
- Hero section buttons
- CTA section buttons

**Examples:**
```tsx
<Section background="white">
<Card variant="default">
<Text tone="inverse">  // White text on dark
<Button variant="white">  // White button on dark
```

**Don't use for:**
- ❌ Page background (use platinum instead)

---

#### Platinum Grey (`#F1F2F2`)
**Tailwind:** `platinum`, `bg-platinum`

**Use for:**
- Page background (body)
- Light subtle backgrounds

**Examples:**
```tsx
<body className="bg-platinum">
```

---

#### Neutral Grey (`#EDEDEE`)
**Tailwind:** `neutral-100`, `bg-neutral-100`

**Use for:**
- Alternating section backgrounds
- Product image container backgrounds
- Subtle background variety

**Examples:**
```tsx
<Section background="neutral">
<div className="bg-neutral-100">
```

**Rules:**
- Alternate with white sections for visual rhythm
- Use for sections that need subtle differentiation

---

#### Muted Text Grey (`#7A7B7B`)
**Tailwind:** `neutral-500`, `text-neutral-500`

**Use for:**
- Secondary/muted text
- Descriptions
- Captions
- Labels

**Examples:**
```tsx
<Text muted>Secondary information</Text>
<Label>CATEGORY</Label>
```

---

#### Border Grey (`#DDDEDE`)
**Tailwind:** `neutral-200`, `border-neutral-200`

**Use for:**
- Card borders
- Input borders
- Dividers

**Examples:**
```tsx
<Card variant="bordered">
<Input className="border-neutral-200">
```

---

### Color Combinations

#### ✅ Good Combinations

**Black + White:**
```tsx
<Section background="dark">
  <Text tone="inverse">White text on black</Text>
</Section>
```

**Aqua + Black text:**
```tsx
<Section background="accent">
  <Heading level={1}>Black text on aqua</Heading>
</Section>
```

**White + Black text:**
```tsx
<Section background="white">
  <Heading level={2}>Black text on white</Heading>
</Section>
```

**Neutral Grey + Black text:**
```tsx
<Section background="neutral">
  <Text>Black text on grey</Text>
</Section>
```

#### ❌ Bad Combinations

**Aqua text on white:**
```tsx
// DON'T DO THIS - not enough contrast
<Text className="text-accent">Text</Text>
```

**Black backgrounds next to each other:**
```tsx
// DON'T DO THIS - no visual separation
<Section background="dark">...</Section>
<Section background="dark">...</Section>
```

**Too many aqua sections:**
```tsx
// DON'T DO THIS - dilutes brand impact
<Section background="accent">...</Section>
<Section background="accent">...</Section>
<Section background="accent">...</Section>
```

---

## 📐 Spacing & Layout

### Section Spacing

**Use these spacing sizes for vertical section padding:**

```tsx
// Tight spacing - minor sections
<Section spacing="sm">  // py-12 md:py-16

// Default spacing - most sections
<Section spacing="md">  // py-16 md:py-20 lg:py-24

// Generous spacing - important sections
<Section spacing="lg">  // py-20 md:py-24 lg:py-28

// Extra spacing - featured sections
<Section spacing="xl">  // py-20 md:py-28 lg:py-32

// Hero spacing - major sections
<Section spacing="2xl"> // py-28 md:py-44 lg:py-56

// Maximum spacing - rare use
<Section spacing="3xl"> // py-32 md:py-52 lg:py-64
```

**Guidelines:**
- Hero sections: Use `2xl` or `3xl`
- Content sections: Use `md` or `lg`
- Minor sections: Use `sm`
- Alternate spacing for rhythm

---

### Content Width

**Default site rail (Container `size="xl"`):** `max-w-[1600px]` — **1600px** fixed width, centered. This is wider than the old `max-w-7xl` (1280px) so header, grids, and section content use more horizontal space on large monitors without changing component structure.

**Horizontal padding:** `px-4 sm:px-5 md:px-6 lg:px-8` on `<Container>` (slightly tighter small breakpoints so the rail feels fuller at the same proportions).

**When to constrain width:**
```tsx
// Most sections (default)
<Section container={true}>
  Content is constrained
</Section>

// Manual container
<Container>
  <p>Content here</p>
</Container>
```

**When to go full-width:**
```tsx
// Full-width backgrounds, images
<Section container={false}>
  <div className="max-w-[1600px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
    Custom width constraint
  </div>
</Section>
```

### Visual scale (“zoomed in” look)

From **`md` (768px) and up**, `src/index.css` sets `html { font-size: 106.25%; }` (17px root vs 16px). Because Tailwind spacing and typography use **rem**, padding, gaps, and type scale up together—similar to a small browser zoom—while breakpoints stay the same. Mobile stays at 100% for comfort.

---

### Grid Layouts

**Product grids:**
```tsx
// 2 cols mobile, 4 cols desktop
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

// 1 col mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Gap sizes:**
- `gap-4` - Tight (16px)
- `gap-6` - Default (24px) - **Use this most**
- `gap-8` - Generous (32px)
- `gap-12` - Extra (48px)

---

## 📝 Typography

### Heading Hierarchy

**Use semantic heading levels correctly:**

```tsx
// Page title - ONLY ONE per page
<Heading level={1}>LABORATORY VERIFIED PEPTIDES</Heading>

// Section titles - multiple per page
<Heading level={2}>Research Compounds</Heading>

// Subsection titles
<Heading level={3}>Analytical Transparency</Heading>

// Card titles
<Heading level={4}>BPC-157 + TB-500</Heading>
```

**Rules:**
- Only ONE `level={1}` per page (usually in Hero)
- Use `level={2}` for main section headings
- Don't skip levels (e.g., h1 → h3)
- All headings are uppercase by default

---

### Text Variants

```tsx
// Large intro text (18-20px)
<Text variant="lead">
  High purity compounds supported by analytical testing
</Text>

// Standard body text (16px) - DEFAULT
<Text>
  Each batch is tested for purity and identity.
</Text>

// Small text (14px)
<Text variant="small">
  For research use only
</Text>

// Caption text (12px)
<Text variant="caption">$79.00</Text>
```

**Guidelines:**
- Use `lead` for section introductions
- Use default `body` for most content
- Use `small` for secondary information
- Use `caption` for metadata, prices

---

### Text Weights

```tsx
// Light text (300) - elegant, airy
<Text weight="light">Elegant light text</Text>

// Normal text (400) - DEFAULT
<Text>Standard text</Text>

// Medium text (500) - emphasis
<Text weight="medium">Important text</Text>
```

**Guidelines:**
- Use `light` sparingly for elegant moments
- Use `normal` (default) for most content
- Use `medium` for emphasis, not everywhere

---

### Muted Text

```tsx
// Grey text (neutral-500)
<Text muted>Secondary information</Text>

// Also works with variant
<Text variant="small" muted>
  Small grey text
</Text>
```

**Use muted text for:**
- Descriptions
- Metadata
- Timestamps
- Secondary information

**Don't use muted text for:**
- Primary headings
- Important CTAs
- Key information

---

### Labels

```tsx
// Default label (uppercase, grey, 12px)
<Label>PEPTIDE LIBRARY</Label>

// Inherit parent color
<Label inheritColor>SEMAX 10MG</Label>

// Accent colored
<Label tone="accent">FEATURED</Label>

// White on dark
<Label tone="inverse">FROM</Label>
```

**Use labels for:**
- Section categories
- Product names
- Tags
- Small headings

---

## 🔘 Button Usage

### When to Use Each Variant

#### Primary Button
**Use for:**
- Main call-to-action
- Form submissions
- Primary actions

```tsx
<Button variant="primary">Browse Collection</Button>
<Button>Add to Cart</Button>  // Default is primary
```

**Rules:**
- Only 1-2 primary buttons per section
- Always the most important action

---

#### Secondary Button
**Use for:**
- Alternative actions
- Less important CTAs
- Actions on dark backgrounds (stands out more)

```tsx
<Button variant="secondary">View Lab Results</Button>
```

---

#### White Button
**Use for:**
- Actions on dark backgrounds
- When primary black button would blend in

```tsx
<Section background="dark">
  <Button variant="white">Contact Us</Button>
</Section>
```

**Don't use on:**
- White backgrounds (invisible)
- Light grey backgrounds (low contrast)

---

#### Outline Button
**Use for:**
- Tertiary actions
- "Learn more" type links
- Less prominent CTAs

```tsx
<Button variant="outline">Learn More</Button>
```

---

#### Ghost Button
**Use for:**
- Very subtle actions
- Menu items
- Inline actions

```tsx
<Button variant="ghost">Cancel</Button>
```

---

#### Link Button
**Use for:**
- Inline text links
- "View all" type links
- Minimal emphasis

```tsx
<Button variant="link">View All Products →</Button>
```

---

### Button Sizing

```tsx
// Small - compact spaces
<Button size="sm">Apply</Button>

// Medium - DEFAULT
<Button>Continue</Button>

// Large - hero CTAs
<Button size="lg">Get Started</Button>
```

---

### Button Groups

**Horizontal layout:**
```tsx
<div className="flex gap-4">
  <Button variant="primary">Primary Action</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

**Stacked on mobile:**
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <Button fullWidth>Mobile Full Width</Button>
  <Button fullWidth>Mobile Full Width</Button>
</div>
```

---

## 🖼️ Images & Assets

### Product Images

**Requirements:**
- Square aspect ratio (1:1)
- Transparent background PNG
- Centered product
- Minimum 800x800px

**Usage:**
```tsx
<div className="aspect-square bg-neutral-50 rounded-lg overflow-hidden">
  <img
    src="/images/products/semax-10mg.png"
    alt="SEMAX 10MG"
    className="w-full h-full object-contain p-4"
  />
</div>
```

**Rules:**
- Always use `object-contain` (not `object-cover`)
- Add padding inside container (`p-4`)
- Use `bg-neutral-50` for subtle grey background
- Always include alt text

---

### Logo Usage

**Header logo:**
```tsx
<img
  src="/images/brand/logo-white.png"
  alt="Laminin Peptide Lab"
  className="h-10 md:h-12 w-auto"
/>
```
**Note:** Updated March 28, 2026 - Logo increased to h-10 md:h-12 for better visibility

**Footer logo:**
```tsx
<img
  src="/images/brand/logo-white.png"
  alt="Laminin Peptide Lab"
  className="h-6 w-auto"
/>
```

**Available logos:**
- `logo-white.png` - For dark backgrounds (header, footer)
- `logo-colour.png` - For light backgrounds
- `logo-black.png` - For light backgrounds
- `logo-reverse.png` - Alternative reverse version

**Rules:**
- Use white logo on black/dark backgrounds
- Use color/black logo on white/light backgrounds
- Never stretch - use `w-auto` with fixed height

---

### Watermarks

**Laminin symbol watermark:**
```tsx
<div className="relative">
  <img
    src="/images/brand/symbol-teal-circle.png"
    alt=""
    className="absolute right-0 md:right-[-5%] top-1/2 -translate-y-1/2 w-[300px] md:w-[400px] opacity-[0.18] pointer-events-none select-none"
    aria-hidden="true"
  />
  <div className="relative z-10">
    Content here
  </div>
</div>
```

**Rules:**
- Always `aria-hidden="true"` and empty alt
- Use `pointer-events-none select-none`
- Low opacity (0.15 - 0.20)
- Position absolute
- Content needs `relative z-10`

---

## 📱 Responsive Design

### Breakpoints

```
sm:  640px   - Small tablets
md:  768px   - Tablets
lg:  1024px  - Laptops
xl:  1280px  - Desktops
2xl: 1536px  - Large screens
```

### Mobile-First Approach

**Always write mobile styles first, then add larger breakpoints:**

```tsx
// ✅ GOOD - Mobile first
<Heading className="text-2xl md:text-3xl lg:text-4xl">

// ❌ BAD - Desktop first
<Heading className="text-4xl md:text-3xl sm:text-2xl">
```

---

### Common Patterns

**Stack on mobile, row on desktop:**
```tsx
<div className="flex flex-col md:flex-row gap-6">
```

**1 column mobile, 2 tablet, 3 desktop:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Hide on mobile:**
```tsx
<div className="hidden md:block">Desktop only</div>
```

**Show only on mobile:**
```tsx
<div className="block md:hidden">Mobile only</div>
```

**Responsive padding:**
```tsx
<div className="px-4 md:px-6 lg:px-8">
```

**Responsive text size:**
```tsx
<Text className="text-sm md:text-base lg:text-lg">
```

---

## 🎯 Section Background Patterns

### Homepage Background Flow

```
Hero              → Aqua    (#89D1D1) - White buttons, larger text
TrustBar          → Black   (#000000)
FeaturedProducts  → White   (#FFFFFF)
PeptideToggle     → Grey    (#EDEDEE) - Three pillar cards
ResearchCat       → Aqua    (#89D1D1) ← BOLD moment
Disclaimer        → White   (#FFFFFF) - Black box with white text
CTASection        → Aqua    (#89D1D1) - Text and buttons only
```

**Pattern:** Aqua → Black → White → Grey → Aqua → White → Aqua

**Note:** Features (Analytical Transparency) section has been removed.

**Guidelines:**
- Start with aqua hero (brand impact)
- Use THREE aqua sections total (Hero, ResearchCategories, CTA)
- Alternate between white and grey for content sections
- End with aqua CTA (strong brand finish)
- Never put same color backgrounds adjacent (except Hero and CTA at opposite ends)

---

### Background Selection Rules

**Use Aqua (`background="accent"`) for:**
- Hero sections (always)
- One additional featured section maximum
- Brand moments

**Use Black (`background="dark"`) for:**
- Trust bars
- CTA sections
- Footer areas
- High-contrast moments

**Use White (`background="white"`) for:**
- Content-heavy sections
- Product showcases
- Text-focused areas

**Use Grey (`background="neutral"`) for:**
- Alternating content sections
- Visual separation from white sections
- Less important sections

---

## 🧩 Component Composition

### Cards

**Product card:**
```tsx
<Link to="/library" className="group">
  <div className="aspect-square bg-neutral-50 rounded-lg overflow-hidden mb-4">
    <img
      src={product.image}
      alt={product.name}
      className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
    />
  </div>
  <Label inheritColor>{product.name}</Label>
  <Text variant="caption" muted>{product.price}</Text>
</Link>
```

**Content card:**
```tsx
<Card padding="lg">
  <Heading level={4} className="mb-4">Title</Heading>
  <Text>Content description here.</Text>
</Card>
```

---

### Section Headers

**Standard section header:**
```tsx
<SectionTitle
  label="CATEGORY"
  title="Main Section Title"
  subtitle="Optional description text"
/>
```

**Custom section header:**
```tsx
<div className="text-center mb-12">
  <Label className="mb-4">LABEL</Label>
  <Heading level={2} className="mb-4">Title</Heading>
  <Text variant="lead" muted>Subtitle</Text>
</div>
```

---

### Icon + Text

**Icon tile with text:**
```tsx
<div className="flex flex-col items-center text-center">
  <IconTile variant="light" className="mb-4">
    <Shield className="w-6 h-6 text-accent" />
  </IconTile>
  <Heading level={5} className="mb-2">Feature Title</Heading>
  <Text variant="small" muted>Description</Text>
</div>
```

---

## ⚠️ Common Mistakes to Avoid

### Color Mistakes

❌ **Using aqua text on white:**
```tsx
<Text className="text-accent">Text</Text>  // Not enough contrast
```

✅ **Use for labels only:**
```tsx
<Label tone="accent">LABEL</Label>  // OK - small, uppercase
```

---

❌ **Multiple aqua sections:**
```tsx
<Section background="accent">...</Section>
<Section background="white">...</Section>
<Section background="accent">...</Section>  // Too much aqua
```

✅ **Maximum 2 aqua sections:**
```tsx
<Section background="accent">Hero</Section>
<Section background="neutral">...</Section>
<Section background="accent">Featured</Section>  // OK
```

---

### Spacing Mistakes

❌ **Inconsistent section spacing:**
```tsx
<Section className="py-20">  // Custom padding
<Section className="py-16">  // Different padding
```

✅ **Use spacing prop:**
```tsx
<Section spacing="xl">  // Consistent
<Section spacing="lg">  // Consistent
```

---

### Typography Mistakes

❌ **Multiple h1 headings:**
```tsx
<Heading level={1}>First Title</Heading>
<Heading level={1}>Second Title</Heading>  // Bad for SEO
```

✅ **Only one h1:**
```tsx
<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section</Heading>
```

---

❌ **Skipping heading levels:**
```tsx
<Heading level={1}>Title</Heading>
<Heading level={3}>Subtitle</Heading>  // Skipped h2
```

✅ **Sequential heading levels:**
```tsx
<Heading level={1}>Title</Heading>
<Heading level={2}>Subtitle</Heading>
```

---

### Image Mistakes

❌ **Using object-cover for products:**
```tsx
<img className="object-cover" />  // Crops product
```

✅ **Use object-contain:**
```tsx
<img className="object-contain" />  // Shows full product
```

---

❌ **Stretched logos:**
```tsx
<img src={logo} className="w-32 h-16" />  // Stretched
```

✅ **Preserve aspect ratio:**
```tsx
<img src={logo} className="h-8 w-auto" />  // Natural ratio
```

---

## 🎨 Design Principles

### Minimalism
- Use whitespace generously
- Don't over-decorate
- Let content breathe
- Remove unnecessary elements

### Hierarchy
- Clear visual hierarchy with typography
- Size indicates importance
- Use contrast to guide attention
- Group related content

### Consistency
- Use design system components
- Follow established patterns
- Maintain visual rhythm
- Repeat successful patterns

### Accessibility
- Sufficient color contrast
- Semantic HTML
- Alt text for images
- Keyboard navigation support

---

**Last Updated:** March 28, 2026
