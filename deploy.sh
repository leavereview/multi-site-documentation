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
  mydojo.software)        DEST="/var/www/beltmanager.com/";      DOMAIN="beltmanager.com" ;;  # folder != domain (migrated from mydojo.software)
  mytattoo.software)      DEST="/var/www/mytattoo.software/";    DOMAIN="mytattoo.software" ;;
  petcare.software)       DEST="/var/www/petcare.software/";     DOMAIN="petcare.software" ;;
  mydriveschool.software) DEST="/var/www/driveschoolpro.com/";   DOMAIN="driveschoolpro.com" ;;  # folder != domain
  *) echo "Unknown site folder: '$SITE'"; echo "Valid: mydojo.software | mytattoo.software | petcare.software | mydriveschool.software"; exit 1 ;;
esac

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/$SITE"

echo "════════ 1/6  Clean atomic build: $SITE → lightsail:$DEST ════════"
rm -rf dist .astro
npm run build              # postbuild runs verify-seo.js; a non-zero exit aborts the deploy here

LOCAL=$(grep -o "<loc>" dist/sitemap-0.xml | wc -l | tr -d ' ')
echo "  Fresh build: $LOCAL sitemap URLs"

echo "════════ 2/6  Dry-run (what --delete will remove) ════════"
rsync -avz --delete --dry-run dist/ "lightsail:$DEST" | grep '^deleting' || echo "  (nothing to delete)"

if [ "$AUTO" != "--yes" ]; then
  read -r -p "Proceed with deploy? [y/N] " ans
  [ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "Aborted."; exit 1; }
fi

echo "════════ 3/6  Deploy ════════"
rsync -avz --delete dist/ "lightsail:$DEST"

echo "════════ 4/6  Verify live == local ════════"
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

echo "════════ 5/6  TLS certificate health ════════"
# Advisory only — a near-expiry cert must not fail a content deploy, but we surface
# it on every deploy so a failing auto-renewal can't stay invisible for months
# (which is exactly how driveschoolpro.com's cert lapsed in June 2026).
"$ROOT/tools/check-certs.sh" || echo "  ⚠️  cert check flagged an issue (above) — does not block this deploy, but investigate soon."

echo "════════ 6/6  IndexNow (Bing, Yandex, Seznam, Naver) ════════"
# Opt-in per site: a site takes part when its public/ holds a key file named
# <32-hex-key>.txt containing that key. Pings every sitemap URL; advisory only.
KEYFILE=$(ls public/ 2>/dev/null | grep -E '^[0-9a-f]{32}\.txt$' | head -1 || true)
if [ -n "$KEYFILE" ]; then
  KEY="${KEYFILE%.txt}"
  URLS=$(grep -o "<loc>[^<]*</loc>" dist/sitemap-0.xml | sed -e 's/<loc>//' -e 's/<\/loc>//' | sed 's/.*/"&"/' | paste -sd, -)
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{\"host\":\"$DOMAIN\",\"key\":\"$KEY\",\"keyLocation\":\"https://$DOMAIN/$KEYFILE\",\"urlList\":[$URLS]}" || echo "000")
  case "$CODE" in
    200|202) echo "  ✅ IndexNow accepted $LIVE URLs (HTTP $CODE)" ;;
    *)       echo "  ⚠️  IndexNow returned HTTP $CODE — does not block this deploy" ;;
  esac
else
  echo "  (no IndexNow key file in public/ — skipped)"
fi
