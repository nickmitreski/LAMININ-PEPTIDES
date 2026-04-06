#!/usr/bin/env bash
# Dry-run style test: calls partner-payment-ready with MOCK_SMS_DELIVERY on LAMIN (no real SMS).
# Usage:
#   export LAMIN_SUPABASE_URL='https://xxxxx.supabase.co'
#   export PARTNER_PAYMENT_READY_SECRET='...'
#   export TEST_PEPTIDE_ORDER_ID='...'   # must exist in checkout_secure_sessions / order flow
#   export TEST_CODE='123456'            # must match the session's code (you get it from ingest in dev only)
#   ./scripts/smoke-partner-payment-ready.sh
set -euo pipefail
: "${LAMIN_SUPABASE_URL:?Set LAMIN_SUPABASE_URL}"
: "${PARTNER_PAYMENT_READY_SECRET:?Set PARTNER_PAYMENT_READY_SECRET}"
: "${TEST_PEPTIDE_ORDER_ID:?Set TEST_PEPTIDE_ORDER_ID}"
: "${TEST_CODE:?Set TEST_CODE}"
URL="${LAMIN_SUPABASE_URL%/}/functions/v1/partner-payment-ready"
curl -sS -X POST "$URL" \
  -H "Authorization: Bearer ${PARTNER_PAYMENT_READY_SECRET}" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n \
    --arg ref "$TEST_PEPTIDE_ORDER_ID" \
    --arg code "$TEST_CODE" \
    '{peptide_order_id:$ref,payment_url:"https://pay.example.com/test-session",verification_code:$code,payment_id:"smoke-test"}')" \
  | jq .
