# Component API Reference
**Complete props documentation for all components**

---

## 🎨 UI Components

### Typography Components

#### `<Heading>`
**Location:** `src/components/ui/Typography.tsx`

Semantic heading component with 6 levels and responsive sizing.

**Props:**
```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;  // Required - h1 through h6
  className?: string;              // Optional - additional classes
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';  // Override HTML tag
  children: ReactNode;
}
```

**Usage:**
```tsx
// Large hero title
<Heading level={1}>LABORATORY VERIFIED PEPTIDES</Heading>

// Section title
<Heading level={2}>Research Compounds</Heading>

// Card title
<Heading level={4}>BPC-157 + TB-500</Heading>
```

**Default Sizes:**
- Level 1: `text-2xl md:text-3xl lg:text-4xl` (Hero titles)
- Level 2: `text-lg md:text-xl lg:text-2xl` (Section titles)
- Level 3: `text-base md:text-lg` (Subsection titles)
- Level 4: `text-sm md:text-base` (Card titles)
- Level 5: `text-sm md:text-base` (Small headings)
- Level 6: `text-xs` (Tiny headings)

**All headings have:**
- `font-light` (300 weight)
- `tracking-luxury` (0.05em letter spacing)
- `uppercase`

---

#### `<Text>`
**Location:** `src/components/ui/Typography.tsx`

Body text component with variants, weights, and tones.

**Props:**
```typescript
interface TextProps {
  variant?: 'lead' | 'body' | 'small' | 'caption';
  weight?: 'light' | 'normal' | 'medium';
  muted?: boolean;
  tone?: 'default' | 'muted' | 'inverse' | 'inverse-muted';
  className?: string;
  as?: 'p' | 'span' | 'div';
  children: ReactNode;
}
```

**Usage:**
```tsx
// Large intro text
<Text variant="lead">
  High purity compounds supported by analytical testing
</Text>

// Standard body text
<Text variant="body">
  Each batch is tested for purity and identity.
</Text>

// Small muted text
<Text variant="small" muted>
  For research use only
</Text>

// Caption text
<Text variant="caption">$79.00</Text>

// White text on dark background
<Text tone="inverse">Text on dark background</Text>
```

**Variants:**
- `lead`: `text-lg md:text-xl` - Large body text
- `body`: `text-base` - Standard text (default)
- `small`: `text-sm` - Small text
- `caption`: `text-xs` - Tiny text

**Weights:**
- `light`: `font-light` (300)
- `normal`: `font-normal` (400) - default
- `medium`: `font-medium` (500)

**Tones:**
- `default`: Normal text color
- `muted`: `text-neutral-500` - Grey text
- `inverse`: `text-white` - White text
- `inverse-muted`: `text-white/50` - Faded white

**Muted prop:**
- When `muted={true}`, applies `text-neutral-500` automatically

---

#### `<Label>`
**Location:** `src/components/ui/Typography.tsx`

Small uppercase labels and tags.

**Props:**
```typescript
interface LabelProps {
  uppercase?: boolean;      // Default: true
  muted?: boolean;
  inheritColor?: boolean;   // Inherit parent color
  tone?: 'default' | 'muted' | 'inverse' | 'inverse-muted' | 'accent';
  className?: string;
  as?: 'span' | 'p' | 'label';
  children: ReactNode;
}
```

**Usage:**
```tsx
// Default label (muted grey, uppercase)
<Label>PEPTIDE LIBRARY</Label>

// Inherit parent color
<Label inheritColor>SEMAX 10MG</Label>

// Accent color label
<Label tone="accent">FEATURED</Label>

// White label on dark background
<Label tone="inverse">FROM</Label>
```

**Default Styling:**
- `text-xs` (12px)
- `tracking-widest` (0.1em)
- `uppercase` (unless `uppercase={false}`)
- `font-medium` (500 weight)

**Tones:**
- `default`: `text-neutral-500` - Grey
- `muted`: `text-neutral-400` - Light grey
- `inverse`: `text-white` - White
- `inverse-muted`: `text-white/50` - Faded white
- `accent`: `text-accent` - Aqua

---

### Button Component

#### `<Button>`
**Location:** `src/components/ui/Button.tsx`

Primary interactive button with multiple variants.

**Props:**
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'white' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
// Primary button (default)
<Button>Browse Collection</Button>

// Secondary button
<Button variant="secondary">View Lab Results</Button>

// White button (for dark backgrounds)
<Button variant="white">Contact Us</Button>

// Outline button
<Button variant="outline">Learn More</Button>

// Small button
<Button size="sm">Apply</Button>

// Full width button
<Button fullWidth>Submit</Button>

// Link-style button
<Button variant="link">View All</Button>
```

**Variants:**

**Primary** (default):
- Background: `bg-carbon-900` (black)
- Text: `text-white`
- Hover: `hover:bg-carbon-800`

**Secondary**:
- Background: `bg-accent` (aqua)
- Text: `text-carbon-900`
- Hover: `hover:bg-accent-dark`

**White**:
- Background: `bg-white`
- Text: `text-carbon-900`
- Hover: `hover:bg-neutral-50`
- Use on dark backgrounds

**Outline**:
- Border: `border border-carbon-900`
- Background: `transparent`
- Text: `text-carbon-900`
- Hover: `hover:bg-carbon-900 hover:text-white`

**Ghost**:
- Background: `transparent`
- Text: `text-carbon-900`
- Hover: `hover:bg-neutral-100`

**Link**:
- No background
- Underline on hover
- Minimal padding

**Sizes:**
- `sm`: `px-4 py-2 text-xs`
- `md`: `px-6 py-3 text-sm` (default)
- `lg`: `px-8 py-4 text-base`

---

### Card Component

#### `<Card>`
**Location:** `src/components/ui/Card.tsx`

Content container for grouped information.

**Props:**
```typescript
interface CardProps {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: ReactNode;
}
```

**Usage:**
```tsx
// Default card (white background, subtle shadow)
<Card>
  <Heading level={4}>Title</Heading>
  <Text>Content here</Text>
</Card>

// Bordered card
<Card variant="bordered">
  Content with border
</Card>

// Elevated card (more shadow)
<Card variant="elevated">
  Content with elevation
</Card>

// Custom padding
<Card padding="xl">
  Extra padding
</Card>
```

**Variants:**

**Default**:
- `bg-white`
- `rounded-lg`
- `shadow-sm`

**Bordered**:
- `bg-white`
- `border border-neutral-200`
- `rounded-lg`

**Elevated**:
- `bg-white`
- `rounded-lg`
- `shadow-lg`

**Padding:**
- `sm`: `p-4`
- `md`: `p-6` (default)
- `lg`: `p-8`
- `xl`: `p-10`

---

### Badge Component

#### `<Badge>`
**Location:** `src/components/ui/Badge.tsx`

Small status indicator or tag.

**Props:**
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
// Default badge
<Badge>New</Badge>

// Success badge
<Badge variant="success">In Stock</Badge>

// Warning badge
<Badge variant="warning">Low Stock</Badge>

// Error badge
<Badge variant="error">Out of Stock</Badge>

// Accent badge
<Badge variant="accent">Featured</Badge>

// Small badge
<Badge size="sm">Sale</Badge>
```

**Variants:**
- `default`: Grey background
- `success`: Green background
- `warning`: Yellow background
- `error`: Red background
- `accent`: Aqua background

---

### Input Component

#### `<Input>`
**Location:** `src/components/ui/Input.tsx`

Text input field.

**Props:**
```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}
```

**Usage:**
```tsx
// Basic input
<Input placeholder="Enter email" />

// Input with label
<Input label="Email Address" type="email" />

// Input with error
<Input label="Email" error="Email is required" />

// Full width input
<Input fullWidth placeholder="Search peptides..." />
```

**Styling:**
- Base class: `.input` from `src/styles/components.css`
- Border: `border border-neutral-200`
- Padding: `px-4 py-3`
- Rounded: `rounded-lg`
- Focus: Blue ring

---

### Textarea Component

#### `<Textarea>`
**Location:** `src/components/ui/Textarea.tsx`

Multi-line text input.

**Props:**
```typescript
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}
```

**Usage:**
```tsx
// Basic textarea
<Textarea placeholder="Enter message" rows={4} />

// Textarea with label
<Textarea label="Message" rows={6} />

// Textarea with error
<Textarea label="Message" error="Message is required" />
```

---

### IconTile Component

#### `<IconTile>`
**Location:** `src/components/ui/IconTile.tsx`

Container for icons with background.

**Props:**
```typescript
interface IconTileProps {
  children: ReactNode;  // Icon component
  variant?: 'light' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Usage:**
```tsx
import { Shield } from 'lucide-react';

<IconTile variant="light">
  <Shield className="w-6 h-6" />
</IconTile>

<IconTile variant="muted" size="lg">
  <Beaker className="w-8 h-8" />
</IconTile>
```

**Variants:**
- `light`: Light background with border
- `muted`: Grey background

**Sizes:**
- `sm`: `w-10 h-10`
- `md`: `w-12 h-12` (default)
- `lg`: `w-16 h-16`

---

### ToggleTabs Component

#### `<ToggleTabs>`
**Location:** `src/components/ui/ToggleTabs.tsx`

Tab navigation for filtering content.

**Props:**
```typescript
interface ToggleTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}
```

**Usage:**
```tsx
const [activeTab, setActiveTab] = useState('All');

<ToggleTabs
  tabs={['All', 'Performance', 'Recovery', 'Cognitive']}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

**Styling:**
- Inactive tabs: Grey background, dark text
- Active tab: Dark background, white text
- Rounded pill design
- Mobile-friendly scrolling

---

### SectionTitle Component

#### `<SectionTitle>`
**Location:** `src/components/ui/SectionTitle.tsx`

Standardized section header with label, title, and subtitle.

**Props:**
```typescript
interface SectionTitleProps {
  label?: string;       // Small uppercase label
  title: string;        // Main heading
  subtitle?: string;    // Description text
  centered?: boolean;   // Center align (default: true)
  className?: string;
}
```

**Usage:**
```tsx
// Full section title
<SectionTitle
  label="PEPTIDE LIBRARY"
  title="High Purity Peptides for Advanced Research"
  subtitle="Laboratory-grade compounds with verified purity"
/>

// Title only
<SectionTitle title="Research Compounds" />

// Left-aligned
<SectionTitle
  title="Product Categories"
  centered={false}
/>
```

**Rendering:**
- Label: Uses `<Label>` component
- Title: Uses `<Heading level={2}>`
- Subtitle: Uses `<Text variant="lead">`
- Spacing: `mb-12` bottom margin

---

## 🧱 Layout Components

### Section Component

#### `<Section>`
**Location:** `src/components/layout/Section.tsx`

Page section wrapper with consistent spacing and backgrounds.

**Props:**
```typescript
interface SectionProps {
  background?: 'white' | 'elevated' | 'neutral' | 'dark' | 'accent' | 'none';
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  container?: boolean;  // Default: true
  className?: string;
  id?: string;
  children: ReactNode;
}
```

**Usage:**
```tsx
// White section with default spacing
<Section background="white">
  Content here
</Section>

// Grey section with extra spacing
<Section background="neutral" spacing="xl">
  Content here
</Section>

// Dark section
<Section background="dark">
  White text content
</Section>

// Aqua section
<Section background="accent">
  Content with aqua background
</Section>

// No container (full width content)
<Section container={false}>
  Full width content
</Section>

// Section with ID for anchor links
<Section id="products">
  Products
</Section>
```

**Backgrounds:**
- `white`: True white (`bg-white`)
- `elevated`: Same as white
- `neutral`: Grey (`bg-neutral-100`)
- `dark`: Black with white text (`bg-carbon-900 text-white`)
- `accent`: Aqua (`bg-accent text-carbon-900`)
- `none`: No background

**Spacing (vertical padding):**
- `sm`: `py-12 md:py-16`
- `md`: `py-16 md:py-20 lg:py-24` (default)
- `lg`: `py-20 md:py-24 lg:py-28`
- `xl`: `py-20 md:py-28 lg:py-32`
- `2xl`: `py-28 md:py-44 lg:py-56`
- `3xl`: `py-32 md:py-52 lg:py-64`

**Container:**
- When `container={true}` (default), wraps content in `<Container>`
- When `container={false}`, no width constraint

---

### Container Component

#### `<Container>`
**Location:** `src/components/layout/Container.tsx`

Content width container with max-width.

**Props:**
```typescript
interface ContainerProps {
  children: ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
<Container>
  <h1>Content constrained to max width</h1>
</Container>

<Container className="py-8">
  Custom padding
</Container>
```

**Styling:**
- Max width: `max-w-screen-xl` (1280px)
- Horizontal padding: `px-6 md:px-8`
- Centered: `mx-auto`

---

### Header Component

#### `<Header>`
**Location:** `src/components/layout/Header.tsx`

Top navigation bar with sticky positioning.

**Props:** None (managed internally)

**Features:**
- Sticky positioning (`sticky top-0`)
- Mobile menu toggle
- Active route highlighting
- Responsive design

**Sizing:**
- Height: `h-20 md:h-24` (80px mobile, 96px desktop)
- Logo: `h-10 md:h-12` (40px mobile, 48px desktop)
- Nav links: `text-sm` (14px)
- Search button: `size="md"` (medium)
- Mobile menu icon: `size={22}` (22px)

**Navigation:**
- Desktop: Horizontal nav with links
- Mobile: Hamburger menu with dropdown

**Updated:** March 28, 2026 - Increased all sizes for better visibility

---

## 🧩 Section Components

### Hero Component

#### `<Hero>`
**Location:** `src/components/sections/Hero.tsx`

Main hero section with title, subtitle, and CTAs.

**Props:** None (static content)

**Usage:**
```tsx
<Hero />
```

**Content Structure:**
- Aqua background (`background="accent"`)
- Large heading: "LABORATORY VERIFIED PEPTIDES"
- Subtitle about purity and testing
- Two CTAs: "Browse Collection" and "View Lab Results"

---

### TrustBar Component

#### `<TrustBar>`
**Location:** `src/components/sections/TrustBar.tsx`

Trust indicators bar with key stats.

**Props:** None (static content)

**Usage:**
```tsx
<TrustBar />
```

**Content:**
- Dark background
- Three trust indicators (e.g., "99%+ Purity", "COA Verified", etc.)

---

### FeaturedProducts Component

#### `<FeaturedProducts>`
**Location:** `src/components/sections/FeaturedProducts.tsx`

Product showcase grid with 8 featured products.

**Props:** None (uses data from `src/data/featuredProducts.ts`)

**Usage:**
```tsx
<FeaturedProducts />
```

**Features:**
- White background
- 2 columns mobile, 4 columns desktop
- Links to `/library` page
- Hover effects on product cards

---

### Features Component

#### `<Features>`
**Location:** `src/components/sections/Features.tsx`

Analytical transparency section with watermark.

**Props:** None (static content)

**Usage:**
```tsx
<Features />
```

**Content:**
- Grey background with watermark
- White card overlay
- List of analytical features

---

### PeptideToggleSection Component

#### `<PeptideToggleSection>`
**Location:** `src/components/sections/PeptideToggleSection.tsx`

Filterable peptide display with category tabs.

**Props:** None (uses data from `src/data/peptides.ts`)

**Usage:**
```tsx
<PeptideToggleSection />
```

**Features:**
- Grey background
- Category tabs for filtering
- Shows 6 peptides per category
- Responsive grid layout

---

### ResearchCategories Component

#### `<ResearchCategories>`
**Location:** `src/components/sections/ResearchCategories.tsx`

Category showcase with large product images.

**Props:** None (static content)

**Usage:**
```tsx
<ResearchCategories />
```

**Content:**
- Aqua background (bold visual moment)
- Three category cards
- Large product images

---

### Disclaimer Component

#### `<Disclaimer>`
**Location:** `src/components/sections/Disclaimer.tsx`

Legal disclaimer notice.

**Props:** None (static content)

**Usage:**
```tsx
<Disclaimer />
```

**Content:**
- White section background
- Black box (`bg-carbon-900`) with white text
- Warning icon (aqua accent)
- Research use disclaimer

**Design:**
- Stands out prominently on white background
- All text 100% white opacity for contrast

---

### CTASection Component

#### `<CTASection>`
**Location:** `src/components/sections/CTASection.tsx`

Final call-to-action section.

**Props:** None (static content)

**Usage:**
```tsx
<CTASection />
```

**Content:**
- Aqua background
- Heading and description text (black)
- Two white CTA buttons (Browse Compounds, Get in Touch)

**Design:**
- Simplified design - no feature cards
- Clean, minimal layout

---

## 📊 Data Interfaces

### FeaturedProduct
**Location:** `src/data/featuredProducts.ts`

```typescript
interface FeaturedProduct {
  name: string;         // Product name (e.g., "SEMAX 10MG")
  price: string;        // Price (e.g., "$79.00")
  pricePrefix?: string; // Optional prefix (e.g., "FROM")
  image: string;        // Image path (e.g., "/images/products/semax-10mg.png")
}
```

---

### Peptide
**Location:** `src/data/peptides.ts`

```typescript
interface Peptide {
  id: number;
  name: string;
  category: string;     // "All" | "Performance" | "Recovery" | "Cognitive" | "Metabolic"
  price: string;
  pricePrefix?: string;
  description: string;
  benefits: string[];
}
```

**Helper Functions:**
```typescript
// Get all unique categories
peptideCategories: string[]

// Filter peptides by category
getPeptidesByCategory(category: string): Peptide[]
```

---

## 🎯 Best Practices

### When to use which component

**Headings:**
- `<Heading level={1}>` - Page title / Hero
- `<Heading level={2}>` - Section titles
- `<Heading level={3}>` - Subsection titles
- `<Heading level={4}>` - Card titles

**Text:**
- `<Text variant="lead">` - Section intros
- `<Text variant="body">` - Standard paragraphs (default)
- `<Text variant="small">` - Secondary text
- `<Text variant="caption">` - Prices, labels

**Labels:**
- Use for: Category tags, section labels, product names
- Always uppercase by default
- Use `inheritColor` when inside colored containers

**Buttons:**
- `variant="primary"` - Main actions
- `variant="secondary"` - Alternative actions
- `variant="white"` - On dark backgrounds
- `variant="outline"` - Tertiary actions
- `variant="link"` - Inline text links

**Sections:**
- `background="white"` - Default content sections
- `background="neutral"` - Alternating sections for variety
- `background="dark"` - Bold moments, CTAs
- `background="accent"` - Hero, featured moments (use sparingly)

---

**Last Updated:** March 28, 2026
