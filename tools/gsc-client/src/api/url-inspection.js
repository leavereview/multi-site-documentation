import { google } from 'googleapis';
import chalk from 'chalk';

/**
 * Inspect indexing status for a list of URLs using the Search Console URL Inspection API.
 * Rate limit: 2,000 requests/day. Keep urls[] short (5-8 per domain).
 *
 * @param {Object} auth - Google JWT auth client (from getJwtAuth())
 * @param {string} siteUrl - GSC property URL (e.g., 'https://mydojo.software/')
 * @param {string[]} urls - Full URLs to inspect
 * @returns {Promise<Array>} Inspection results
 */
export async function inspectUrls(auth, siteUrl, urls) {
  const sc = google.searchconsole({ version: 'v1', auth });
  const results = [];

  for (const url of urls) {
    try {
      const res = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl }
      });

      const idx = res.data.inspectionResult?.indexStatusResult || {};
      results.push({
        url,
        coverageState: idx.coverageState || 'Unknown',
        verdict: idx.verdict || 'NEUTRAL',
        lastCrawlTime: idx.lastCrawlTime || null,
        pageFetchState: idx.pageFetchState || 'Unknown',
        robotsTxtState: idx.robotsTxtState || 'Unknown'
      });
    } catch (err) {
      results.push({
        url,
        coverageState: 'Error',
        verdict: 'ERROR',
        lastCrawlTime: null,
        pageFetchState: 'Error',
        robotsTxtState: 'Unknown',
        error: err.message
      });
    }
  }

  return results;
}
