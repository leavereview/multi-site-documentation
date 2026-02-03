import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Generate content manifest from cross-link audit data
 * @param {string} crossLinkDataPath - Path to cross-link-audit-data.json
 * @param {string} domainName - Domain to filter (e.g., 'mydojo.software')
 * @returns {Promise<Object>} Content manifest
 */
export async function generateManifest(crossLinkDataPath, domainName) {
  try {
    console.log(chalk.gray(`  Loading content inventory for ${domainName}...`));

    const fullPath = resolve(__dirname, '../../', crossLinkDataPath);
    const rawData = await readFile(fullPath, 'utf8');
    const auditData = JSON.parse(rawData);

    // Filter pages for the specified domain
    const domainPages = auditData.filter(item => item.site === domainName);

    console.log(chalk.green(`✓ Found ${domainPages.length} pages for ${domainName}`));

    // Create manifest with GSC tracking structure
    const manifest = {
      generatedAt: new Date().toISOString(),
      domain: domainName,
      totalPages: domainPages.length,
      pages: domainPages.map(page => ({
        id: page.id,
        url: page.url,
        title: page.title,
        type: page.type,
        wordCount: page.wordCount,
        themes: page.themes || [],
        tags: page.tags || [],
        // GSC tracking fields (initialized as null, will be populated by API calls)
        gscTracking: {
          lastChecked: null,
          indexStatus: null,
          performance: {
            clicks: null,
            impressions: null,
            ctr: null,
            position: null
          }
        }
      }))
    };

    return manifest;
  } catch (error) {
    console.error(chalk.red('✗ Failed to generate manifest:'), error.message);
    throw error;
  }
}

/**
 * Save manifest to file
 * @param {Object} manifest - Content manifest object
 * @param {string} outputPath - Output directory path
 * @returns {Promise<string>} Path to saved manifest file
 */
export async function saveManifest(manifest, outputPath) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const filename = `content-manifest-${date}.json`;
    const manifestsDir = resolve(outputPath, 'manifests');

    // Ensure manifests directory exists
    await mkdir(manifestsDir, { recursive: true });

    const filepath = resolve(manifestsDir, filename);
    await writeFile(filepath, JSON.stringify(manifest, null, 2));

    console.log(chalk.green(`✓ Saved manifest: ${filepath}`));
    return filepath;
  } catch (error) {
    console.error(chalk.red('✗ Failed to save manifest:'), error.message);
    throw error;
  }
}

/**
 * Load existing manifest from file
 * @param {string} filepath - Path to manifest file
 * @returns {Promise<Object>} Content manifest
 */
export async function loadManifest(filepath) {
  try {
    const rawData = await readFile(filepath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(chalk.red('✗ Failed to load manifest:'), error.message);
    throw error;
  }
}
