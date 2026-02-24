---
description: Run comprehensive SEO check using Google Search Console data
---

# SEO Check Command

Run enhanced SEO performance reports integrating GSC + GA4 + Content Gaps + Historical Tracking.

## Usage

The user can run this command with optional arguments:
- `/seo-check` - Enhanced report for all 4 domains with GA4 + trends (last 28 days)
- `/seo-check --domain=mydojo.software` - Check single domain with full analysis
- `/seo-check --days=7` - Weekly report (last 7 days)
- `/seo-check --days=90` - Quarterly report (last 90 days)
- `/seo-check --excel` - Generate Excel report instead of enhanced report

## Your Task

Parse the user's arguments and execute the appropriate GSC client command.

### Step 1: Determine Command Type

**DEFAULT (Recommended):** Use the enhanced report with GA4 + historical tracking + content gaps
- Command: `cd /Users/john/Projects/Front-end-sites/tools/gsc-client && node src/enhanced-report.js --with-analytics [args]`
- This integrates:
  - Google Search Console data
  - Google Analytics 4 engagement metrics
  - SEO_AUDIT_REPORT.md content gap analysis
  - Historical metrics tracking and trends
  - Smart recommendations based on progress

**If user specifies `--excel`:** Generate Excel-only report
- Command: `cd /Users/john/Projects/Front-end-sites/tools/gsc-client && npm run report [args]`
- Use this for spreadsheet-based analysis

### Step 2: Execute Command

Run the appropriate command using the Bash tool and display the output to the user.

### Step 3: Analyze Results

The enhanced report automatically provides:

1. **Performance Metrics** - Current GSC data
2. **Historical Trends** - Week-over-week changes (📈/📉/➡️)
3. **Content Gap Analysis** - Shows % of planned content created
4. **SEO Health Score** - 0-100 rating based on GSC + GA4 data
5. **Content Calendar** - Upcoming scheduled posts + recently published (last 30 days)
6. **Recent Changes** - SEO actions taken in the last 60 days with expected impact (from changes.json)
7. **Top Recommendations** - Prioritized actions (CRITICAL/HIGH/MEDIUM/LOW)
8. **Top Queries** - Best performing search terms

After the command completes, summarize:
- Key trends (improving/declining)
- Most critical recommendations
- Content gap priorities
- Quick wins from the report

## Example Enhanced Report Output

The enhanced report provides comprehensive analysis:

```
✅ Enhanced SEO Report Complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 MYDOJO.SOFTWARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 PERFORMANCE METRICS
  Clicks:       12
  Impressions:  2,150
  CTR:          0.56%
  Avg Position: 62.3

📊 TRENDS (vs Previous Check)
  Clicks:       📈 +11 (1100.0%)
  Impressions:  📈 +71 (3.4%)
  CTR:          📈 +0.51%

📝 CONTENT GAP ANALYSIS
  Existing Content: 16 items
  Planned Content:  40 items
  Content Gap:      65% (24 missing)

  Top Missing Content (High Volume):
    1. "Class Scheduling Software Guide" (1,300 monthly searches)
    2. "BJJ Blue Belt: What It Takes" (1,600 monthly searches)
    3. "Different Types of Martial Arts" (1,600 monthly searches)

🎯 SEO HEALTH SCORE
  Score: 58/100

🎯 TOP RECOMMENDATIONS

  1. [HIGH] Content Creation
     Issue: 65% content gap - missing 24 planned items
     Action: Create high-volume posts: "Class Scheduling Software Guide" (1,300 vol), "BJJ Blue Belt: What It Takes" (1,600 vol), "Different Types of Martial Arts" (1,600 vol)
     Impact: These posts target 3,000+ monthly searches

  2. [HIGH] CTR Optimization
     Issue: CTR is 0.56% (should be 2-3%)
     Action: Rewrite meta descriptions using [Benefit] + [Data] + [CTA] formula
     Impact: Could gain 32 additional clicks/month from existing impressions

  3. [MEDIUM] Quick Win
     Issue: 8 queries in striking distance (positions 4-20)
     Action: Optimize "karate belt order" (pos 4.8, 1,234 impr)
     Impact: Could move to page 1 with internal linking + content optimization

  4. [INFO] Progress
     Issue: Clicks increased 11 (1100.0%) - improvements working!
     Action: Continue current optimization strategy
     Impact: On track to hit traffic goals

🔍 TOP QUERIES
  1. karate belt order
     Position: 4.8 | Impressions: 1,234 | Clicks: 56

  2. martial arts software
     Position: 8.2 | Impressions: 890 | Clicks: 23
```

### For Excel Report (--excel flag):
```
✅ Excel Report Generated!

📊 Report: ~/seo-reports/seo-report-2026-02-09.xlsx

Key worksheets:
- Growth Potential Analysis - Which domain to prioritize
- Striking Distance - Quick win opportunities
- Opportunities - Meta optimization targets
```

## Logging SEO Changes

After making any SEO changes (content, meta, technical, links), log them to the changelog so future reports can explain metric movements:

```bash
cd /Users/john/Projects/Front-end-sites/tools/gsc-client && node src/enhanced-report.js \
  --log-change="Description of what you did" \
  --sites=mydojo.software \
  --category=content \
  --reason="Why you made the change" \
  --expected-impact="What metric should improve" \
  --expected-timeline="2-4 weeks"
```

**Categories**: `content` | `technical` | `meta` | `links` | `schema` | `analytics` | `conversion` | `performance`

**Sites**: comma-separated domains, or omit for `all`

Claude should automatically log changes after completing any SEO work in a session. The changelog is stored at:
`/Users/john/Projects/Front-end-sites/tools/gsc-client/history/changes.json`

The report shows recent changes (last 60 days) per domain, positioned after metrics/trends and before recommendations — so you can immediately understand what caused any metric movement.

## Important Notes

- The enhanced report automatically saves historical data for trend tracking
- Historical data is stored in `/Users/john/Projects/Front-end-sites/tools/gsc-client/history/<domain>.json`
- **Changelog** is stored at `/Users/john/Projects/Front-end-sites/tools/gsc-client/history/changes.json`
- Content gap analysis reads from `/Users/john/Projects/Front-end-sites/SEO_AUDIT_REPORT.md`
- GA4 integration is enabled by default (requires GA4 property IDs in config.json)
- Trends show week-over-week changes: 📈 (up), 📉 (down), ➡️ (flat)
- Recommendations are prioritized: CRITICAL > HIGH > MEDIUM > LOW > INFO
- If the command fails, help debug (check permissions, API access, etc.)

## Baseline Metrics (for comparison)

From Feb 9, 2026 (documented in MEMORY.md):
- mydojo.software: 1 click, 2,079 impressions (0.05% CTR), position 66.1
- petcare.software: 0 clicks, 137 impressions (0.00% CTR), position 85.6 (CRITICAL LOW)
- mydriveschool.software: 10 clicks, 3,068 impressions (0.33% CTR), position 51.2 (BEST)
- mytattoo.software: 1 click, 884 impressions (0.11% CTR), position 75.4

Use these baselines to highlight progress or declines in your analysis.
