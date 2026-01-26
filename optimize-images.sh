#!/bin/bash

# Image Optimization Script for All Sites
# This script optimizes JPG images across all four sites

echo "🖼️  Image Optimization Script"
echo "=============================="
echo ""

# Check for required tools
command -v jpegoptim >/dev/null 2>&1 || {
  echo "❌ jpegoptim not found. Install with: brew install jpegoptim"
  exit 1
}

command -v cwebp >/dev/null 2>&1 || {
  echo "❌ cwebp not found. Install with: brew install webp"
  exit 1
}

# Function to optimize images in a directory
optimize_site() {
  local site=$1
  local image_dir="${site}/public/images"

  if [ ! -d "$image_dir" ]; then
    echo "⚠️  Skipping ${site} - images directory not found"
    return
  fi

  echo "📁 Optimizing images in ${site}..."

  # Count images
  jpg_count=$(find "$image_dir" -name "*.jpg" -o -name "*.jpeg" | wc -l | tr -d ' ')

  if [ "$jpg_count" -eq 0 ]; then
    echo "   No JPG images found"
    return
  fi

  echo "   Found ${jpg_count} JPG images"

  # Get total size before optimization
  size_before=$(du -sh "$image_dir" | cut -f1)

  # Optimize JPGs (keep under 150KB for most, 200KB for large images)
  echo "   Compressing JPG files..."
  find "$image_dir" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | while read -r img; do
    # Get file size in KB
    size=$(du -k "$img" | cut -f1)

    if [ "$size" -gt 200 ]; then
      # Large images - compress more aggressively
      jpegoptim --size=150k --strip-all "$img" 2>/dev/null
    elif [ "$size" -gt 100 ]; then
      # Medium images
      jpegoptim --size=100k --strip-all "$img" 2>/dev/null
    else
      # Small images - just strip metadata
      jpegoptim --strip-all "$img" 2>/dev/null
    fi
  done

  # Create WebP versions
  echo "   Creating WebP versions..."
  find "$image_dir" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | while read -r img; do
    webp_file="${img%.*}.webp"
    if [ ! -f "$webp_file" ]; then
      cwebp -q 85 "$img" -o "$webp_file" 2>/dev/null
    fi
  done

  # Get total size after optimization
  size_after=$(du -sh "$image_dir" | cut -f1)

  echo "   ✅ Done! Size: ${size_before} → ${size_after}"
  echo ""
}

# Optimize all sites
cd "$(dirname "$0")"

optimize_site "mydojo.software"
optimize_site "petcare.software"
optimize_site "mydriveschool.software"
optimize_site "mytattoo.software"

echo "✨ All done! Images optimized across all sites."
echo ""
echo "Next steps:"
echo "1. Review the changes: git status"
echo "2. Test locally: cd <site> && npm run dev"
echo "3. Commit changes: git add . && git commit -m 'Optimize images for performance'"
echo "4. Deploy: git push origin main"
