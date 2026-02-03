#!/usr/bin/env node

import { format, subDays } from 'date-fns';
import chalk from 'chalk';
import { resolve } from 'path';
import { authenticate } from './auth.js';
import { loadConfig, expandPath } from './utils/config.js';
import { getTopQueries, getTopPages, calculateAggregateMetrics } from './api/search-analytics.js';
import { generateExcelReport } from './reporting/excel.js';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    days: 28,
    output: null
  };

  args.forEach(arg => {
    if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  });

  return options;
}

function showHelp() {
  console.log(chalk.bold('\n📊 GSC Client - Generate Excel Report for All Domains\n'));
  console.log('Usage: node src/report-all.js [options]\n');
  console.log('Options:');
  console.log('  --days=<number>    Date range in days (default: 28)');
  console.log('  --output=<path>    Output directory (default: ~/seo-reports)');
  console.log('  --help, -h         Show this help message\n');
  console.log('Examples:');
  console.log('  npm run report');
  console.log('  node src/report-all.js --days=7\n');
}

async function fetchDomainData(client, domainConfig, startDate, endDate) {
  try {
    console.log(chalk.bold(`\n📊 Fetching: ${chalk.cyan(domainConfig.name)}`));
    console.log(chalk.gray('  Getting top queries...'));

    const topQueries = await getTopQueries(client, domainConfig.gscProperty, startDate, endDate, 100);
    console.log(chalk.green(`  ✓ Retrieved ${topQueries.length} queries`));

    console.log(chalk.gray('  Getting top pages...'));
    const topPages = await getTopPages(client, domainConfig.gscProperty, startDate, endDate, 100);
    console.log(chalk.green(`  ✓ Retrieved ${topPages.length} pages`));

    const aggregateMetrics = calculateAggregateMetrics([...topQueries, ...topPages]);

    return {
      domain: domainConfig.name,
      dateRange: { start: startDate, end: endDate },
      metrics: aggregateMetrics,
      topQueries,
      topPages
    };
  } catch (error) {
    console.error(chalk.red(`  ✗ Failed to fetch data for ${domainConfig.name}:`), error.message);
    return {
      domain: domainConfig.name,
      dateRange: { start: startDate, end: endDate },
      metrics: {
        totalClicks: 0,
        totalImpressions: 0,
        avgCtr: 0,
        avgPosition: 0
      },
      topQueries: [],
      topPages: [],
      error: error.message
    };
  }
}

async function main() {
  try {
    // Parse command line arguments
    const options = parseArgs();

    // Display header
    console.log(chalk.bold.cyan('\n📊 Google Search Console - Full SEO Report\n'));
    console.log(chalk.gray('━'.repeat(60)));

    // Load configuration
    const config = await loadConfig();
    const outputPath = expandPath(options.output || config.defaults.outputPath);

    // Calculate date range
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), options.days), 'yyyy-MM-dd');

    console.log(chalk.gray(`\nDate range: ${startDate} to ${endDate}`));
    console.log(chalk.gray('━'.repeat(60)));

    // Authenticate with GSC
    const client = await authenticate(config.serviceAccountPath);

    // Get all enabled domains
    const enabledDomains = config.domains.filter(d => d.enabled);
    console.log(chalk.bold(`\n✓ Found ${enabledDomains.length} enabled domains`));

    // Fetch data from all domains
    const allDomainsData = [];
    for (const domainConfig of enabledDomains) {
      const domainData = await fetchDomainData(client, domainConfig, startDate, endDate);
      allDomainsData.push(domainData);
    }

    // Display summary
    console.log(chalk.bold.cyan('\n\n📊 SUMMARY\n'));
    console.log(chalk.gray('━'.repeat(60)));

    let totalClicks = 0;
    let totalImpressions = 0;

    allDomainsData.forEach(data => {
      totalClicks += data.metrics.totalClicks;
      totalImpressions += data.metrics.totalImpressions;

      console.log(chalk.bold(`\n${data.domain}:`));
      console.log(`  Clicks:       ${chalk.green(data.metrics.totalClicks.toLocaleString())}`);
      console.log(`  Impressions:  ${chalk.blue(data.metrics.totalImpressions.toLocaleString())}`);
      console.log(`  CTR:          ${chalk.yellow((data.metrics.avgCtr * 100).toFixed(2) + '%')}`);
      console.log(`  Avg Position: ${chalk.magenta(data.metrics.avgPosition.toFixed(1))}`);
    });

    console.log(chalk.bold.cyan('\n\nAGGREGATE TOTALS:'));
    console.log(`  Total Clicks:       ${chalk.green(totalClicks.toLocaleString())}`);
    console.log(`  Total Impressions:  ${chalk.blue(totalImpressions.toLocaleString())}`);
    console.log(`  Overall CTR:        ${chalk.yellow(totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.0%')}`);

    // Generate Excel report
    console.log(chalk.bold.cyan('\n\n📑 GENERATING EXCEL REPORT\n'));
    console.log(chalk.gray('━'.repeat(60)));

    const reportFilename = `seo-report-${endDate}.xlsx`;
    const reportPath = resolve(outputPath, reportFilename);

    await generateExcelReport(allDomainsData, reportPath);

    // Footer
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.green.bold('\n✅ COMPLETE!\n'));
    console.log(chalk.bold('📊 Excel report: ') + chalk.cyan(reportPath));
    console.log(chalk.gray('\nOpen the Excel file to see:'));
    console.log(chalk.gray('  • Executive Summary'));
    console.log(chalk.gray('  • Domain Performance'));
    console.log(chalk.gray('  • Top Queries'));
    console.log(chalk.gray('  • Top Pages'));
    console.log(chalk.gray('  • Striking Distance (positions 4-20)'));
    console.log(chalk.gray('  • Optimization Opportunities\n'));

  } catch (error) {
    console.error(chalk.red('\n\n✗ Error:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Run the main function
main();
