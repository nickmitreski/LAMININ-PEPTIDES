#!/usr/bin/env bash
# Optimise /public/images/products/*.png into AVIF + WebP at responsive sizes.
#
# Output: public/images/products/optimized/<basename>-<width>w.{avif,webp,png}
# The <basename> excludes the original extension. Filenames preserve spaces.
#
# Idempotent — only regenerates outputs that are older than the source.
#
# Requires: cwebp, avifenc, sips (preinstalled on macOS).
#
# Usage:
#   bash scripts/optimize-product-images.sh           # all sizes
#   WIDTHS="400 800" bash scripts/optimize-product-images.sh  # subset

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT/public/images/products"
OUT_DIR="$SRC_DIR/optimized"

WIDTHS="${WIDTHS:-400 800 1200}"
AVIF_QUALITY="${AVIF_QUALITY:-60}"     # 0-100 (higher = better; avifenc -q scale)
WEBP_QUALITY="${WEBP_QUALITY:-82}"     # 0-100 (higher = better)

mkdir -p "$OUT_DIR"

need_regen() {
  # need_regen <source> <target> → returns 0 if target missing or older than source
  local src="$1" tgt="$2"
  [[ ! -f "$tgt" ]] && return 0
  [[ "$src" -nt "$tgt" ]] && return 0
  return 1
}

count_total=0
count_skipped=0
count_built=0

shopt -s nullglob
for src in "$SRC_DIR"/*.png "$SRC_DIR"/*.PNG; do
  [[ -f "$src" ]] || continue
  count_total=$((count_total + 1))
  base="$(basename "$src")"
  stem="${base%.*}"

  # Probe source dimensions to skip enlargements
  src_w=$(sips -g pixelWidth "$src" 2>/dev/null | awk '/pixelWidth/{print $2}' || echo 0)
  if [[ -z "$src_w" || "$src_w" -eq 0 ]]; then
    echo "skip (no dims): $base"
    count_skipped=$((count_skipped + 1))
    continue
  fi

  for w in $WIDTHS; do
    if [[ "$w" -gt "$src_w" ]]; then
      # Don't upscale — generate at source width and label it as the requested bucket
      # so the page still finds the file. Instead skip larger buckets if source is small.
      continue
    fi

    avif_out="$OUT_DIR/${stem}-${w}w.avif"
    webp_out="$OUT_DIR/${stem}-${w}w.webp"
    png_out="$OUT_DIR/${stem}-${w}w.png"

    if need_regen "$src" "$avif_out" || need_regen "$src" "$webp_out" || need_regen "$src" "$png_out"; then
      # Resize to PNG first (sips), then encode to avif/webp.
      tmp_png="$(mktemp -t opt-img-XXXXXX).png"
      # --resampleWidth preserves aspect; result is approximately wxh keeping ratio
      sips --resampleWidth "$w" "$src" --out "$tmp_png" >/dev/null

      if need_regen "$src" "$avif_out"; then
        # Modern avifenc: -q is 0-100 (higher = better quality).
        avifenc -q "$AVIF_QUALITY" --speed 6 "$tmp_png" "$avif_out" >/dev/null 2>&1
      fi
      if need_regen "$src" "$webp_out"; then
        cwebp -quiet -q "$WEBP_QUALITY" "$tmp_png" -o "$webp_out"
      fi
      if need_regen "$src" "$png_out"; then
        cp "$tmp_png" "$png_out"
      fi
      rm -f "$tmp_png"
      count_built=$((count_built + 1))
    fi
  done
done

echo
echo "Done. ${count_built} variants built, ${count_skipped} sources skipped (out of ${count_total} PNGs)."
du -sh "$OUT_DIR" 2>/dev/null || true
