#!/usr/bin/env bash
# Push pending Supabase migrations + redeploy edge functions for production.
# Requires: SUPABASE_ACCESS_TOKEN for the org that owns ytacbvfcltikxzudlkzn
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REF="${SUPABASE_PROJECT_REF:-ytacbvfcltikxzudlkzn}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Set SUPABASE_ACCESS_TOKEN (Account → Access Tokens) for the Laminin project org, then re-run."
  exit 1
fi

echo "==> db push ($REF)"
npx supabase db push --project-ref "$REF" --include-all --yes

echo "==> deploy edge functions"
# verify_jwt off where the storefront calls with anon key / no user JWT
npx supabase functions deploy analytics-event --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy create-order --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy chat --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy send-order-email --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy payment-reminders --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy secure-checkout-init --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy send-contact-message --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy notify-payment-received --project-ref "$REF" --no-verify-jwt
npx supabase functions deploy partner-payment-ready --project-ref "$REF" --no-verify-jwt

echo "==> CORS smoke (lamininpeplab.com.au)"
curl -sS -D - -o /dev/null -X OPTIONS \
  "https://${REF}.supabase.co/functions/v1/analytics-event" \
  -H "Origin: https://lamininpeplab.com.au" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin || true

echo "Done."
