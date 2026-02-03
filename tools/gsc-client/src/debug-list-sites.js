#!/usr/bin/env node

import chalk from 'chalk';
import { authenticate } from './auth.js';
import { loadConfig } from './utils/config.js';

async function listSites() {
  try {
    console.log(chalk.bold.cyan('\n🔍 Listing GSC Properties\n'));
    console.log(chalk.gray('━'.repeat(60)) + '\n');

    // Load config and authenticate
    const config = await loadConfig();
    const client = await authenticate(config.serviceAccountPath);

    // List all sites the service account has access to
    console.log(chalk.gray('Fetching accessible properties...\n'));

    const response = await client.sites.list();
    const sites = response.data.siteEntry || [];

    if (sites.length === 0) {
      console.log(chalk.yellow('⚠ No properties found. Service account may not be added to any GSC properties yet.'));
      console.log(chalk.gray('\nPlease add the service account as Owner in Google Search Console.'));
    } else {
      console.log(chalk.green(`✓ Found ${sites.length} accessible properties:\n`));

      sites.forEach((site, index) => {
        console.log(chalk.bold(`${index + 1}. ${chalk.cyan(site.siteUrl)}`));
        console.log(chalk.gray(`   Permission level: ${site.permissionLevel}`));
        console.log();
      });

      console.log(chalk.bold('\n📝 Configuration Update:\n'));
      console.log('Update config.json with the exact property URLs shown above.');
      console.log(chalk.gray('Example: If you see "sc-domain:mydojo.software", use that exact string.\n'));
    }

    console.log(chalk.gray('━'.repeat(60)));

  } catch (error) {
    console.error(chalk.red('\n✗ Error:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

listSites();
