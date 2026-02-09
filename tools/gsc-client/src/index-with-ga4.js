#!/usr/bin/env node

/**
 * GSC + GA4 Combined CLI
 *
 * Usage:
 *   node src/index-with-ga4.js --domain=mydojo.software
 *   node src/index-with-ga4.js --domain=mydojo.software --with-analytics
 *   node src/index-with-ga4.js --domain=mydojo.software --days=7
 */

import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { format, subDays } from 'date-fns';
import { loadConfig } from './utils/config.js';
import { authenticate } from './auth.js';
import { getTopQueries, getTopPages, calculateAggregateMetrics } from './api/search-analytics.js';
import GA4Client from './analytics/ga4-client.js';
import CombinedReportGenerator from './reports/combined-report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {};
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    flags[key] = value || true;
  }
});

if (flags.help) {
  console.log(`
${chalk.cyan.bold('GSC + GA4 Combined SEO Check')}

Usage:
  node src/index-with-ga4.js [options]

Options:
  --domain=<domain>       Domain to check (required)
  --with-analytics        Include GA4 engagement metrics
  --days=<number>         Date range in days (default: 28)
  --help                  Show this help message

Examples:
  node src/index-with-ga4.js --domain=mydojo.software
  node src/index-with-ga4.js --domain=mydojo.software --with-analytics
  node src/index-with-ga4.js --domain=petcare.software --days=7 --with-analytics

Note: GA4 integration requires:
  1. GA4 property IDs configured in config.json
  2. Service account granted access to GA4 properties
  3. features.ga4Enabled set to true in config.json
  `);
  process.exit(0);
}

async function main() {
  try {
    // Load configuration
    const config = await loadConfig();
    const domainName = flags.domain || config.domains[0].name;
    const dateRangeDays = parseInt(flags.days || config.defaults.dateRangeDays);
    const includeGA4 = flags['with-analytics'] && config.features?.ga4Enabled;

    // Find domain config
    const domainConfig = config.domains.find(d => d.name === domainName);
    if (!domainConfig) {
      console.error(chalk.red(`❌ Domain not found: ${domainName}`));
      process.exit(1);
    }

    if (!domainConfig.enabled) {
      console.error(chalk.yellow(`⚠️  Domain is disabled: ${domainName}`));
      process.exit(0);
    }

    console.log(chalk.cyan.bold('\n📊 Google Search Console + GA4 Check\n'));
    console.log(chalk.gray('━'.repeat(60)));

    // Calculate date range
    const endDate = new Date();
    const startDate = subDays(endDate, dateRangeDays);
    console.log(chalk.gray(`Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`));
    console.log(chalk.gray('━'.repeat(60)) + '\n');

    // Authenticate with GSC
    console.log(chalk.blue('🔐 Authenticating with Google Search Console...'));
    const gscClient = await authenticate(
      resolve(__dirname, '..', config.serviceAccountPath)
    );
    console.log(chalk.green('✓ GSC Authentication successful\n'));

    // Fetch GSC data
    console.log(chalk.blue(`📊 Fetching GSC data for ${domainName}...`));
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    const topQueries = await getTopQueries(gscClient, domainConfig.gscProperty, startDateStr, endDateStr);
    const topPages = await getTopPages(gscClient, domainConfig.gscProperty, startDateStr, endDateStr);
    const summary = calculateAggregateMetrics(topQueries);

    const gscData = { topQueries, topPages, summary };
    console.log(chalk.green(`✓ Retrieved ${topQueries.length} queries, ${topPages.length} pages\n`));

    // Print GSC summary
    console.log(chalk.cyan.bold('📈 GSC PERFORMANCE SUMMARY\n'));
    console.log(chalk.white(`  Clicks:       ${gscData.summary.totalClicks.toLocaleString()}`));
    console.log(chalk.white(`  Impressions:  ${gscData.summary.totalImpressions.toLocaleString()}`));
    console.log(chalk.white(`  CTR:          ${(gscData.summary.avgCtr * 100).toFixed(2)}%`));
    console.log(chalk.white(`  Avg Position: ${gscData.summary.avgPosition.toFixed(1)}\n`));

    let ga4Data = null;

    // Fetch GA4 data if enabled
    if (includeGA4) {
      if (!domainConfig.ga4PropertyId || domainConfig.ga4PropertyId === 'YOUR_GA4_PROPERTY_ID') {
        console.log(chalk.yellow('⚠️  GA4 property ID not configured. Skipping GA4 data.\n'));
        console.log(chalk.gray('   To enable GA4: Update config.json with your GA4 property ID\n'));
      } else {
        try {
          console.log(chalk.blue('🔐 Authenticating with Google Analytics 4...'));
          const ga4Client = new GA4Client(
            resolve(__dirname, '..', config.serviceAccountPath)
          );
          console.log(chalk.green('✓ GA4 Authentication successful\n'));

          console.log(chalk.blue('📊 Fetching GA4 engagement metrics...'));
          const engagement = await ga4Client.getPageEngagement(
            domainConfig.ga4PropertyId,
            format(startDate, 'yyyy-MM-dd'),
            format(endDate, 'yyyy-MM-dd')
          );
          console.log(chalk.green(`✓ Retrieved engagement data for ${engagement.length} pages\n`));

          console.log(chalk.blue('📊 Fetching GA4 conversion data...'));
          const conversions = await ga4Client.getConversionsByPage(
            domainConfig.ga4PropertyId,
            format(startDate, 'yyyy-MM-dd'),
            format(endDate, 'yyyy-MM-dd')
          );
          console.log(chalk.green(`✓ Retrieved conversion data\n`));

          ga4Data = {
            engagement,
            conversions,
            topConverters: ga4Client.identifyTopConverters(conversions),
            problematicPages: ga4Client.identifyProblematicPages(engagement)
          };

          // Print GA4 summary
          console.log(chalk.cyan.bold('📊 GA4 ENGAGEMENT SUMMARY\n'));
          if (engagement.length > 0) {
            const avgBounce = engagement.reduce((sum, p) => sum + p.bounceRate, 0) / engagement.length;
            const avgEngagement = engagement.reduce((sum, p) => sum + p.engagementRate, 0) / engagement.length;
            console.log(chalk.white(`  Avg Bounce Rate:     ${avgBounce.toFixed(1)}%`));
            console.log(chalk.white(`  Avg Engagement Rate: ${avgEngagement.toFixed(1)}%`));
            console.log(chalk.white(`  Problematic Pages:   ${ga4Data.problematicPages.length}`));
            console.log(chalk.white(`  Top Converters:      ${ga4Data.topConverters.length}\n`));
          } else {
            console.log(chalk.yellow(`  No engagement data available for this period`));
            console.log(chalk.gray(`  This may indicate low traffic or GA4 tracking not properly configured\n`));
          }

        } catch (error) {
          console.log(chalk.red(`❌ GA4 Error: ${error.message}\n`));
          console.log(chalk.yellow('Continuing with GSC data only...\n'));
        }
      }
    }

    // Generate combined report
    if (ga4Data) {
      const combinedReport = new CombinedReportGenerator(gscData, ga4Data);
      combinedReport.printReport(domainName);
    } else {
      // Print GSC-only top queries
      console.log(chalk.cyan.bold('🔍 TOP QUERIES\n'));
      gscData.topQueries.slice(0, 5).forEach((q, i) => {
        console.log(chalk.blue(`${i + 1}. ${q.query}`));
        console.log(chalk.gray(`   Position: ${q.position.toFixed(1)} | Impressions: ${q.impressions} | Clicks: ${q.clicks}\n`));
      });
    }

    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.green.bold('\n✅ Check complete!\n'));

    if (!includeGA4 && config.features?.ga4Enabled) {
      console.log(chalk.yellow('💡 Tip: Add --with-analytics to include GA4 engagement metrics\n'));
    }

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

main();
