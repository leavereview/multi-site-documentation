---
description: Run comprehensive SEO check using Google Search Console data
---

# SEO Check Command

Run Google Search Console API checks and generate SEO performance reports.

## Usage

The user can run this command with optional arguments:
- `/seo-check` - Generate full Excel report for all 4 domains (last 28 days)
- `/seo-check --domain=mydojo.software` - Check single domain only
- `/seo-check --days=7` - Weekly report (last 7 days)
- `/seo-check --days=90` - Quarterly report (last 90 days)

## Your Task

Parse the user's arguments and execute the appropriate GSC client command.

### Step 1: Determine Command Type

If the user specified `--domain=<name>`:
- Run single domain check: `cd /Users/john/Projects/Front-end-sites/tools/gsc-client && node src/index.js [args]`

If no domain specified (or they want "all"):
- Run full report: `cd /Users/john/Projects/Front-end-sites/tools/gsc-client && npm run report [args]`

### Step 2: Execute Command

Run the appropriate command using the Bash tool and display the output to the user.

### Step 3: Analyze Results

After the command completes:

1. **Read the output** and summarize:
   - Total clicks, impressions, CTR, average position
   - Which domain is performing best/worst
   - Any critical issues (very low clicks/impressions)

2. **If Excel report was generated**, read the file path from the output and:
   - Confirm the report location
   - Highlight the most important worksheets:
     - "Striking Distance" for quick win opportunities
     - "Opportunities" for meta optimization targets
   - Provide 3-5 actionable recommendations based on the data

3. **Provide Next Steps**:
   - Specific pages or keywords to optimize
   - Priority ranking (HIGH/MEDIUM/LOW)
   - Expected impact

## Example Responses

### For Full Report:
```
✅ SEO Report Complete!

📊 PERFORMANCE SUMMARY (Last 28 Days)

mydriveschool.software: 9 clicks, 3,454 impressions (0.26% CTR)
  🟢 Best performer - brand queries working well

mydojo.software: 1 click, 2,617 impressions (0.04% CTR)
  🟡 Getting visibility but needs CTR optimization

mytattoo.software: 0 clicks, 484 impressions
  🟡 Good brand rankings but no clicks

petcare.software: 0 clicks, 11 impressions
  🔴 Critical - very low visibility

📊 Excel Report: ~/seo-reports/seo-report-2026-02-03.xlsx

🎯 TOP 3 ACTIONS:

1. HIGH PRIORITY: Optimize "aikido dojo software" (pos 37.5)
   - Currently in striking distance
   - Add more content depth to related pages
   - Improve internal linking

2. MEDIUM PRIORITY: Fix petcare.software visibility
   - Very low impressions (only 11)
   - Check indexing status
   - Review content quality

3. QUICK WIN: Improve meta descriptions for mydojo.software
   - 2,617 impressions but only 1 click
   - CTR is 0.04% (should be 2-3%)
   - Rewrite metas to be more compelling
```

### For Single Domain:
```
✅ mydojo.software Check Complete!

📊 PERFORMANCE (Last 28 Days)
- Clicks: 1
- Impressions: 2,617
- CTR: 0.04%
- Avg Position: 68.6

🔍 TOP 5 QUERIES:
1. karate belt order (pos 4.8) 🎯
2. martial arts software (pos 8.2)
3. bjj belt system (pos 11.5)
4. aikido dojo software (pos 37.5)
5. all bjj belts (pos 66.7)

💾 Snapshot: ~/seo-reports/data/2026-02/mydojo.software/snapshot-2026-02-03.json

🎯 KEY OPPORTUNITY:
"karate belt order" is in striking distance at position 4.8!
- This could easily rank top 3 with optimization
- Add more internal links to that page
- Improve content depth on belt ranking topics
```

## Important Notes

- Always show the full file paths for reports/snapshots
- Provide specific, actionable recommendations (not generic advice)
- Use emojis for visual clarity (🟢🟡🔴🎯📊💾)
- Format numbers with commas (1,234 not 1234)
- Percentages to 2 decimal places (0.04% not 0.0382%)
- If the command fails, help debug (check permissions, API access, etc.)
