# How-To Guides
**Step-by-step instructions for common tasks**

---

## 📄 Content Changes

### How to Change Homepage Content

#### Change Hero Text

**File:** `src/components/sections/Hero.tsx`

**Steps:**
1. Open `src/components/sections/Hero.tsx`
2. Find the `<Heading level={1}>` component
3. Change the text between the tags
4. Find the `<Text>` component for subtitle
5. Change the subtitle text
6. Save the file

**Example:**
```tsx
// BEFORE
<Heading level={1}>LABORATORY VERIFIED PEPTIDES</Heading>

// AFTER
<Heading level={1}>YOUR NEW HERO TEXT</Heading>
```

**Testing:**
- Save file
- Check browser (Vite auto-reloads)
- Verify text appears correctly

---

#### Change Section Titles

**File:** Find the section component in `src/components/sections/`

**Steps:**
1. Identify which section you want to change
2. Open the section file (e.g., `FeaturedProducts.tsx`)
3. Find the `<SectionTitle>` component
4. Change the `title`, `label`, or `subtitle` props
5. Save the file

**Example:**
```tsx
// BEFORE
<SectionTitle
  label="PEPTIDE LIBRARY"
  title="High Purity Peptides for Advanced Research"
  subtitle="Laboratory-grade compounds"
/>

// AFTER
<SectionTitle
  label="PRODUCT CATALOG"
  title="Your New Title Here"
  subtitle="Your new subtitle"
/>
```

---

#### Change Button Text

**Steps:**
1. Find the section with the button
2. Open the section file
3. Find the `<Button>` component
4. Change the text between the tags
5. Save the file

**Example:**
```tsx
// BEFORE
<Button variant="primary">Browse Collection</Button>

// AFTER
<Button variant="primary">Shop Now</Button>
```

---

### How to Add a New Section to Homepage

**Steps:**

1. **Create the section component**
   ```bash
   # Create new file
   touch src/components/sections/MyNewSection.tsx
   ```

2. **Write the component**
   ```tsx
   // src/components/sections/MyNewSection.tsx
   import Section from '../layout/Section';
   import { Heading, Text } from '../ui/Typography';

   export default function MyNewSection() {
     return (
       <Section background="white" spacing="xl">
         <div className="text-center max-w-2xl mx-auto">
           <Heading level={2} className="mb-6">
             Section Title
           </Heading>
           <Text variant="lead">
             Section content goes here
           </Text>
         </div>
       </Section>
     );
   }
   ```

3. **Add to Home page**
   ```tsx
   // src/pages/Home.tsx
   import MyNewSection from '../components/sections/MyNewSection';

   export default function Home() {
     return (
       <>
         <Hero />
         <TrustBar />
         <MyNewSection />  {/* Add here */}
         <FeaturedProducts />
         {/* ... rest */}
       </>
     );
   }
   ```

4. **Test**
   - Save files
   - Check browser
   - Verify new section appears

---

### How to Remove a Section from Homepage

**Steps:**

1. **Open Home page**
   ```bash
   # Open in editor
   src/pages/Home.tsx
   ```

2. **Remove the import**
   ```tsx
   // DELETE THIS LINE
   import TrustBar from '../components/sections/TrustBar';
   ```

3. **Remove the component**
   ```tsx
   export default function Home() {
     return (
       <>
         <Hero />
         {/* DELETE THIS LINE */}
         <TrustBar />
         <FeaturedProducts />
         {/* ... rest */}
       </>
     );
   }
   ```

4. **Test**
   - Save file
   - Check browser
   - Verify section is gone

**Note:** The section file still exists in `src/components/sections/`, it's just not being used. You can delete it if you want.

---

## 🎨 Design Changes

### How to Change Colors

#### Change Pure Black to Different Shade

**Files to update:**
1. `tailwind.config.js`
2. `src/styles/tokens.css`

**Steps:**

1. **Update Tailwind config**
   ```javascript
   // tailwind.config.js
   colors: {
     carbon: {
       DEFAULT: '#1a1a1a',  // Change from #000000
       950: '#1a1a1a',      // Change from #000000
       900: '#1a1a1a',      // Change from #000000
       // ... rest
     }
   }
   ```

2. **Update CSS tokens**
   ```css
   /* src/styles/tokens.css */
   :root {
     --color-carbon: #1a1a1a;  /* Change from #000000 */
     --text-primary: #1a1a1a;  /* Change from #000000 */
   }
   ```

3. **Rebuild**
   ```bash
   npm run build
   ```

4. **Test**
   - Check all black elements
   - Verify text, buttons, backgrounds

---

#### Change Aqua Accent Color

**Files to update:**
1. `tailwind.config.js`
2. `src/styles/tokens.css`

**Steps:**

1. **Update Tailwind config**
   ```javascript
   // tailwind.config.js
   colors: {
     accent: {
       DEFAULT: '#yourcolor',  // Main accent
       light:   '#lighterversion',
       dark:    '#darkerversion',
       muted:   '#mutedversion',
     }
   }
   ```

2. **Update CSS tokens**
   ```css
   /* src/styles/tokens.css */
   :root {
     --color-accent: #yourcolor;
   }
   ```

3. **Test**
   - Check Hero section
   - Check ResearchCategories section
   - Check accent labels
   - Check secondary buttons

---

### How to Change Section Background Color

**File:** The section component file

**Steps:**

1. **Find the section**
   ```bash
   # Example: Change Features background
   src/components/sections/Features.tsx
   ```

2. **Change background prop**
   ```tsx
   // BEFORE
   <Section background="neutral">

   // AFTER - Change to any of these:
   <Section background="white">    // White
   <Section background="neutral">  // Grey
   <Section background="dark">     // Black
   <Section background="accent">   // Aqua
   ```

3. **Adjust text color if needed**
   ```tsx
   // On dark/accent backgrounds, text may need adjustment
   <Section background="dark">
     <Text tone="inverse">White text</Text>
   </Section>
   ```

---

### How to Change Typography Sizes

#### Change Heading Sizes Globally

**File:** `src/components/ui/Typography.tsx`

**Steps:**

1. **Open Typography component**
   ```bash
   src/components/ui/Typography.tsx
   ```

2. **Find the Heading component**
   ```tsx
   export function Heading({ level, className, as, children }: HeadingProps) {
     const styles = {
       1: 'text-2xl md:text-3xl lg:text-4xl',  // Change these
       2: 'text-lg md:text-xl lg:text-2xl',
       // ... etc
     };
   }
   ```

3. **Change sizes**
   ```tsx
   const styles = {
     1: 'text-3xl md:text-4xl lg:text-5xl',  // Larger h1
     2: 'text-xl md:text-2xl lg:text-3xl',   // Larger h2
     // ... etc
   };
   ```

4. **Test thoroughly**
   - Check ALL pages
   - Verify responsive sizing
   - Test mobile, tablet, desktop

**Warning:** This affects EVERY heading in the entire site.

---

#### Change One Specific Heading

**File:** The component file

**Steps:**

1. **Find the specific heading**
   ```tsx
   // Find in component file
   <Heading level={2}>Title</Heading>
   ```

2. **Add custom className**
   ```tsx
   <Heading level={2} className="!text-4xl md:!text-5xl">
     Larger Title
   </Heading>
   ```

**Note:** Use `!` prefix to override default sizes.

---

### How to Change Button Styles

#### Change Primary Button Color

**File:** `src/components/ui/Button.tsx`

**Steps:**

1. **Open Button component**
   ```bash
   src/components/ui/Button.tsx
   ```

2. **Find variant styles**
   ```tsx
   const variantClasses = {
     primary: 'bg-carbon-900 text-white hover:bg-carbon-800',
     // ... rest
   };
   ```

3. **Change colors**
   ```tsx
   const variantClasses = {
     primary: 'bg-accent text-carbon-900 hover:bg-accent-dark',
     // Now primary button is aqua
   };
   ```

4. **Test**
   - Check all primary buttons
   - Verify hover states

---

#### Add New Button Variant

**File:** `src/components/ui/Button.tsx`

**Steps:**

1. **Update variant type**
   ```tsx
   type ButtonVariant = 'primary' | 'secondary' | 'white' | 'outline' | 'ghost' | 'link' | 'custom';
   // Added 'custom'
   ```

2. **Add variant styles**
   ```tsx
   const variantClasses = {
     primary: 'bg-carbon-900 text-white hover:bg-carbon-800',
     // ... other variants
     custom: 'bg-purple-600 text-white hover:bg-purple-700',
   };
   ```

3. **Use new variant**
   ```tsx
   <Button variant="custom">New Button</Button>
   ```

---

## 📊 Data Changes

### How to Add a New Product

#### Add to Featured Products

**File:** `src/data/featuredProducts.ts`

**Steps:**

1. **Add product image**
   ```bash
   # Copy image to:
   public/images/products/your-product.png
   ```

2. **Open data file**
   ```bash
   src/data/featuredProducts.ts
   ```

3. **Add product object**
   ```typescript
   export const featuredProducts: FeaturedProduct[] = [
     {
       name: 'SEMAX 10MG',
       price: '$79.00',
       image: '/images/products/semax-10mg.png'
     },
     // ADD NEW PRODUCT HERE
     {
       name: 'YOUR PRODUCT NAME',
       price: '$99.00',
       pricePrefix: 'FROM',  // Optional
       image: '/images/products/your-product.png'
     },
   ];
   ```

4. **Test**
   - Save file
   - Check FeaturedProducts section
   - Verify image displays
   - Verify price shows correctly

---

#### Add to Peptides Library

**File:** `src/data/peptides.ts`

**Steps:**

1. **Open data file**
   ```bash
   src/data/peptides.ts
   ```

2. **Add peptide object**
   ```typescript
   export const peptides: Peptide[] = [
     {
       id: 1,
       name: 'BPC-157',
       category: 'Recovery',
       price: '$89.00',
       description: 'Peptide description',
       benefits: ['Benefit 1', 'Benefit 2']
     },
     // ADD NEW PEPTIDE
     {
       id: 99,  // Unique ID
       name: 'YOUR PEPTIDE',
       category: 'Performance',  // All | Performance | Recovery | Cognitive | Metabolic
       price: '$99.00',
       pricePrefix: 'FROM',  // Optional
       description: 'Your description',
       benefits: ['Benefit 1', 'Benefit 2', 'Benefit 3']
     },
   ];
   ```

3. **Test**
   - Check PeptideToggleSection (Homepage)
   - Check Library page
   - Test category filtering
   - Verify it appears in correct category

---

### How to Change Product Prices

**Files:**
- `src/data/featuredProducts.ts` (featured products)
- `src/data/peptides.ts` (all peptides)

**Steps:**

1. **Open data file**
2. **Find product by name**
3. **Change price value**
   ```typescript
   {
     name: 'SEMAX 10MG',
     price: '$99.00',  // Changed from $79.00
     image: '/images/products/semax-10mg.png'
   }
   ```
4. **Save file**
5. **Test** - Check all locations where product appears

---

### How to Change Product Images

**Steps:**

1. **Replace image file**
   ```bash
   # Replace existing image with same filename
   public/images/products/semax-10mg.png
   ```

2. **Or update filename in data**
   ```typescript
   // src/data/featuredProducts.ts
   {
     name: 'SEMAX 10MG',
     price: '$79.00',
     image: '/images/products/new-semax-image.png'  // New filename
   }
   ```

3. **Clear browser cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. **Test**
   - Verify new image shows
   - Check image quality
   - Verify transparent background

---

## 🔧 Layout Changes

### How to Change Page Background Color

**File:** `src/App.tsx`

**Steps:**

1. **Open App component**
   ```bash
   src/App.tsx
   ```

2. **Find body wrapper div**
   ```tsx
   <div className="min-h-screen bg-platinum text-carbon-900">
   ```

3. **Change background class**
   ```tsx
   // Options:
   <div className="min-h-screen bg-white text-carbon-900">     // White
   <div className="min-h-screen bg-neutral-100 text-carbon-900"> // Grey
   <div className="min-h-screen bg-platinum text-carbon-900">  // Platinum (default)
   ```

---

### How to Change Container Width

**File:** `src/components/layout/Container.tsx`

**Steps:**

1. **Open Container component**
   ```bash
   src/components/layout/Container.tsx
   ```

2. **Find max-width class**
   ```tsx
   <div className="max-w-screen-xl mx-auto px-6 md:px-8">
   ```

3. **Change max-width**
   ```tsx
   // Options:
   max-w-screen-sm   // 640px
   max-w-screen-md   // 768px
   max-w-screen-lg   // 1024px
   max-w-screen-xl   // 1280px (current)
   max-w-screen-2xl  // 1536px (wider)
   max-w-7xl         // 1280px (same as xl)
   ```

**Warning:** This affects EVERY section that uses Container.

---

### How to Add Header Navigation Link

**File:** `src/components/layout/Header.tsx`

**Steps:**

1. **Open Header component**
   ```bash
   src/components/layout/Header.tsx
   ```

2. **Find nav links array (desktop)**
   ```tsx
   {/* Desktop Navigation */}
   <nav className="hidden lg:flex items-center gap-12">
     <Link to="/" className="...">Home</Link>
     <Link to="/library" className="...">Library</Link>
     <Link to="/coa" className="...">Lab Results</Link>
     <Link to="/contact" className="...">Contact</Link>
     {/* ADD NEW LINK HERE */}
     <Link to="/about" className="text-sm uppercase tracking-wider text-white/80 hover:text-white transition-colors duration-300">
       About
     </Link>
   </nav>
   ```

3. **Find mobile nav links**
   ```tsx
   {/* Mobile Navigation */}
   <nav className="flex flex-col gap-8">
     <Link to="/" className="..." onClick={toggleMenu}>Home</Link>
     <Link to="/library" className="..." onClick={toggleMenu}>Library</Link>
     <Link to="/coa" className="..." onClick={toggleMenu}>Lab Results</Link>
     <Link to="/contact" className="..." onClick={toggleMenu}>Contact</Link>
     {/* ADD NEW LINK HERE TOO */}
     <Link to="/about" className="text-xl uppercase tracking-wider text-white hover:text-accent transition-colors duration-300" onClick={toggleMenu}>
       About
     </Link>
   </nav>
   ```

4. **Create new page** (if needed)
   ```tsx
   // src/pages/About.tsx
   export default function About() {
     return (
       <Section background="white">
         <Heading level={1}>About Us</Heading>
       </Section>
     );
   }
   ```

5. **Add route**
   ```tsx
   // src/App.tsx
   import About from './pages/About';

   <Routes>
     <Route path="/" element={<Home />} />
     <Route path="/library" element={<Library />} />
     <Route path="/about" element={<About />} />  {/* Add route */}
     {/* ... rest */}
   </Routes>
   ```

---

### How to Change Footer Links

**File:** `src/components/layout/Footer.tsx`

**Steps:**

1. **Open Footer component**
   ```bash
   src/components/layout/Footer.tsx
   ```

2. **Find link sections**
   ```tsx
   {/* Products Section */}
   <div>
     <Label tone="inverse" className="mb-4">Products</Label>
     <div className="space-y-2">
       <Link to="/library" className="...">Peptides</Link>
       {/* ADD NEW LINK */}
       <Link to="/accessories" className="block text-sm text-white/60 hover:text-white transition-colors duration-300">
         Accessories
       </Link>
     </div>
   </div>
   ```

3. **Test**
   - Check footer on all pages
   - Verify links work
   - Check mobile layout

---

## 🖼️ Asset Changes

### How to Replace Logo

**Steps:**

1. **Prepare new logo**
   - PNG format
   - Transparent background
   - White version for dark backgrounds
   - Approx 200-300px wide

2. **Replace logo files**
   ```bash
   # Replace these files:
   public/images/brand/logo-white.png
   public/images/brand/logo-colour.png
   public/images/brand/logo-black.png
   ```

3. **Check logo height**
   ```tsx
   // src/components/layout/Header.tsx
   <img src="/images/brand/logo-white.png" alt="..." className="h-10 md:h-12 w-auto" />
   // Current size: h-10 md:h-12 (updated March 28, 2026)
   // Adjust if needed (h-6, h-8, h-14, etc)
   ```

4. **Clear browser cache**
5. **Test**
   - Check header
   - Check footer
   - Check all pages

---

### How to Add New Product Images

**Steps:**

1. **Prepare images**
   - Square aspect ratio (1:1)
   - Transparent background PNG
   - Minimum 800x800px
   - Centered product
   - Named descriptively (e.g., `product-name.png`)

2. **Add to folder**
   ```bash
   # Copy image to:
   public/images/products/your-product.png
   ```

3. **Reference in data**
   ```typescript
   // src/data/featuredProducts.ts or src/data/peptides.ts
   {
     name: 'YOUR PRODUCT',
     image: '/images/products/your-product.png'
   }
   ```

4. **Test**
   - Verify image displays
   - Check transparent background works
   - Verify image quality

---

### How to Change Favicon

**Steps:**

1. **Prepare favicon**
   - PNG or ICO format
   - 32x32px or 64x64px
   - Square aspect ratio

2. **Replace favicon**
   ```bash
   # Replace:
   public/images/brand/symbol-dark.png
   ```

3. **Update HTML**
   ```html
   <!-- index.html -->
   <link rel="icon" type="image/png" href="/images/brand/symbol-dark.png" />
   ```

4. **Clear browser cache**
5. **Test**
   - Check browser tab icon
   - Check bookmarks

---

## 🚀 Deployment

### How to Build for Production

**Steps:**

1. **Run type check**
   ```bash
   npm run typecheck
   ```
   - Fix any TypeScript errors

2. **Run build**
   ```bash
   npm run build
   ```
   - This creates `/dist` folder

3. **Preview build**
   ```bash
   npm run preview
   ```
   - Test production build locally
   - Open http://localhost:4173

4. **Check build output**
   - Verify all pages load
   - Check images load
   - Test navigation
   - Test responsive design

5. **Deploy `/dist` folder**
   - Upload to hosting service
   - Configure server for SPA routing

---

### How to Test Before Deployment

**Checklist:**

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Preview
npm run preview
```

**Manual checks:**
- [ ] All pages load without errors
- [ ] All images display
- [ ] All links work
- [ ] Mobile responsive
- [ ] Forms work (if any)
- [ ] No console errors
- [ ] Fast loading speed

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors

**Solution:**

1. **Run type check**
   ```bash
   npm run typecheck
   ```

2. **Read error messages**
   - Shows file and line number
   - Explains what's wrong

3. **Common fixes:**
   ```tsx
   // Missing type
   const [value, setValue] = useState<string>('');

   // Wrong prop type
   <Button variant="primary">  // Must be valid variant

   // Missing required prop
   <SectionTitle title="Required prop" />
   ```

---

### Images Not Displaying

**Solutions:**

1. **Check file path**
   ```tsx
   // Correct - starts with /
   src="/images/products/product.png"

   // Wrong - missing /
   src="images/products/product.png"
   ```

2. **Check file exists**
   ```bash
   ls public/images/products/
   ```

3. **Check filename matches exactly**
   - Case-sensitive
   - Check extension (.png, .jpg)

4. **Clear browser cache**
   - Hard refresh: Cmd+Shift+R or Ctrl+Shift+R

---

### Styles Not Applying

**Solutions:**

1. **Check Tailwind class spelling**
   ```tsx
   // Correct
   className="bg-white"

   // Wrong
   className="bg-whtie"  // Typo
   ```

2. **Rebuild**
   ```bash
   npm run dev
   # Stop and restart dev server
   ```

3. **Check class conflicts**
   ```tsx
   // Later classes override earlier ones
   className="text-white text-black"  // Will be black
   ```

4. **Use ! prefix to force override**
   ```tsx
   className="!text-white"  // Forces white
   ```

---

### Page Not Found After Deployment

**Solution:**

Configure server for SPA routing.

**For Vercel:**
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**For Netlify:**
```
// public/_redirects
/*    /index.html   200
```

**For Apache:**
```apache
// public/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 💡 Tips & Best Practices

### Before Making Changes

1. **Read documentation first**
   - PROJECT-ARCHITECTURE.md
   - FILE-RELATIONSHIPS.md
   - DESIGN-GUIDELINES.md

2. **Understand impact**
   - Check FILE-RELATIONSHIPS.md
   - See what else will be affected

3. **Test in dev first**
   - Never make changes in production
   - Use `npm run dev` for testing

---

### While Making Changes

1. **Make small changes**
   - Change one thing at a time
   - Test after each change

2. **Save frequently**
   - Vite auto-reloads on save
   - Check browser after each save

3. **Use browser DevTools**
   - Inspect elements
   - Check console for errors
   - Test responsive design

---

### After Making Changes

1. **Test thoroughly**
   - Check all affected pages
   - Test responsive breakpoints
   - Verify no console errors

2. **Check build**
   ```bash
   npm run build
   ```
   - Make sure it builds without errors

3. **Preview production build**
   ```bash
   npm run preview
   ```
   - Test production build locally

---

## 📚 Quick Reference

### Common File Locations

```
Content:
- Homepage structure → src/pages/Home.tsx
- Section components → src/components/sections/
- Product data → src/data/featuredProducts.ts
- Peptide data → src/data/peptides.ts

Design:
- Colors → tailwind.config.js + src/styles/tokens.css
- Typography → src/components/ui/Typography.tsx
- Buttons → src/components/ui/Button.tsx
- Spacing → src/components/layout/Section.tsx

Layout:
- Header → src/components/layout/Header.tsx
- Footer → src/components/layout/Footer.tsx
- Routes → src/App.tsx

Assets:
- Product images → public/images/products/
- Brand assets → public/images/brand/
```

---

**Last Updated:** March 28, 2026
