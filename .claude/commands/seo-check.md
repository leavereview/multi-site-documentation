---
description: Run comprehensive SEO check using Google Search Console data
---

# SEO Check Command

Run enhanced SEO performance reports integrating GSC + GA4 + Content Gaps + Historical Tracking + Structural Health.

## Usage

The user can run this command with optional arguments:
- `/seo-check` - Full report: GA4 + trends + sitemaps + rich result errors + mobile usability (last 28 days)
- `/seo-check --domain=petcare.software` - Check single domain with full analysis
- `/seo-check --days=7` - Weekly report (last 7 days)
- `/seo-check --days=90` - Quarterly report (last 90 days)
- `/seo-check --excel` - Generate Excel report instead of enhanced report
- `/seo-check --structural` - Run structural health audit only (no GSC data needed)
- `/seo-check --domain=petcare.software --full` - Performance + full structural audit combined
- `/seo-check --with-coverage` - Adds sitemap health + URL indexing + **rich result errors** + **mobile usability issues**

## Your Task

Parse the user's arguments and execute the appropriate GSC client command, then run the structural health checks below.

---

### Step 1: Determine Command Type

**DEFAULT (Recommended):** Use the enhanced report with GA4 + historical tracking + content gaps
- Command: `cd /Users/john/Projects-code/Front-end-sites/tools/gsc-client && node src/enhanced-report.js --with-analytics --with-coverage --slack [args]`
- This integrates:
  - Google Search Console data
  - Google Analytics 4 engagement metrics
  - SEO_AUDIT_REPORT.md content gap analysis
  - Historical metrics tracking and trends
  - Smart recommendations based on progress
  - Slack notification (performance report + structural health audit sent automatically)

**Add `--with-coverage` to also check** (same API call, ~30s extra):
  - Sitemap submission health
  - URL indexing / coverage state
  - **Rich result / structured data errors** (FAQPage, Article, Breadcrumb, etc.)
  - **Mobile usability issues** (viewport, tap targets, font size, etc.)
  - These surface as CRITICAL/HIGH recommendations and appear in Slack

**If user specifies `--excel`:** Generate Excel-only report
- Command: `cd /Users/john/Projects-code/Front-end-sites/tools/gsc-client && npm run report [args]`

---

### Step 2: Execute GSC Command

Run the appropriate command using the Bash tool and display the output.

---

### Step 3: Structural Health Audit

**Always run this after the GSC report**, or alone if `--structural` is specified.

This catches the class of issues that keep metrics flat even when content is good. Learned from petcare.software full audit (March 2026).

For each domain being checked, cd into the site folder and run:

#### 3A — Build health

```bash
cd /Users/john/Projects-code/Front-end-sites/[domain]
npm run build 2>&1 | tail -20
```

Report:
- Total pages checked by verify-seo.js
- Error count (must be 0)
- Noindexed pages skipped (expected: tag pages only)
- Any new errors vs last check

#### 3B — Sitemap health

```bash
# Local sitemap URL count
cat dist/sitemap-index.xml
# Count URLs in child sitemap
cat dist/sitemap-0.xml | grep -c "<loc>"

# Live sitemap check
curl -s https://[domain]/sitemap-index.xml | grep -c "<loc>"
curl -o /dev/null -s -w "%{http_code}" https://[domain]/sitemap-0.xml
```

Flag as CRITICAL if:
- Live sitemap returns 404 or empty
- URL count in live sitemap does not match local build
- Child sitemap returns non-200

#### 3C — Hub-and-spoke link integrity

For each cluster, check that every spoke post has a hub link in the first 200 words:

```bash
cd /Users/john/Projects-code/Front-end-sites/[domain]

# Skip YAML frontmatter (between --- delimiters), then check first 1500 bytes of body
for file in src/content/blog/*.md; do
  body=$(awk '/^---/{if(++c==2)p=1;next}p' "$file" | head -c 1500)
  if ! echo "$body" | grep -qE "/kennel-software|/dog-daycare-software|/dog-boarding-software|/cattery-software"; then
    echo "MISSING HUB LINK: $(basename $file)"
  fi
done
```

Simpler check — report any blog post with zero internal links:

```bash
grep -rL "](/\|href=\"/" src/content/blog/*.md | head -20
```

Flag as HIGH if any post has zero internal links to any page on the site.

#### 3D — Related Articles section check

```bash
grep -rL "## Related Articles" src/content/blog/*.md
```

Report any file missing `## Related Articles`. Flag as HIGH if count > 0.

#### 3E — Word count spot check

```bash
# Check for posts suspiciously short (under ~800 words is a warning sign)
for file in src/content/blog/*.md; do
  words=$(wc -w < "$file")
  if [ "$words" -lt 800 ]; then
    echo "$words $file"
  fi
done | sort -n
```

Flag as MEDIUM any post under 800 words. Flag as HIGH if a post that was previously above minimum has dropped (indicates accidental truncation on deployment).

#### 3F — Off-topic content check

```bash
ls src/content/blog/*.md | xargs -I{} basename {}
```

Visually scan the list for any filenames that are clearly off-topic for the site's subject matter (e.g. grooming posts on a software site). Flag as CRITICAL if any exist — off-topic content dilutes topical authority across all clusters.

#### 3G — Broken image references

```bash
# Find all image src references in pillar pages
grep -h 'src="/images/' src/pages/*.astro | grep -oP '(?<=src=")[^"]+' | sort -u | while read img; do
  if [ ! -f "public$img" ]; then
    echo "MISSING: $img"
  fi
done
```

Flag as HIGH if any image files referenced in pillar pages do not exist in `/public/`.

#### 3H — Prohibited pages check

```bash
# Check if any previously-deleted content has reappeared (e.g. from git merge)
ls src/content/blog/ | grep -iE "grooming|pup-cup|roadmap|training-tools" 2>/dev/null
ls src/pages/ | grep -iE "roadmap" 2>/dev/null
```

Flag as CRITICAL if any prohibited off-topic pages exist.

#### 3I — Homepage pillar link check

```bash
grep -o 'href="[^"]*software[^"]*"' src/pages/index.astro
```

Report which pillar pages are linked from the homepage. Flag as HIGH if any defined pillar page is missing.

#### 3J — About page E-E-A-T check

```bash
grep -c "05408918\|RevelationPets\|Winchester\|founded" src/pages/about.astro 2>/dev/null || echo "0 matches"
grep -c "href=\"/dog-\|href=\"/kennel\|href=\"/cattery" src/pages/about.astro 2>/dev/null || echo "0 pillar links"
```

Flag as MEDIUM if E-E-A-T signals are absent. Flag as HIGH if about page has zero links to pillar pages.

---

### Step 4: Structural Health Score

After running all checks, produce a structural health summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️  STRUCTURAL HEALTH — [DOMAIN]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Build health:           ✅/❌  (0 errors / X errors)
  Sitemap live:           ✅/❌  (X URLs / 0 URLs)
  Hub links <200w:        ✅/⚠️   (X posts pass / Y missing)
  Related Articles:       ✅/⚠️   (X posts pass / Y missing)
  Short posts (<800w):    ✅/⚠️   (0 / X posts flagged)
  Off-topic content:      ✅/❌  (0 / X files found)
  Broken image refs:      ✅/❌  (0 / X missing)
  Prohibited pages:       ✅/❌  (0 / X found)
  Homepage pillar links:  ✅/⚠️   (X/4 pillars linked)
  About E-E-A-T:          ✅/⚠️   (signals present/absent)

  Structural Score: XX/10 checks passing

  🔴 CRITICAL issues: [list]
  🟠 HIGH issues:     [list]
  🟡 MEDIUM issues:   [list]
```

---

### Step 5: Combined Analysis

After both the GSC report and structural audit, provide a unified summary:

**If metrics are flat or declining AND structural issues exist:**
> Flag that the structural issues are likely the cause. Performance improvements will be blocked until structure is fixed. Prioritise structural fixes over new content creation.

**If metrics are improving AND structural issues exist:**
> Note that growth is happening despite structural issues. Fixing them will accelerate improvement.

**If metrics are flat AND no structural issues:**
> The site is structurally sound. Flat metrics indicate authority/age problem or content quality gap. Recommend competitor content gap analysis and backlink review.

**If metrics are improving AND no structural issues:**
> Everything is working. Continue current strategy. Report which content and clusters are driving growth.

---

### Step 6: Analyze Results

Summarize across both reports:
- Key performance trends (improving/declining per domain)
- Structural health per domain (score + critical issues)
- Most critical recommendations (structural first, then content)
- Quick wins (positions 4–20 in striking distance)
- Content gap priorities

---

## Logging SEO Changes

After making any SEO changes (content, meta, technical, links), log them:

```bash
cd /Users/john/Projects-code/Front-end-sites/tools/gsc-client && node src/enhanced-report.js \
  --log-change="Description of what you did" \
  --sites=[domain] \
  --category=[content|technical|meta|links|schema|analytics|conversion|performance] \
  --reason="Why you made the change" \
  --expected-impact="What metric should improve" \
  --expected-timeline="2-4 weeks"
```

**Categories**: `content` | `technical` | `meta` | `links` | `schema` | `analytics` | `conversion` | `performance`

Claude should automatically log changes after completing any SEO work in a session.

---

## Important Notes

- The enhanced report automatically saves historical data for trend tracking
- Historical data: `/Users/john/Projects-code/Front-end-sites/tools/gsc-client/history/<domain>.json`
- Changelog: `/Users/john/Projects-code/Front-end-sites/tools/gsc-client/history/changes.json`
- Content gap analysis reads from: `/Users/john/Projects-code/Front-end-sites/SEO_AUDIT_REPORT.md`
- verify-seo.js lives in each site's `scripts/` folder — NOT the root repo level
- Structural checks run against the local build, not the live site (except sitemap curl checks)
- Trends show week-over-week: 📈 (up), 📉 (down), ➡️ (flat)
- Recommendations priority: CRITICAL > HIGH > MEDIUM > LOW > INFO

---

## Key Structural Rules (from petcare.software audit, March 2026)

These are the failure patterns most likely to explain flat metrics:

1. **Sitemap showing 0 discovered pages in GSC** — child sitemaps not accessible on live server. Diagnose with `curl https://[domain]/sitemap-0.xml`.

2. **No page live with fewer than 2 inbound internal links** — enforced by verify-seo.js. Single most important structural rule.

3. **Hub-and-spoke linking must be bidirectional** — hub links to spokes AND spokes link to hub in first 200 words. Missing either direction breaks topical authority.

4. **Related Articles must use `## heading` format** — informal italic footers are not treated as structured navigation by crawlers.

5. **Off-topic content actively harms cluster rankings** — even 7 grooming posts diluted topical signals across all software clusters. Delete before adding new content.

6. **Broken image references on pillar pages** — 404 images suggest a non-functional product to both users and crawlers.

7. **Homepage must link to all pillar pages above the fold** — missing pillar links on homepage = reduced crawl priority for those pages.

8. **About page is an E-E-A-T asset** — founder credentials, previous companies, registration number directly support Google quality assessment.

---

## Domain → Folder Mapping

| Domain | Local folder |
|--------|-------------|
| mydojo.software | mydojo.software/ |
| petcare.software | petcare.software/ |
| driveschoolpro.com | mydriveschool.software/ |
| mytattoo.software | mytattoo.software/ |
| mydriveschool.software | mydriveschool.software/ (legacy — redirect monitoring only) |

When running structural checks for `driveschoolpro.com`, use the `mydriveschool.software/` folder.

---

## Baseline Metrics (Feb 9, 2026)

- mydojo.software: 1 click, 2,079 impressions (0.05% CTR), position 66.1
- petcare.software: 0 clicks, 137 impressions (0.00% CTR), position 85.6 ← rebuilt March 2026
- mydriveschool.software: 10 clicks, 3,068 impressions (0.33% CTR), position 51.2 (best performer)
- mytattoo.software: 1 click, 884 impressions (0.11% CTR), position 75.4

**Domain migration (March 20, 2026):** mydriveschool.software → driveschoolpro.com
- 301 redirects active on server (all paths preserved)
- Full rebrand deployed: all content, meta, schema updated to DriveSchoolPro / driveschoolpro.com
- GSC property added: https://driveschoolpro.com/ (URL prefix, verified March 20 2026)
- Sitemap submitted: https://driveschoolpro.com/sitemap-index.xml
- mydriveschool.software kept in GSC to monitor redirect traffic during ranking transfer
- Ranking transfer expected over 4–12 weeks

petcare.software structural rebuild completed March 4, 2026:
- 53 pages live (4 pillar + 31 cluster posts + supporting pages)
- Hub-and-spoke architecture across 4 clusters
- All verify-seo.js checks passing
- Sitemap submitted to GSC
- First impressions for target keywords expected within 3–4 weeks