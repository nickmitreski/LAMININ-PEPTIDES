# Laminin Peptide Lab

A modern, minimalist e-commerce website for laboratory-grade peptide research compounds.

---

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit http://localhost:5173

### Build for Production

```bash
# Type check
npm run typecheck

# Build
npm run build

# Preview production build
npm run preview
```

---

## 📚 Documentation

Complete documentation system to help you understand and modify the project:

### Core Documentation

- **[PROJECT-ARCHITECTURE.md](DOCUMENTATION/PROJECT-ARCHITECTURE.md)**
  - Complete system guide
  - Directory structure
  - Design system (colors, typography, spacing)
  - Component hierarchy
  - Build process

- **[FILE-RELATIONSHIPS.md](DOCUMENTATION/FILE-RELATIONSHIPS.md)**
  - Complete dependency map
  - Import/export chains
  - Impact analysis ("what breaks if I change X?")
  - Safe-to-delete file list

- **[COMPONENT-API.md](DOCUMENTATION/COMPONENT-API.md)**
  - Detailed API for every component
  - Props documentation
  - Usage examples
  - Best practices

- **[DESIGN-GUIDELINES.md](DOCUMENTATION/DESIGN-GUIDELINES.md)**
  - When to use which colors
  - Typography rules
  - Button usage
  - Spacing guidelines
  - Common mistakes to avoid

- **[HOW-TO-GUIDES.md](DOCUMENTATION/HOW-TO-GUIDES.md)**
  - Step-by-step instructions
  - Common tasks (change text, add sections, etc.)
  - Troubleshooting
  - Deployment guide

### Additional Documentation

- **[COMPREHENSIVE-AUDIT.md](COMPREHENSIVE-AUDIT.md)**
  - Complete project audit
  - Issues identified
  - Recommendations

- **[FIX-PLAN.md](FIX-PLAN.md)**
  - Detailed fix implementation plan
  - Priority order
  - Expected outcomes

---

## 🎨 Design System

### Colors

- **Pure Black** (`#000000`) - Primary text, dark sections
- **Aqua Accent** (`#89D1D1`) - Brand color, CTAs
- **Platinum Grey** (`#F1F2F2`) - Page background
- **Neutral Grey** (`#EDEDEE`) - Section backgrounds
- **White** (`#FFFFFF`) - Cards, elevated surfaces

### Typography

- **Font:** system-ui (platform native fonts)
- **Headings:** Uppercase, light weight, generous letter spacing
- **Body Text:** Normal weight, comfortable line height
- **Labels:** Uppercase, small, wide tracking

### Components

All components built with:
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

---

## 📁 Project Structure

```
/main/
├── public/                # Static assets
│   └── images/
│       ├── brand/        # Logos, symbols
│       └── products/     # Product images
│
├── src/
│   ├── components/
│   │   ├── layout/       # Header, Footer, Section, Container
│   │   ├── sections/     # Hero, Features, Products, etc.
│   │   ├── peptides/     # Peptide-specific components
│   │   └── ui/           # Reusable UI (Button, Card, Typography)
│   │
│   ├── data/             # Product and peptide data
│   ├── pages/            # Page components (Home, Library, etc.)
│   ├── styles/           # CSS files
│   ├── App.tsx           # Main app with routing
│   └── main.tsx          # Entry point
│
├── DOCUMENTATION/        # Complete documentation system
│
└── Configuration files
```

---

## 🛠️ Tech Stack

### Core

- **Vite** (^5.4.2) - Build tool and dev server
- **React** (^18.3.1) - UI library
- **TypeScript** (^5.5.3) - Type safety
- **React Router DOM** (^7.13.2) - Client-side routing

### Styling

- **Tailwind CSS** (^3.4.1) - Utility-first CSS
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

### Icons

- **Lucide React** (^0.344.0) - Icon library

### Code Quality

- **ESLint** (^9.9.1) - Linting
- **TypeScript ESLint** - TS linting rules

---

## 📄 Available Scripts

```bash
npm run dev        # Start development server (port 5173)
npm run build      # Production build → /dist
npm run preview    # Preview production build (port 4173)
npm run typecheck  # Run TypeScript type checking
npm run lint       # Run ESLint
```

---

## 🌐 Pages

- **/** - Homepage with all sections
- **/library** - Peptide library with filtering
- **/collection** - Alias for /library
- **/coa** - Certificates of Analysis
- **/contact** - Contact form

---

## 🎯 Key Features

### Homepage Sections

1. **Hero** - Main brand statement with CTAs (Aqua background, white buttons, larger text)
2. **TrustBar** - Trust indicators (Black background)
3. **FeaturedProducts** - 8 featured products grid (White background)
4. **PeptideToggleSection** - Filterable peptide display (Grey background, aqua active tabs)
5. **ResearchCategories** - Category showcase (Aqua background)
6. **Disclaimer** - Legal disclaimer (White background with black box)
7. **CTASection** - Final call-to-action (Aqua background, text and buttons only)

**Note:** Header navigation updated March 28, 2026 with increased sizing for better visibility (logo: h-10 md:h-12, nav links: text-sm, header height: h-20 md:h-24)

### Design Highlights

- **Pure Black** design system (#000000)
- **Aqua accent** color for brand moments
- **Responsive** design with mobile-first approach
- **Fast loading** with optimized build
- **Type-safe** with TypeScript
- **Accessible** with semantic HTML

---

## 🚀 Making Changes

### Quick Tasks

**Change homepage text:**
→ See [HOW-TO-GUIDES.md](DOCUMENTATION/HOW-TO-GUIDES.md#how-to-change-homepage-content)

**Add new product:**
→ See [HOW-TO-GUIDES.md](DOCUMENTATION/HOW-TO-GUIDES.md#how-to-add-a-new-product)

**Change colors:**
→ See [HOW-TO-GUIDES.md](DOCUMENTATION/HOW-TO-GUIDES.md#how-to-change-colors)

**Add new section:**
→ See [HOW-TO-GUIDES.md](DOCUMENTATION/HOW-TO-GUIDES.md#how-to-add-a-new-section-to-homepage)

**Understand dependencies:**
→ See [FILE-RELATIONSHIPS.md](DOCUMENTATION/FILE-RELATIONSHIPS.md)

---

## 📖 Documentation Navigation

### I want to...

**Understand the project structure**
→ [PROJECT-ARCHITECTURE.md](DOCUMENTATION/PROJECT-ARCHITECTURE.md)

**Know what will break if I change a file**
→ [FILE-RELATIONSHIPS.md](DOCUMENTATION/FILE-RELATIONSHIPS.md)

**Learn how to use a component**
→ [COMPONENT-API.md](DOCUMENTATION/COMPONENT-API.md)

**Follow design best practices**
→ [DESIGN-GUIDELINES.md](DOCUMENTATION/DESIGN-GUIDELINES.md)

**Do a specific task step-by-step**
→ [HOW-TO-GUIDES.md](DOCUMENTATION/HOW-TO-GUIDES.md)

**See all issues and fixes**
→ [COMPREHENSIVE-AUDIT.md](COMPREHENSIVE-AUDIT.md)

---

## 🐛 Troubleshooting

**Build fails:**
```bash
npm run typecheck  # See TypeScript errors
```

**Images not loading:**
- Check file path starts with `/`
- Verify file exists in `public/images/`
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

**Styles not applying:**
- Check Tailwind class spelling
- Restart dev server
- Check for class conflicts

**More solutions:**
→ See [HOW-TO-GUIDES.md - Troubleshooting](DOCUMENTATION/HOW-TO-GUIDES.md#-troubleshooting)

---

## 📦 Deployment

### Build Checklist

- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - builds successfully
- [ ] Run `npm run preview` - test production build
- [ ] Test all pages load
- [ ] Test mobile responsive
- [ ] Test all images display

### Deploy

Upload `/dist` folder to your hosting service.

**Configure SPA routing:**

**Vercel:**
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**Netlify:**
```
// public/_redirects
/*    /index.html   200
```

More deployment info in [HOW-TO-GUIDES.md](DOCUMENTATION/HOW-TO-GUIDES.md#-deployment)

---

## 🤝 Contributing

Before making changes:

1. Read [PROJECT-ARCHITECTURE.md](DOCUMENTATION/PROJECT-ARCHITECTURE.md)
2. Check [FILE-RELATIONSHIPS.md](DOCUMENTATION/FILE-RELATIONSHIPS.md) for dependencies
3. Follow [DESIGN-GUIDELINES.md](DOCUMENTATION/DESIGN-GUIDELINES.md)
4. Make small, incremental changes
5. Test thoroughly before committing

---

## 📝 License

Proprietary - All rights reserved

---

## 📞 Support

**Documentation Issues:**
- Check the 5 documentation files in `/DOCUMENTATION`
- Each covers different aspects of the project

**Technical Issues:**
- Run `npm run typecheck` for type errors
- Check browser console for runtime errors
- See [HOW-TO-GUIDES.md - Troubleshooting](DOCUMENTATION/HOW-TO-GUIDES.md#-troubleshooting)

---

## 🎯 Design Philosophy

This project follows a **minimalist, high-contrast design** approach:

- **Pure black** (#000000) for maximum contrast
- **Generous whitespace** for breathing room
- **Uppercase typography** for clinical aesthetic
- **Aqua accent** for strategic brand moments
- **Mobile-first responsive** design
- **Performance-focused** build process

Read more in [DESIGN-GUIDELINES.md](DOCUMENTATION/DESIGN-GUIDELINES.md)

---

**Built with ♥ using React, TypeScript, and Tailwind CSS**

**Last Updated:** March 28, 2026
