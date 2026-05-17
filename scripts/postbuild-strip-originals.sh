#!/usr/bin/env bash
# Strip original product PNGs from dist/images/products/ to shrink the deploy.
#
# Why this is opt-in (run via `npm run build:strip-originals`, not automatic):
#   The original PNGs may still be referenced by:
#     - Email HTML (transactional sends)
#     - Social cards / OG images
#     - Hard-coded URLs in CMS content
#     - External integrations
#   The optimised <picture> srcset already prevents browsers from fetching them
#   from the storefront, so leaving them in dist doesn't slow users down — it
#   just costs CDN storage. Only strip when you're sure no external reference
#   still depends on them.
#
# Behaviour
#   - Keeps dist/images/products/optimized/* (the served variants)
#   - Removes original PNGs at the top level of dist/images/products/
#   - The default-fallback image lives at /images/purity.png (NOT in /products/),
#     so it is untouched by this script.
#
# Reversibility
#   Just re-run `npm run build` to regenerate the originals.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT/dist/images/products"

if [[ ! -d "$DIST_DIR" ]]; then
  echo "No dist/images/products directory found — run \`npm run build\` first." >&2
  exit 1
fi

# Whitelist files to keep at the top level (no recursive — only top-level files).
KEEP_NAMES=("purity.png")

stripped=0
kept=0

shopt -s nullglob
for f in "$DIST_DIR"/*; do
  [[ -f "$f" ]] || continue   # skip directories like 'optimized/'
  base="$(basename "$f")"
  keep=false
  for k in "${KEEP_NAMES[@]}"; do
    if [[ "$base" == "$k" ]]; then keep=true; break; fi
  done
  if $keep; then
    kept=$((kept + 1))
  else
    rm -f "$f"
    stripped=$((stripped + 1))
  fi
done

echo "Stripped ${stripped} files, kept ${kept}."
du -sh "$DIST_DIR" 2>/dev/null || true
