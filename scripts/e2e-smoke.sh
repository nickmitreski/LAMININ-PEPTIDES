#!/usr/bin/env bash
# Seed smoke order on the linked Supabase project, then call secure-checkout-init.
# Requires: npx supabase login, linked project (supabase link), .env.local with VITE_SUPABASE_*.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Seeding order_references row (PEP-20991231-SMK1) on linked DB..."
npx supabase db query --linked -f scripts/seed-smoke-order.sql --agent=no

echo "==> POST secure-checkout-init..."
exec "$ROOT/scripts/smoke-secure-checkout.sh"
