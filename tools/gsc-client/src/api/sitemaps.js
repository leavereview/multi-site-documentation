import chalk from 'chalk';

/**
 * Fetch sitemap health data for a GSC property
 * @param {Object} client - Authenticated webmasters v3 client
 * @param {string} siteUrl - GSC property URL (e.g., 'https://mydojo.software/')
 * @returns {Promise<Array>} Sitemap status objects
 */
export async function getSitemapStatus(client, siteUrl) {
  try {
    const response = await client.sitemaps.list({ siteUrl });
    const sitemaps = response.data.sitemap || [];

    return sitemaps.map(sm => ({
      path: sm.path,
      lastDownloaded: sm.lastDownloaded || null,
      isPending: sm.isPending || false,
      isSitemapsIndex: sm.isSitemapsIndex || false,
      errors: parseInt(sm.errors || '0'),
      warnings: parseInt(sm.warnings || '0')
    }));
  } catch (error) {
    console.log(chalk.yellow(`  ⚠️  Sitemaps fetch failed: ${error.message}`));
    return [];
  }
}
