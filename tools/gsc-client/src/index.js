#!/usr/bin/env node

import { format, subDays } from 'date-fns';
import chalk from 'chalk';
import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { authenticate, validateCredentials } from './auth.js';
import { loadConfig, expandPath, getDomainConfig } from './utils/config.js';
import { getTopQueries, getTopPages, calculateAggregateMetrics } from './api/search-analytics.js';
import { generateManifest, saveManifest } from './storage/manifest.js';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    domain: 'mydojo.software', // Default to mydojo for MVP
    days: 28,
    output: null
  };

  args.forEach(arg => {
    if (arg.startsWith('--domain=')) {
      options.domain = arg.split('=')[1];
    } else if (arg.startsWith('--days=')) {
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
  console.log(chalk.bold('\n🔍 Google Search Console Client - MVP\n'));
  console.log('Usage: node src/index.js [options]\n');
  console.log('Options:');
  console.log('  --domain=<name>    Domain to check (default: mydojo.software)');
  console.log('  --days=<number>    Date range in days (default: 28)');
  console.log('  --output=<path>    Output directory (default: ~/seo-reports)');
  console.log('  --help, -h         Show this help message\n');
  console.log('Examples:');
  console.log('  npm run check');
  console.log('  npm run check:mydojo');
  console.log('  node src/index.js --domain=petcare.software --days=7\n');
}

function formatNumber(num) {
  return num.toLocaleString('en-US');
}

function formatPercent(num) {
  return (num * 100).toFixed(1) + '%';
}

function formatPosition(num) {
  return num.toFixed(1);
}

async function saveSnapshot(data, outputPath, domain, date) {
  try {
    const [year, month] = date.split('-');
    const snapshotDir = resolve(outputPath, 'data', `${year}-${month}`, domain);

    await mkdir(snapshotDir, { recursive: true });

    const filepath = resolve(snapshotDir, `snapshot-${date}.json`);
    await writeFile(filepath, JSON.stringify(data, null, 2));

    console.log(chalk.green(`✓ Saved snapshot: ${filepath}`));
    return filepath;
  } catch (error) {
    console.error(chalk.red('✗ Failed to save snapshot:'), error.message);
    throw error;
  }
}

async function main() {
  try {
    // Parse command line arguments
    const options = parseArgs();

    // Display header
    console.log(chalk.bold.cyan('\n🔍 Google Search Console SEO Check\n'));
    console.log(chalk.gray('━'.repeat(60)));

    // Load configuration
    const config = await loadConfig();
    const outputPath = expandPath(options.output || config.defaults.outputPath);
    const domainConfig = getDomainConfig(config, options.domain);

    console.log(chalk.bold(`\n📊 Checking: ${chalk.cyan(domainConfig.name)}`));
    console.log(chalk.gray('━'.repeat(60)) + '\n');

    // Validate credentials
    const isValid = await validateCredentials(config.serviceAccountPath);
    if (!isValid) {
      throw new Error('Invalid service account credentials');
    }

    // Authenticate with GSC
    const client = await authenticate(config.serviceAccountPath);

    // Calculate date range
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), options.days), 'yyyy-MM-dd');

    console.log(chalk.gray(`  Date range: ${startDate} to ${endDate}\n`));

    // Generate content manifest (optional for MVP)
    let manifest = null;
    try {
      manifest = await generateManifest('../../cross-link-audit-data.json', domainConfig.name);
      await saveManifest(manifest, outputPath);
    } catch (error) {
      console.log(chalk.yellow('⚠ Content inventory not found, skipping manifest generation'));
      console.log(chalk.gray('  (This is optional for MVP - GSC data will still be fetched)'));
    }

    // Fetch top queries
    console.log(chalk.gray('\n  Fetching top queries...'));
    const topQueries = await getTopQueries(client, domainConfig.gscProperty, startDate, endDate, 100);
    console.log(chalk.green(`✓ Retrieved ${topQueries.length} queries`));

    // Fetch top pages
    console.log(chalk.gray('  Fetching top pages...'));
    const topPages = await getTopPages(client, domainConfig.gscProperty, startDate, endDate, 100);
    console.log(chalk.green(`✓ Retrieved ${topPages.length} pages`));

    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateMetrics([...topQueries, ...topPages]);

    // Display summary
    console.log(chalk.bold.cyan('\n\n📊 SUMMARY'));
    console.log(chalk.gray('━'.repeat(60)) + '\n');

    console.log(chalk.bold('Performance:'));
    console.log(`  Clicks:          ${chalk.green(formatNumber(aggregateMetrics.totalClicks))}`);
    console.log(`  Impressions:     ${chalk.blue(formatNumber(aggregateMetrics.totalImpressions))}`);
    console.log(`  Avg CTR:         ${chalk.yellow(formatPercent(aggregateMetrics.avgCtr))}`);
    console.log(`  Avg Position:    ${chalk.magenta(formatPosition(aggregateMetrics.avgPosition))}`);

    // Top 5 queries
    console.log(chalk.bold('\n\nTop 5 Queries:'));
    topQueries.slice(0, 5).forEach((query, index) => {
      console.log(`  ${index + 1}. ${chalk.cyan(query.query)} (${formatNumber(query.clicks)} clicks, pos ${formatPosition(query.position)})`);
    });

    // Top 5 pages
    console.log(chalk.bold('\n\nTop 5 Pages:'));
    topPages.slice(0, 5).forEach((page, index) => {
      const url = new URL(page.page);
      console.log(`  ${index + 1}. ${chalk.cyan(url.pathname)} (${formatNumber(page.clicks)} clicks)`);
    });

    // Save snapshot
    const snapshotData = {
      domain: domainConfig.name,
      snapshotDate: endDate,
      dateRange: { start: startDate, end: endDate },
      metrics: aggregateMetrics,
      topQueries: topQueries.slice(0, 50),
      topPages: topPages.slice(0, 50),
      manifest: manifest ? {
        totalPages: manifest.totalPages,
        pillars: manifest.pages.filter(p => p.type === 'pillar').length,
        blogs: manifest.pages.filter(p => p.type === 'blog').length
      } : null
    };

    const snapshotPath = await saveSnapshot(snapshotData, outputPath, domainConfig.name, endDate);

    // Footer
    console.log(chalk.gray('\n\n' + '━'.repeat(60)));
    console.log(chalk.green('\n✅ Check complete!\n'));
    console.log(chalk.gray(`💾 Snapshot saved to: ${snapshotPath}\n`));

  } catch (error) {
    console.error(chalk.red('\n\n✗ Error:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Run the main function
main();
