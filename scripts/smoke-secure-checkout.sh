#!/usr/bin/env bash
# Smoke-test LAMIN Edge Function secure-checkout-init (requires seed-smoke-order.sql applied first).
# Usage: from repo root,  ./scripts/smoke-secure-checkout.sh
# Loads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — copy from .env.local.template and add Supabase URL + anon/publishable key."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

ORDER_ID="${1:-PEP-20991231-SMK1}"

echo "POST secure-checkout-init for order $ORDER_ID ..."
BODY=$(ORDER_ID="$ORDER_ID" python3 << 'PY'
import json, os
oid = os.environ["ORDER_ID"]
print(json.dumps({
  "peptide_order_id": oid,
  "customer": {"email": "smoke-test@example.com", "phone": "+61400000000", "first_name": "Smoke", "last_name": "Test"},
  "totals": {"grand_total": 99.5, "subtotal": 80, "shipping": 10, "tax": 9.5},
  "send_email": True,
  "send_sms": False,
  "enriched_lines": [],
  "peptide_items": [],
  "protein_items": [],
}))
PY
)

curl -sS -X POST "${VITE_SUPABASE_URL}/functions/v1/secure-checkout-init" \
  -H "Content-Type: application/json" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -d "$BODY"

echo ""
