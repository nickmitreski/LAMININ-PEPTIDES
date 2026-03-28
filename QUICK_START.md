# 🚀 Quick Start - Premium Design System

## 📦 New Components Available

### Typography
```tsx
import { Heading, Text, Label, Display } from '@/components/ui/Typography';

<Display>Hero Headlines</Display>
<Heading level={1}>Main Title</Heading>
<Heading level={2}>Section Title</Heading>
<Text variant="lead">Lead paragraph</Text>
<Text>Body text</Text>
<Text variant="small" muted>Caption</Text>
<Label>SECTION LABEL</Label>
```

### UI Components
```tsx
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import SectionTitle from '@/components/ui/SectionTitle';

<Button variant="primary|secondary|outline|ghost|link" size="sm|md|lg">
  Click Me
</Button>

<Card variant="default|bordered|elevated" padding="none|sm|md|lg" hover>
  Content
</Card>

<Input label="Email" error="Error message" helperText="Helper text" />
<Textarea label="Message" rows={5} />
<Badge variant="neutral|accent|dark|success|warning|error">Badge</Badge>

<SectionTitle
  label="Section Label"
  title="Section Title"
  subtitle="Optional subtitle"
  centered
/>
```

### Layout Components
```tsx
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';

<Container size="sm|md|lg|xl|full">
  Content
</Container>

<Section
  spacing="sm|md|lg"
  background="white|neutral|none"
  container={true}
>
  Content
</Section>
```

## 🎨 Color Palette

### Use These Colors
```tsx
// Text
text-carbon-900      // Primary text
text-neutral-600     // Muted text
text-white          // On dark backgrounds

// Backgrounds
bg-white            // Main background
bg-neutral-50       // Light gray
bg-neutral-100      // Neutral sections
bg-carbon-900       // Dark sections

// Borders
border-neutral-200  // Light borders
border-neutral-300  // Medium borders
border-white/10     // On dark backgrounds

// Accent (use sparingly)
text-accent         // Accent text
bg-accent           // Accent background
border-accent       // Accent borders
```

## 📏 Spacing

### Section Spacing
```tsx
<Section spacing="sm">   // 4rem (64px)
<Section spacing="md">   // 6rem (96px) - default
<Section spacing="lg">   // 8rem (128px)
```

### Tailwind Spacing
```
gap-4      // 1rem
gap-6      // 1.5rem
gap-8      // 2rem
gap-12     // 3rem

mb-4       // 1rem margin bottom
mb-6       // 1.5rem
mb-8       // 2rem
mb-12      // 3rem
```

## 🔧 Common Patterns

### Dark Section
```tsx
<section className="py-section bg-carbon-900 border-t border-white/10">
  <Container>
    <Heading level={2} className="text-white mb-6">
      Title
    </Heading>
    <Text className="text-white/80">
      Description
    </Text>
  </Container>
</section>
```

### Feature Grid
```tsx
<Section background="neutral">
  <SectionTitle
    label="Features"
    title="Main Title"
    subtitle="Description"
  />
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card hover padding="lg">
      <Heading level={4} className="mb-3">
        Feature
      </Heading>
      <Text muted weight="light">
        Description
      </Text>
    </Card>
  </div>
</Section>
```

### Hero Section
```tsx
<Section spacing="lg">
  <div className="max-w-4xl mx-auto text-center">
    <Label className="mb-6">TAGLINE</Label>
    <Display className="mb-6">
      Main Headline
    </Display>
    <Text variant="lead" weight="light" muted className="mb-12">
      Description
    </Text>
    <div className="flex gap-4 justify-center">
      <Button variant="primary" size="lg">Primary CTA</Button>
      <Button variant="outline" size="lg">Secondary</Button>
    </div>
  </div>
</Section>
```

### Form Section
```tsx
<Section>
  <Container size="sm">
    <SectionTitle title="Contact Us" centered />
    
    <form className="space-y-6">
      <Input
        label="Name"
        placeholder="Your name"
        required
      />
      <Input
        type="email"
        label="Email"
        placeholder="your@email.com"
        required
      />
      <Textarea
        label="Message"
        placeholder="Your message"
        rows={5}
        required
      />
      <Button type="submit" variant="primary" size="lg" className="w-full">
        Send Message
      </Button>
    </form>
  </Container>
</Section>
```

## ⚡ Migration Cheat Sheet

| Old | New |
|-----|-----|
| `bg-platinum` | `bg-neutral-100` |
| `bg-carbon-black` | `bg-carbon-900` |
| `text-carbon-black` | `text-carbon-900` |
| `text-aqua` | `text-accent` |
| `border-carbon-black/10` | `border-neutral-200` |
| `py-24` | `<Section>` |
| `<h2 className="...">` | `<Heading level={2}>` |
| `<p className="...">` | `<Text>` |

## 🎯 Key Principles

1. **Use Typography components** - Not raw HTML headings/paragraphs
2. **Use Section component** - For consistent spacing
3. **Monochrome palette** - Black, white, grays
4. **Accent sparingly** - Only for CTAs and highlights
5. **Generous whitespace** - Let it breathe
6. **Subtle transitions** - 200ms duration

## 📚 Documentation

- **`DESIGN_SYSTEM.md`** - Complete reference
- **`REFACTOR_COMPLETE.md`** - What was changed
- **`QUICK_START.md`** - This file

---

**Ready to build premium UIs!** 🚀
