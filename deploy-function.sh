#!/bin/bash
set -e

# Laminin Supabase credentials
PROJECT_REF="ytacbvfcltikxzudlkzn"
ACCESS_TOKEN="sbp_61c54c2173b314a828e8b62484fd53cb1629b05b"
FUNCTION_NAME="secure-checkout-init"

echo "Deploying $FUNCTION_NAME to Laminin Supabase..."

# Bundle the function code
cd "$(dirname "$0")"

# Create a temporary directory for bundled code
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy the main function file
mkdir -p "$TEMP_DIR/index"
cp "supabase/functions/$FUNCTION_NAME/index.ts" "$TEMP_DIR/index.ts"

# Copy shared dependencies
mkdir -p "$TEMP_DIR/_shared"
cp supabase/functions/_shared/rateLimit.ts "$TEMP_DIR/_shared/"
cp supabase/functions/_shared/twilioSms.ts "$TEMP_DIR/_shared/"

# Create import map if it doesn't exist
if [ ! -f "supabase/functions/import_map.json" ]; then
  echo '{"imports": {}}' > "$TEMP_DIR/import_map.json"
else
  cp supabase/functions/import_map.json "$TEMP_DIR/"
fi

# Use Supabase CLI with direct project ref
export SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN"

echo "Attempting deployment..."
supabase functions deploy "$FUNCTION_NAME" \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

echo "Deployment complete!"
