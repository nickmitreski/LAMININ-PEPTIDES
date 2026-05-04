# Design System — Laminin Peptide Lab

## Product Context
- **What this is:** E-commerce site for research-grade peptides with admin dashboard
- **Who it's for:** Scientists, lab professionals, research institutions in Australia
- **Space/industry:** Research peptides, biotech supply, pharmaceutical
- **Project type:** E-commerce storefront + admin panel
- **Memorable thing:** "This looks like a real pharmaceutical company, not a supplement store."

## Aesthetic Direction
- **Direction:** Editorial Light / Refined Clinical
- **Decoration level:** Intentional (subtle texture on hero, whitespace does heavy lifting)
- **Mood:** European pharma company that also knows design. Precise, trustworthy, clean. Confidence comes from typography and whitespace, not darkness or decoration.
- **Competitive positioning:** Light-mode clinical separates from dark-mode supplement stores. Type-driven identity separates from generic white-background Tailwind sites.

## Typography
- **Display/Headings:** Cabinet Grotesk (Fontshare, free) — geometric precision, bold, tight tracking. Used for all headings, buttons, section titles, accordion labels, tile overlays.
- **Body:** Instrument Sans (Google Fonts, free) — warm, readable, slightly humanist. Used for paragraphs, form inputs, metadata, labels.
- **Data/Tables:** System monospace (Courier New fallback) — tabular numerals for batch IDs, pricing, and purity data.
- **Loading:** CDN via Google Fonts (Instrument Sans) and Fontshare API (Cabinet Grotesk). Preconnect links in index.html.
- **Scale:** Uses Tailwind's default rem scale (xs through 7xl) with custom line-height and letter-spacing per size.

### Font Rules
- Headings: `font-display font-bold tracking-tight uppercase`
- Buttons: `font-display font-medium tracking-button`
- Labels: `font-sans text-xs font-medium tracking-widest uppercase`
- Body: `font-sans text-base leading-relaxed`
- Never use: Papyrus, Comic Sans, Lobster, Impact, or system-ui as display font.

## Color
- **Approach:** Restrained (1 accent + neutrals, color is rare and meaningful)
- **Accent:** #89D1D1 (aqua/teal) — brand primary, used on hero backgrounds, badges, CTA sections, accent buttons
- **Accent Dark:** #6BBFBF — hover states, active elements
- **Accent Muted:** #E8F5F5 — light tints, info tile backgrounds
- **Carbon:** #000000 — primary text, buttons, headings
- **Navy:** #0F172A — header, footer, trust bar (planned, not yet implemented)
- **Neutrals:** Warm grey scale from #F7F7F7 (surface) to #1A1B1B (dark)
- **Platinum:** #F1F2F2 — page backgrounds, card fills
- **Semantic status colors (themed):**
  - Error: #DC2626 (red-600 equivalent)
  - Success: #16A34A (green-600 equivalent)
  - Warning: #D97706 (amber-600 equivalent)
  - Info: #2563EB (blue-600 equivalent)
  - Each has light/muted/border/dark/text variants in tailwind.config.js

## Spacing
- **Base unit:** 4px (Tailwind default)
- **Density:** Comfortable
- **Scale:** 1(4px) 2(8px) 3(12px) 4(16px) 6(24px) 8(32px) 12(48px) 16(64px)
- **Section spacing:** sm/md/lg/xl mapped via Section component
- **Card padding:** sm(16px) md(20px) lg(24px) via Card component
- **Grid gaps:** gap-3 (mobile) scaling to gap-6 (desktop)

## Layout
- **Approach:** Grid-disciplined
- **Grid:** 1-col mobile, 2-col tablet, 4-col desktop for product grids
- **Max content width:** 6xl (1152px) via Container component
- **Border radius:**
  - Buttons: rounded-sm (3px)
  - Cards/tiles: rounded-xl (12px)
  - Images: rounded-lg (8px)
  - Badges: rounded-full (pill)
  - Inputs: rounded-md (6px)

## Motion
- **Approach:** Minimal-functional
- **One-shot animations:** fadeIn (0.2s), slideInRight (0.3s), fadeInUp (0.6s) — defined in index.css
- **Scroll reveal:** 700ms ease with 80ms stagger delays — defined in animations.css
- **Framer Motion:** Hero section only (stagger entrance, hover on product cards)
- **Easing:** cubic-bezier(0.25, 0.1, 0.25, 1) for reveals, ease-out for one-shots
- **Reduced motion:** All animations respect prefers-reduced-motion

## Component Conventions
- **Typography:** Always use Heading/Text/Label components. Never raw HTML headings or inline text classes.
- **Buttons:** Always use Button component with variant prop. Never hardcode button classes.
- **Cards:** Use Card component for content containers. Use plain divs only when Card's styling conflicts.
- **Modals:** Use Modal component for all dialogs (handles portal, backdrop, ESC, scroll lock).
- **CTA sections:** Use CTACard component for bottom-of-page contact prompts.
- **Page headers:** Use PageHero (with info tiles) for key pages, PageTopBanner (simpler) for policy pages.
- **Class composition:** Use cn() utility for conditional className building. Never template literals with ternaries.
- **Status colors:** Always use error/success/warning/info theme tokens. Never hardcode red/green/amber/blue.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-05 | Cabinet Grotesk + Instrument Sans | Replaces Helvetica Neue. Cabinet Grotesk has geometric clinical precision for headings. Instrument Sans is warm and readable for body. Together they signal intentionality. |
| 2026-05-05 | Keep light theme as default | Light mode is clinical and editorial. Dark mode planned as optional toggle. |
| 2026-05-05 | Semantic status color tokens | error/success/warning/info in tailwind.config.js replace all hardcoded red/green/amber/blue for consistency. |
| 2026-05-04 | Scroll-reveal on all content pages | Consistent entrance animations using existing CSS reveal system. |
| 2026-05-04 | Reusable Modal component | Shared portal/backdrop/ESC/scroll-lock primitive replaces 3+ inline implementations. |
