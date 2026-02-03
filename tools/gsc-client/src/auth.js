import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Authenticate with Google Search Console API using service account
 * @param {string} serviceAccountPath - Path to service account JSON file
 * @returns {Promise<Object>} Authenticated Google Webmasters client
 */
export async function authenticate(serviceAccountPath) {
  try {
    const fullPath = resolve(__dirname, '../', serviceAccountPath);
    const credentials = JSON.parse(await readFile(fullPath, 'utf8'));

    // Create JWT client with Search Console readonly scope
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/webmasters.readonly']
    );

    // Authorize the client
    await auth.authorize();

    console.log(chalk.green('✓ Authenticated with Google Search Console'));
    console.log(chalk.gray(`  Service account: ${credentials.client_email}`));

    // Return authenticated webmasters client
    return google.webmasters({ version: 'v3', auth });
  } catch (error) {
    console.error(chalk.red('✗ Authentication failed:'), error.message);
    throw error;
  }
}

/**
 * Validate that credentials file exists and has required fields
 * @param {string} serviceAccountPath - Path to service account JSON file
 * @returns {Promise<boolean>}
 */
export async function validateCredentials(serviceAccountPath) {
  try {
    const fullPath = resolve(__dirname, '../', serviceAccountPath);
    const credentials = JSON.parse(await readFile(fullPath, 'utf8'));

    const required = ['client_email', 'private_key', 'project_id'];
    const missing = required.filter(field => !credentials[field]);

    if (missing.length > 0) {
      console.error(chalk.red('✗ Invalid service account JSON. Missing fields:'), missing);
      return false;
    }

    if (credentials.type !== 'service_account') {
      console.error(chalk.red('✗ Invalid credentials type. Expected "service_account"'));
      return false;
    }

    console.log(chalk.green('✓ Service account credentials valid'));
    return true;
  } catch (error) {
    console.error(chalk.red('✗ Could not read service account file:'), error.message);
    return false;
  }
}
