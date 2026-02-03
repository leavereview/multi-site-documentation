# GSC Client - Google Search Console API Tool

MVP version for fetching SEO performance data from Google Search Console.

## Features

- ✅ Authenticate with GSC API using service account
- ✅ Fetch performance data (clicks, impressions, CTR, position)
- ✅ Get top queries and pages
- ✅ Generate comprehensive Excel reports across all domains
- ✅ Identify "striking distance" keywords (positions 4-20)
- ✅ Find optimization opportunities (high impressions, low CTR)
- ✅ Generate content manifest from existing audit data
- ✅ Save JSON snapshots for historical tracking
- ✅ Colored terminal output

## Prerequisites

1. **Google Service Account**: You need a service account with GSC API access
   - Service account file: `petcare-481007-9f7c4f20cf39.json` (in parent directory)
   - Service account email must be added as Owner in GSC for each domain

2. **GSC Property Access**: Ensure the service account email is added to each domain:
   - Go to Google Search Console
   - Select property (e.g., mydojo.software)
   - Settings → Users and permissions
   - Add: `front-end-site-gsc-connection@petcare-481007.iam.gserviceaccount.com` as Owner

3. **Node.js 20+**: Required for ES modules

## Installation

```bash
cd /Users/john/Projects/Front-end-sites/tools/gsc-client
npm install
```

## Usage

### Basic Usage (mydojo.software, last 28 days)

```bash
npm run check
```

### Specific Domain

```bash
npm run check:mydojo
node src/index.js --domain=mydojo.software
```

### Custom Date Range

```bash
node src/index.js --domain=petcare.software --days=7
node src/index.js --domain=mydojo.software --days=90
```

### Custom Output Path

```bash
node src/index.js --output=~/custom-reports
```

### Generate Excel Report (All Domains)

```bash
npm run report                    # Last 28 days
npm run report:weekly            # Last 7 days
node src/report-all.js --days=90 # Last 90 days
```

**Output**: `~/seo-reports/seo-report-{date}.xlsx`

The Excel file includes:
- Executive Summary
- Domain Performance
- Top Queries (top 200)
- Top Pages (top 100)
- Striking Distance keywords (positions 4-20)
- Optimization Opportunities (high impressions, low CTR)

### Help

```bash
node src/index.js --help
```

## Configuration

### Tool Config (`config.json`)

```json
{
  "serviceAccountPath": "../petcare-481007-9f7c4f20cf39.json",
  "domains": [
    {
      "name": "mydojo.software",
      "gscProperty": "sc-domain:mydojo.software",
      "enabled": true
    }
  ],
  "defaults": {
    "dateRangeDays": 28,
    "outputPath": "~/seo-reports"
  }
}
```

### User Config (`~/.config/gsc/config.json`)

```json
{
  "outputPath": "~/seo-reports",
  "retentionDays": 90
}
```

## Output

### Console Output

The tool displays:
- Authentication status
- Content manifest summary (number of pages)
- Performance metrics (clicks, impressions, CTR, position)
- Top 5 queries with metrics
- Top 5 pages with metrics

### Saved Files

1. **Content Manifest**: `~/seo-reports/manifests/content-manifest-{date}.json`
   - All pages for the domain with GSC tracking structure

2. **Snapshot**: `~/seo-reports/data/{YYYY-MM}/{domain}/snapshot-{date}.json`
   - Raw data including top queries, top pages, aggregate metrics

## File Structure

```
/tools/gsc-client/
├── src/
│   ├── index.js                 # Main CLI
│   ├── auth.js                  # GSC authentication
│   ├── api/
│   │   └── search-analytics.js  # GSC API calls
│   ├── storage/
│   │   └── manifest.js          # Content manifest generation
│   └── utils/
│       └── config.js            # Config loading
├── config.json                  # Tool configuration
├── package.json
└── README.md
```

## Troubleshooting

### Authentication Errors (403)

**Problem**: Permission denied when accessing GSC API

**Solution**:
1. Verify service account email is added to GSC property as Owner
2. Check that the correct service account file is being used
3. Ensure GSC API is enabled in Google Cloud Console

### Property Not Found (404)

**Problem**: GSC property not found

**Solution**:
1. Verify property URL format in config.json: `sc-domain:mydojo.software`
2. Check that the domain is verified in GSC
3. Ensure service account has access to the property

### No Data Returned

**Problem**: API returns 0 rows

**Solution**:
1. Check date range - domain may not have data for the specified period
2. Verify property is receiving traffic in GSC
3. Try a longer date range (--days=90)

## Future Enhancements (Phase 2+)

- [ ] Excel report generation
- [ ] All 4 domains support
- [ ] Index coverage (URL Inspection API)
- [ ] Striking distance keywords
- [ ] Declining pages detection
- [ ] Content tracking with alerts
- [ ] Claude Code `/seo-check` command

## Support

For issues or questions, refer to the main project documentation or check Google Search Console API docs:
https://developers.google.com/webmaster-tools/search-console-api-original

## License

Internal tool for Front-end-sites project
