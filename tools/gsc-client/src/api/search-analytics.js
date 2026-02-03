import chalk from 'chalk';

/**
 * Fetch search analytics data from GSC
 * @param {Object} client - Authenticated webmasters client
 * @param {string} siteUrl - GSC property URL (e.g., 'sc-domain:mydojo.software')
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Array} dimensions - Dimensions to query (default: ['query', 'page'])
 * @returns {Promise<Object>} Search analytics data
 */
export async function getSearchAnalytics(client, siteUrl, startDate, endDate, dimensions = ['query', 'page']) {
  try {
    console.log(chalk.gray(`  Fetching search analytics (${startDate} to ${endDate})...`));

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit: 1000,
        startRow: 0
      }
    });

    const rows = response.data.rows || [];
    console.log(chalk.green(`✓ Fetched ${rows.length} rows of data`));

    return {
      rows,
      startDate,
      endDate,
      dimensions
    };
  } catch (error) {
    console.error(chalk.red('✗ Failed to fetch search analytics:'), error.message);
    throw error;
  }
}

/**
 * Get top queries by clicks
 * @param {Object} client - Authenticated webmasters client
 * @param {string} siteUrl - GSC property URL
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number} limit - Number of results (default: 100)
 * @returns {Promise<Array>} Top queries with metrics
 */
export async function getTopQueries(client, siteUrl, startDate, endDate, limit = 100) {
  try {
    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
        startRow: 0
      }
    });

    return (response.data.rows || []).map(row => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));
  } catch (error) {
    console.error(chalk.red('✗ Failed to fetch top queries:'), error.message);
    throw error;
  }
}

/**
 * Get top pages by clicks
 * @param {Object} client - Authenticated webmasters client
 * @param {string} siteUrl - GSC property URL
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number} limit - Number of results (default: 100)
 * @returns {Promise<Array>} Top pages with metrics
 */
export async function getTopPages(client, siteUrl, startDate, endDate, limit = 100) {
  try {
    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit,
        startRow: 0
      }
    });

    return (response.data.rows || []).map(row => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));
  } catch (error) {
    console.error(chalk.red('✗ Failed to fetch top pages:'), error.message);
    throw error;
  }
}

/**
 * Calculate aggregate metrics from search analytics data
 * @param {Array} rows - Raw search analytics rows
 * @returns {Object} Aggregated metrics
 */
export function calculateAggregateMetrics(rows) {
  if (!rows || rows.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      avgCtr: 0,
      avgPosition: 0
    };
  }

  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  // Weighted average position by impressions
  const weightedPositionSum = rows.reduce((sum, row) => sum + (row.position * row.impressions), 0);
  const avgPosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0;

  return {
    totalClicks,
    totalImpressions,
    avgCtr,
    avgPosition
  };
}
