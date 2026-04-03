# Main-Docs

Single entry point for **LAMININ / Lamin storefront** documentation that reflects the current codebase (checkout, Supabase bridge, secure code flow).

| Document | Purpose |
|----------|---------|
| [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md) | Repos layout, env vars, data flow, key files |
| [SECURE-CHECKOUT-STEP-BY-STEP.md](./SECURE-CHECKOUT-STEP-BY-STEP.md) | Ordered **prompts** to implement/deploy secure checkout + SQL reference |
| [QUICK-STEPS.md](./QUICK-STEPS.md) | **Short list**: no Resend/Twilio, what’s stored, deploy order |
| [REFERRAL-WHITE-LABEL-PAYMENT.md](./REFERRAL-WHITE-LABEL-PAYMENT.md) | API-only handoff, no extra webhook, branding env |
| [PARTNER-SQUARE-PAYMENT-LINK.md](./PARTNER-SQUARE-PAYMENT-LINK.md) | Partner `create-payment-link` contract, Square + code, SQL starter |
| [LAMIN-SUPABASE-VERIFY-STEPS.md](./LAMIN-SUPABASE-VERIFY-STEPS.md) | **LAMIN DB only:** one SQL step at a time to verify `checkout_secure_sessions` |
| [E2E-LOCAL-PAYMENT-TEST.md](./E2E-LOCAL-PAYMENT-TEST.md) | Local UI + cloud Edge: how to test links, email/SMS, `scripts/smoke-secure-checkout.sh` |
| [TWO-BACKENDS-CHECKLIST.md](./TWO-BACKENDS-CHECKLIST.md) | **LAMIN vs partner:** secrets to set, what each side sends/receives, no Twilio path |
| [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md) | **GitHub + Vercel:** env vars, Supabase Auth URLs, Edge Functions stay on Supabase |
| [PARTNER-PRE-DEPLOY-GITHUB-BOLT.md](./PARTNER-PRE-DEPLOY-GITHUB-BOLT.md) | **Partner site:** before GitHub + Bolt — DB, Edge secrets, `FRONTEND_URL`, LAMIN `PAYMENT_LINK_*` |
| [SQL — checkout_secure_sessions](../supabase/migrations/20260403120000_checkout_secure_sessions.sql) | Table for hashed codes + enriched line items |

Start with **SYSTEM-OVERVIEW**, then follow **SECURE-CHECKOUT-STEP-BY-STEP** when deploying Twilio/Resend and the Edge Function.
