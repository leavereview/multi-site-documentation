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

Note: sitemap health + URL indexing + **rich result errors** + **mobile usability** (`--with-coverage`)
are included in the default command. Only omit `--with-coverage` if the user asks for a fast run.

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

**`--with-coverage` (included in the default command above, ~30s extra) checks:**
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

#### 3A — Build health (per domain, bash)

```bash
cd /Users/john/Projects-code/Front-end-sites/[folder]   # see Domain → Folder Mapping below
npm run build 2>&1 | tail -20
```

Report:
- Total pages checked by verify-seo.js
- Error count (must be 0)
- Noindexed pages skipped (expected: tag pages only)
- Any new errors vs last check

#### 3B — Local vs live sitemap count (per domain, bash)

Run **after** the fresh build from 3A (never against a stale `dist/` — that's the
zombie-deploy bug `deploy.sh` exists to prevent):

```bash
echo "local: $(grep -c '<loc>' dist/sitemap-0.xml)"
echo "live:  $(curl -s https://[domain]/sitemap-0.xml | grep -c '<loc>')"
```

Flag as CRITICAL if the counts differ or the live sitemap is 404/empty.
If they differ, the fix is `./deploy.sh [folder]` from the repo root (atomic rebuild + verify).

#### 3C — Scripted structural checks (all remaining checks)

The 3C–3J checks (hub links in first 200 words, Related Articles sections, short posts,
broken images, prohibited pages, homepage pillar links, About E-E-A-T) are implemented
in `tools/gsc-client/src/structural-health.js` with per-site pillar/hub configuration
for all four sites. Run it instead of ad-hoc bash:

```bash
cd /Users/john/Projects-code/Front-end-sites/tools/gsc-client
node src/structural-health.js                          # all domains
node src/structural-health.js --domain=[domain]        # single domain
```

It prints a scorecard per domain (X/8 checks passing) with severities and the failing
files listed, and exits non-zero if any check fails. This is the same module the Slack
report uses, so results stay consistent.

To add or change a site's pillar pages, E-E-A-T signals, or prohibited patterns, edit
`SITE_CONFIG` at the top of `structural-health.js`.

> Fallback only (if the script is broken): the checks can be done with bash loops over
> `src/content/blog/*.md` and `src/pages/*.astro`. Note macOS grep is BSD grep — it has
> no `-P` flag; use `grep -oE` / `awk` instead of PCRE lookbehinds.

---

### Step 4: Structural Health Score

The script in 3C prints the scorecard. Combine it with 3A/3B into the summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️  STRUCTURAL HEALTH — [DOMAIN]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Build health:           ✅/❌  (0 errors / X errors)
  Sitemap local==live:    ✅/❌  (X URLs / Y URLs)
  + the 8 scripted checks from structural-health.js

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

### Step 7: After Deploying Fixes — Indexing (REQUIRED)

If any structural or content fixes were deployed during this session, submitting them
to Google is **not optional**:

```bash
# 1. Deploy with the guarded script (atomic rebuild + live==local verify)
cd /Users/john/Projects-code/Front-end-sites && ./deploy.sh [folder]

# 2. Resubmit sitemap(s) to GSC
cd tools/gsc-client && node src/enhanced-report.js --submit-sitemaps --domain=[domain]

# 3. Request indexing for new/changed URLs via the Indexing API
node src/request-indexing.js --site=[domain] --urls=url1,url2,...
```

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
  — **this file currently does not exist**, so gap analysis is silently disabled and the
  per-site gap counts in `enhanced-report.js` are hardcoded fallbacks from Feb 2026.
  Recreate the report (or remove the feature) before trusting gap numbers.
- verify-seo.js lives in each site's `scripts/` folder — NOT the root repo level
- Structural checks run against the local build, not the live site (except sitemap curl checks)
- Trends show week-over-week: 📈 (up), 📉 (down), ➡️ (flat)
- Recommendations priority: CRITICAL > HIGH > MEDIUM > LOW > INFO

---

## Key Structural Rules (from petcare.software audit, March 2026)

These are the failure patterns most likely to explain flat metrics:

1. **Sitemap showing 0 discovered pages in GSC** — child sitemaps not accessible on live server, or a stale `dist/` was rsynced (zombie-deploy bug). Diagnose with `curl https://[domain]/sitemap-0.xml`; prevent with `./deploy.sh [folder]`, which rebuilds from clean and fails unless live sitemap == fresh build.

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

## Baseline Metrics (Feb 9, 2026 — historical reference only)

These are the pre-rebuild baselines; compare current numbers against
`history/<domain>.json` for real trends, not against this list.

- mydojo.software: 1 click, 2,079 impressions (0.05% CTR), position 66.1
- petcare.software: 0 clicks, 137 impressions (0.00% CTR), position 85.6 ← rebuilt March 2026
- mydriveschool.software: 10 clicks, 3,068 impressions (0.33% CTR), position 51.2 (best performer)
- mytattoo.software: 1 click, 884 impressions (0.11% CTR), position 75.4

**Domain migration (March 20, 2026):** mydriveschool.software → driveschoolpro.com
- 301 redirects active on server (all paths preserved); GSC property + sitemap submitted March 20, 2026
- mydriveschool.software kept in GSC only to monitor redirect traffic during ranking transfer
- Ranking transfer window was 4–12 weeks → **ends ~mid-June 2026**. When running this command,
  compare driveschoolpro.com vs the legacy property: once legacy impressions have flatlined near
  zero, recommend disabling `mydriveschool.software` in `tools/gsc-client/config.json` and
  dropping it from default reports.

petcare.software structural rebuild completed March 4, 2026: 53 pages live,
hub-and-spoke across 4 clusters, all verify-seo.js checks passing, sitemap submitted.