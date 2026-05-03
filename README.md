# Laminin Peptide Lab

React 18 + Vite + TypeScript e-commerce site for research peptides. Backend is Supabase (PostgreSQL, Edge Functions, Auth, Storage). Deployed via GitHub to Vercel (frontend) and Supabase cloud (backend).

---

## Quick Start

### Development

```bash
npm install
npm run dev          # http://localhost:5173
```

### Production Build

```bash
npm run typecheck
npm run build
npm run preview      # http://localhost:4173
```

---

## Documentation

Guides and runbooks live under [`docs/`](docs/README.md).

| Area | Path |
|------|------|
| Deployment and secrets | [`docs/deployment/`](docs/deployment/) |
| Supabase setup | [`docs/supabase/`](docs/supabase/) |
| Admin dashboard guides | [`docs/admin/`](docs/admin/) |
| Partner / legacy (CoreForge) | [`docs/partner/`](docs/partner/) |
| Archive (session notes) | [`docs/archive/`](docs/archive/) |
| Quality (COA PDF map) | [`docs/quality/COA-COVERAGE.md`](docs/quality/COA-COVERAGE.md) |

---

## Tech Stack

### Core

- **React** 18.3.1 -- UI library
- **Vite** 5.4.2 -- Build tool and dev server
- **TypeScript** 5.5.3 -- Type safety
- **React Router** 7.13.2 -- Client-side routing
- **Supabase JS** 2.57.4 -- Backend client (auth, database, storage, edge functions)

### Styling and UI

- **Tailwind CSS** 3.4.1 -- Utility-first CSS
- **Lucide React** -- Icon library
- **Framer Motion** -- Animations

### Testing

- **Vitest** -- Unit and integration tests
- **happy-dom** -- DOM environment for tests

### Code Quality

- **ESLint** 9.9.1 with TypeScript ESLint

---

## Project Structure

```
laminin-site/
├── public/                  # Static assets (images/brand, images/products)
├── src/
│   ├── components/
│   │   ├── admin/           # Admin dashboard components
│   │   ├── brand/           # Brand-specific components
│   │   ├── cart/            # Cart components
│   │   ├── chat/            # Chatbot widget
│   │   ├── checkout/        # Checkout flow components
│   │   ├── entry/           # Entry-point wrappers
│   │   ├── faq/             # FAQ accordion
│   │   ├── layout/          # Header, Footer, Section, Container
│   │   ├── legal/           # Legal page components
│   │   ├── peptides/        # Peptide-specific components
│   │   ├── products/        # Product cards, grids
│   │   ├── routing/         # Route guards, admin routes
│   │   ├── sections/        # Homepage sections (Hero, Features, etc.)
│   │   ├── seo/             # SEO meta components
│   │   └── ui/              # Reusable UI (Button, Card, Typography)
│   │
│   ├── context/             # React contexts
│   │   ├── AdminAuthContext  # Supabase admin auth state
│   │   ├── CartContext       # Shopping cart state
│   │   ├── ShopImagesContext # Product images from Supabase Storage
│   │   └── ToastContext      # Toast notifications
│   │
│   ├── data/                # Static product and peptide data
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities (supabase client, formatting, image URLs)
│   ├── pages/               # Page components (see Routes below)
│   ├── services/            # Backend service modules
│   │   ├── supabaseService  # Core Supabase CRUD operations
│   │   ├── proteinCheckout  # Checkout session logic
│   │   ├── discountService  # Discount code validation and redemption
│   │   ├── emailService     # Email via Resend
│   │   ├── chatService      # Chat edge function client
│   │   └── bankTransferPayment  # Bank transfer payment flow
│   │
│   ├── styles/              # CSS files
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Shared utility functions
│   ├── constants/           # App-wide constants
│   ├── App.tsx              # Main app with routing
│   └── main.tsx             # Entry point
│
├── supabase/
│   ├── functions/           # Edge Functions (see below)
│   ├── migrations/          # Database migrations
│   ├── config.toml          # Supabase project config
│   └── schema.sql           # Database schema
│
└── docs/                    # Guides and runbooks (see docs/README.md)
```

---

## Routes

### Public

| Path | Page |
|------|------|
| `/` | Homepage |
| `/library` | Peptide library with filtering |
| `/products/:slug` | Individual product page |
| `/research` | Research library |
| `/faq` | FAQ (accordion, single item open at a time) |
| `/coa` | Certificates of Analysis |
| `/guarantee` | Purity assurance guarantee |
| `/contact` | Contact form |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/order-confirmation` | Post-purchase confirmation |
| `/privacy` | Privacy policy |
| `/disclaimer` | Legal disclaimer |
| `/shipping` | Shipping information |
| `/reconstitution-calculator` | Reconstitution calculator (hidden from nav, shareable via direct link) |

### Admin (behind Supabase Auth)

| Path | Page |
|------|------|
| `/admin/login` | Admin login |
| `/admin/dashboard` | Orders and payment tracking |
| `/admin/products` | Product CRUD (add, edit, delete, sale pricing, images) |
| `/admin/inventory` | Inventory management with audit trail |
| `/admin/discounts` | Discount codes with validation and redemption tracking |
| `/admin/customers` | Customer records |
| `/admin/emails` | Email logs |
| `/admin/tools` | Reconstitution calculator link, CSV export, utilities |

---

## Homepage Sections

1. **Hero** -- Main brand statement with CTAs (aqua background)
2. **TrustBar** -- Trust indicators (black background)
3. **TrustBadges** -- Badge icons for credibility
4. **FeaturedProducts** -- Product grid (white background)
5. **PeptideToggleSection** -- Quality pillars with images and subtext (grey background)
6. **ResearchCategories** -- Category showcase (aqua background)
7. **Disclaimer** -- Legal disclaimer (white background with black box)
8. **CTASection** -- Final call-to-action (aqua background)

PromoVideo section exists in code but is currently hidden.

---

## Key Features

- **Admin dashboard** -- 7 pages for managing orders, products, inventory, discounts, customers, emails, and tools
- **Product management** -- Full CRUD from admin with sale pricing, compare-at prices, sale badges, and image uploads to Supabase Storage
- **Checkout** -- Bank transfer payment flow with BAC water recommendation
- **Discount codes** -- Validation, redemption tracking, usage limits
- **Order notifications** -- Email via Resend on order creation; SMS via Twilio when payment is marked received
- **Inventory tracking** -- Stock levels with audit trail (`inventory_transactions`)
- **Customer records** -- Auto-created at checkout
- **Reconstitution calculator** -- Hidden from nav, shareable link available in admin Tools
- **Reconstitution guide** -- Shown in order details with CSV export
- **Security** -- RLS policies restrict anon access; admin operations guarded by `jwt_is_admin()`
- **No GST/tax** -- Prices are tax-inclusive, tax rate defaults to 0

---

## Supabase Backend

### Database Tables

`payment_tracking` (canonical orders), `product_mappings`, `customers`, `discount_codes`, `email_logs`, `sms_logs`, `inventory_transactions`, `product_images`

### Edge Functions

`send-order-email`, `notify-payment-received`, `secure-checkout-init`, `chat`, `send-contact-message`, `partner-payment-ready`, `twilio-status-callback`

### Storage

`product-images` bucket (public) -- all product images uploaded via admin.

---

## Available Scripts

```bash
npm run dev                # Start dev server (port 5173)
npm run build              # Production build to /dist
npm run preview            # Preview production build (port 4173)
npm run typecheck          # TypeScript type checking
npm run lint               # ESLint
npm run test               # Run tests (Vitest)
npm run test:watch         # Run tests in watch mode
npm run sitemap            # Generate sitemap
npm run verify:coa         # Verify COA PDF assets
npm run verify:shop-images # Verify product images
npm run supabase           # Supabase CLI
npm run functions:serve    # Serve edge functions locally
npm run functions:deploy   # Deploy secure-checkout-init
npm run e2e:smoke          # End-to-end smoke test
npm run smoke:secure-checkout  # Smoke test secure checkout
```

---

## Design System

### Colors

- **Pure Black** `#000000` -- Primary text, dark sections
- **Aqua Accent** `#89D1D1` -- Brand color, CTAs
- **Platinum Grey** `#F1F2F2` -- Page background
- **Neutral Grey** `#EDEDEE` -- Section backgrounds
- **White** `#FFFFFF` -- Cards, elevated surfaces

### Typography

- **Font:** system-ui (platform native)
- **Headings:** Uppercase, light weight, generous letter spacing
- **Body:** Normal weight, comfortable line height
- **Labels:** Uppercase, small, wide tracking

---

## Deployment

Frontend deploys to **Vercel** via GitHub. Backend runs on **Supabase cloud**.

### Build Checklist

- [ ] `npm run typecheck` -- no errors
- [ ] `npm run lint` -- no errors
- [ ] `npm run test` -- tests pass
- [ ] `npm run build` -- builds successfully
- [ ] Test all pages load
- [ ] Test mobile responsive

### Vercel SPA Routing

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## Troubleshooting

**Build fails:**
```bash
npm run typecheck    # See TypeScript errors
```

**Images not loading:**
- Check file path starts with `/`
- Verify file exists in `public/images/` or is uploaded to the Supabase `product-images` bucket
- Clear browser cache

**Styles not applying:**
- Check Tailwind class spelling
- Restart dev server
- Check for class conflicts

---

## License

Proprietary -- All rights reserved

---

Last updated: April 2026
