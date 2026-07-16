# Environment configuration

## Local development

Copy `.env.example` to `.env.local` (gitignored):

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon/publishable key for the storefront |
| `VITE_APP_URL` | Canonical site URL — use `http://localhost:5180` locally |

Dev server runs on **port 5180** (`vite.config.ts`).

## Production

Set the same `VITE_*` vars in your host (Vercel, etc.). Never commit `.env.local`.

| Variable | Purpose |
|----------|---------|
| `VITE_APP_URL` | `https://lamininpeplab.com.au` (or your domain) |
| `VITE_SENTRY_DSN` | Optional — error monitoring (requires `@sentry/react`) |

## Supabase CLI (terminal only)

Not read by Vite. Use for migrations and edge function deploy:

```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase db push
npx supabase functions deploy analytics-event --no-verify-jwt
npx supabase functions deploy create-order --no-verify-jwt
```

Edge secrets (Twilio, Resend, etc.) go in **Supabase Dashboard → Edge Functions → Secrets**.

## Scripts

```bash
npm run dev          # http://localhost:5180
npm test             # Vitest unit tests
npm run test:e2e     # Playwright (starts dev server)
npm run sitemap      # Regenerate public/sitemap.xml
```

## Playwright

Override port if needed:

```bash
PLAYWRIGHT_PORT=5180 npm run test:e2e
PLAYWRIGHT_MOBILE=1 npm run test:e2e   # includes iPhone project (requires webkit)
```
