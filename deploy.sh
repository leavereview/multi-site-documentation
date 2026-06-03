#!/usr/bin/env bash
#
# deploy.sh — atomic, verified deploy to Lightsail.
#
# Prevents the recurring "zombie page" bug: a stale dist/ (built before pages
# were deleted) getting rsynced, so deleted pages reappear live. This script
# ALWAYS rebuilds from clean, then refuses to finish unless the live sitemap
# URL count matches the freshly-built local one.
#
# Usage:
#   ./deploy.sh <site-folder> [--yes]
#   ./deploy.sh petcare.software
#   ./deploy.sh mydriveschool.software --yes   # skip the dry-run confirmation
#
set -euo pipefail

SITE="${1:-}"
AUTO="${2:-}"

# folder -> "server-path|domain"  (domain is what the live sitemap is served under)
case "$SITE" in
  mydojo.software)        DEST="/var/www/mydojo.software/";      DOMAIN="mydojo.software" ;;
  mytattoo.software)      DEST="/var/www/mytattoo.software/";    DOMAIN="mytattoo.software" ;;
  petcare.software)       DEST="/var/www/petcare.software/";     DOMAIN="petcare.software" ;;
  mydriveschool.software) DEST="/var/www/driveschoolpro.com/";   DOMAIN="driveschoolpro.com" ;;  # folder != domain
  *) echo "Unknown site folder: '$SITE'"; echo "Valid: mydojo.software | mytattoo.software | petcare.software | mydriveschool.software"; exit 1 ;;
esac

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/$SITE"

echo "════════ 1/4  Clean atomic build: $SITE → lightsail:$DEST ════════"
rm -rf dist .astro
npm run build              # postbuild runs verify-seo.js; a non-zero exit aborts the deploy here

LOCAL=$(grep -o "<loc>" dist/sitemap-0.xml | wc -l | tr -d ' ')
echo "  Fresh build: $LOCAL sitemap URLs"

echo "════════ 2/4  Dry-run (what --delete will remove) ════════"
rsync -avz --delete --dry-run dist/ "lightsail:$DEST" | grep '^deleting' || echo "  (nothing to delete)"

if [ "$AUTO" != "--yes" ]; then
  read -r -p "Proceed with deploy? [y/N] " ans
  [ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "Aborted."; exit 1; }
fi

echo "════════ 3/4  Deploy ════════"
rsync -avz --delete dist/ "lightsail:$DEST"

echo "════════ 4/4  Verify live == local ════════"
sleep 2
LIVE=$(curl -s --max-time 20 "https://$DOMAIN/sitemap-0.xml" | grep -o "<loc>" | wc -l | tr -d ' ')
echo "  local=$LOCAL  live=$LIVE"
if [ "$LOCAL" = "$LIVE" ]; then
  echo "✅ Deploy verified — live sitemap matches local build ($LIVE URLs)."
else
  echo "❌ MISMATCH — live=$LIVE vs local=$LOCAL. Investigate before assuming success."
  echo "   (CDN cache? wrong nginx root? check: ssh lightsail 'grep -o \"<loc>\" $DEST/sitemap-0.xml | wc -l')"
  exit 1
fi
