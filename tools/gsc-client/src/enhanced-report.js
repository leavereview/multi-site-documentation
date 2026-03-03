#!/usr/bin/env node

/**
 * Enhanced SEO Report with Historical Tracking + Content Gap Analysis
 *
 * Integrates:
 * 1. Google Search Console data
 * 2. Google Analytics 4 engagement metrics
 * 3. SEO_AUDIT_REPORT.md content gap analysis
 * 4. Historical metrics tracking (trends over time)
 * 5. Smart recommendations based on progress
 */

import { format, subDays } from 'date-fns';
import chalk from 'chalk';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { authenticate, getJwtAuth } from './auth.js';
import { loadConfig, expandPath } from './utils/config.js';
import { getSitemapStatus } from './api/sitemaps.js';
import { inspectUrls } from './api/url-inspection.js';
import { getTopQueries, getTopPages, calculateAggregateMetrics } from './api/search-analytics.js';
import GA4Client from './analytics/ga4-client.js';
import CombinedReportGenerator from './reports/combined-report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    days: 28,
    domain: null,
    withAnalytics: false,
    withCoverage: false,
    logChange: null,
    logSites: null,
    logCategory: null,
    logReason: null,
    logImpact: null,
    logTimeline: null
  };

  args.forEach(arg => {
    if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--domain=')) {
      options.domain = arg.split('=')[1];
    } else if (arg === '--with-analytics') {
      options.withAnalytics = true;
    } else if (arg === '--with-coverage') {
      options.withCoverage = true;
    } else if (arg.startsWith('--log-change=')) {
      options.logChange = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--sites=')) {
      options.logSites = arg.split('=')[1].split(',');
    } else if (arg.startsWith('--category=')) {
      options.logCategory = arg.split('=')[1];
    } else if (arg.startsWith('--reason=')) {
      options.logReason = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--expected-impact=')) {
      options.logImpact = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--expected-timeline=')) {
      options.logTimeline = arg.split('=').slice(1).join('=');
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  });

  return options;
}

function showHelp() {
  console.log(chalk.bold.cyan('\n📊 Enhanced SEO Report\n'));
  console.log('Integrates GSC + GA4 + Content Gaps + Historical Tracking\n');
  console.log('Usage: node src/enhanced-report.js [options]\n');
  console.log('Options:');
  console.log('  --domain=<domain>             Check specific domain (default: all)');
  console.log('  --days=<number>               Date range in days (default: 28)');
  console.log('  --with-analytics              Include GA4 engagement metrics');
  console.log('  --with-coverage               Include sitemaps health + URL inspection (slower, ~30s extra)');
  console.log('  --log-change=<description>    Log an SEO change to the changelog');
  console.log('  --sites=<domain,domain,...>   Sites affected (default: all)');
  console.log('  --category=<type>             Change category: content|technical|meta|links|schema|analytics|conversion|performance');
  console.log('  --reason=<text>               Why the change was made');
  console.log('  --expected-impact=<text>      What metric improvement is expected');
  console.log('  --expected-timeline=<text>    When to expect results (e.g. "2-4 weeks")');
  console.log('  --help, -h                    Show this help message\n');
  console.log('Examples:');
  console.log('  node src/enhanced-report.js');
  console.log('  node src/enhanced-report.js --domain=mydojo.software --with-analytics');
  console.log('  node src/enhanced-report.js --with-analytics --with-coverage');
  console.log('  node src/enhanced-report.js --log-change="Added 3 new blog posts" --sites=mydojo.software --category=content\n');
}

/**
 * Load SEO audit report and parse content gaps
 */
function loadAuditReport() {
  try {
    const auditPath = resolve(__dirname, '../../../SEO_AUDIT_REPORT.md');
    if (!existsSync(auditPath)) {
      console.log(chalk.yellow('⚠️  SEO_AUDIT_REPORT.md not found. Content gap analysis disabled.'));
      return null;
    }

    const content = readFileSync(auditPath, 'utf-8');

    // Parse the audit report to extract content gaps by domain
    const gaps = {
      'mydojo.software': parseDojoGaps(content),
      'petcare.software': parsePetCareGaps(content),
      'mydriveschool.software': parseDriveSchoolGaps(content),
      'mytattoo.software': parseTattooGaps(content)
    };

    return gaps;
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Failed to load audit report: ${error.message}`));
    return null;
  }
}

/**
 * Parse MyDojo content gaps from audit report
 */
function parseDojoGaps(content) {
  const dojoSection = content.match(/## 1\. MyDojo\.software[\s\S]*?(?=## 2\.|$)/);
  if (!dojoSection) return { existing: 0, planned: 0, gap: 0, missingPillars: [], missingPosts: [] };

  const text = dojoSection[0];

  // Extract existing counts
  const pillarMatch = text.match(/\*\*Pillar Pages \((\d+)\):\*\*/);
  const blogMatch = text.match(/\*\*Blog Posts \((\d+)\):\*\*/);
  const existingPillars = pillarMatch ? parseInt(pillarMatch[1]) : 0;
  const existingPosts = blogMatch ? parseInt(blogMatch[1]) : 0;

  // Extract missing content
  const missingPillars = [];
  const missingPostsSection = text.match(/\*\*Missing Blog Posts[\s\S]*?\|(.*)\n/g);

  // Parse missing pillar pages
  const pillarTableMatch = text.match(/\*\*Missing Pillar Pages:[\s\S]*?\| (.*?) \|/g);
  if (pillarTableMatch) {
    pillarTableMatch.slice(2).forEach(row => {
      const cols = row.split('|').map(c => c.trim()).filter(c => c);
      if (cols.length >= 3) {
        missingPillars.push({
          title: cols[0],
          keyword: cols[1],
          volume: parseInt(cols[2]) || 0
        });
      }
    });
  }

  // Parse missing blog posts
  const missingPosts = [];
  const postTableMatch = text.match(/\*\*Missing Blog Posts[\s\S]*?\| Week \|[\s\S]*?\n\n/);
  if (postTableMatch) {
    const rows = postTableMatch[0].split('\n').slice(2);
    rows.forEach(row => {
      if (!row.trim() || row.startsWith('##')) return;
      const cols = row.split('|').map(c => c.trim()).filter(c => c);
      if (cols.length >= 4) {
        missingPosts.push({
          week: cols[0],
          title: cols[1],
          keyword: cols[2],
          volume: parseInt(cols[3]) || 0
        });
      }
    });
  }

  return {
    existing: existingPillars + existingPosts,
    planned: 40, // From audit summary
    gap: 65, // From audit summary
    missingPillars,
    missingPosts
  };
}

/**
 * Parse PetCare content gaps
 */
function parsePetCareGaps(content) {
  const section = content.match(/## 4\. PetCare\.software[\s\S]*?(?=---|\n##|$)/);
  if (!section) return { existing: 0, planned: 0, gap: 35, missingPillars: [], missingPosts: [] };

  return {
    existing: 33, // 4 pillars + 29 posts from audit
    planned: 50,
    gap: 35,
    missingPillars: [],
    missingPosts: []
  };
}

/**
 * Parse MyDriveSchool content gaps
 */
function parseDriveSchoolGaps(content) {
  const section = content.match(/## 2\. MyDriveSchool\.software[\s\S]*?(?=## 3\.|$)/);
  if (!section) return { existing: 0, planned: 0, gap: 77, missingPillars: [], missingPosts: [] };

  return {
    existing: 11, // 3 pillars + 8 posts
    planned: 48,
    gap: 77,
    missingPillars: [],
    missingPosts: []
  };
}

/**
 * Parse MyTattoo content gaps
 */
function parseTattooGaps(content) {
  const section = content.match(/## 3\. MyTattoo\.software[\s\S]*?(?=## 4\.|$)/);
  if (!section) return { existing: 0, planned: 0, gap: 64, missingPillars: [], missingPosts: [] };

  return {
    existing: 18, // 3 pillars + 15 posts
    planned: 50,
    gap: 64,
    missingPillars: [],
    missingPosts: []
  };
}

/**
 * Parse blog post dates and titles from a site's content directory
 */
function getBlogPosts(domain) {
  try {
    const blogDir = resolve(__dirname, '../../../', domain, 'src/content/blog');
    if (!existsSync(blogDir)) return [];

    const posts = [];
    for (const file of readdirSync(blogDir)) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
      const content = readFileSync(resolve(blogDir, file), 'utf-8');
      const titleMatch = content.match(/^title:\s*"?([^"\n]+)"?\s*$/m);
      const dateMatch = content.match(/^date:\s*"?(\d{4}-\d{2}-\d{2})"?\s*$/m);
      if (dateMatch) {
        posts.push({
          slug: file.replace(/\.(md|mdx)$/, ''),
          title: titleMatch ? titleMatch[1].trim() : file,
          date: dateMatch[1]
        });
      }
    }
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {
    return [];
  }
}

/**
 * Print content calendar: upcoming scheduled posts + recently published
 */
function printContentCalendar(domain) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const recentCutoff = subDays(new Date(), 30);
  const posts = getBlogPosts(domain);
  if (posts.length === 0) return;

  const upcoming = posts.filter(p => p.date > today);
  const recent = posts.filter(p => new Date(p.date) >= recentCutoff && p.date <= today);

  if (upcoming.length === 0 && recent.length === 0) return;

  console.log(chalk.bold('\n📅 CONTENT CALENDAR\n'));

  if (upcoming.length > 0) {
    console.log(chalk.yellow(`  Scheduled (${upcoming.length} upcoming):\n`));
    upcoming.slice(0, 10).forEach(p => {
      console.log(`    ${chalk.yellow(p.date)}  ${p.title}`);
    });
    if (upcoming.length > 10) {
      console.log(chalk.gray(`    ... and ${upcoming.length - 10} more`));
    }
    console.log();
  }

  if (recent.length > 0) {
    console.log(chalk.green(`  Recently Published (last 30 days, ${recent.length} posts):\n`));
    // Group by date
    const byDate = {};
    recent.forEach(p => {
      if (!byDate[p.date]) byDate[p.date] = [];
      byDate[p.date].push(p.title);
    });
    Object.entries(byDate)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .forEach(([date, titles]) => {
        if (titles.length === 1) {
          console.log(`    ${chalk.green(date)}  ${titles[0]}`);
        } else {
          console.log(`    ${chalk.green(date)}  ${titles[0]}`);
          titles.slice(1).forEach(t => console.log(`                   ${t}`));
        }
      });
    console.log();
  }
}

/**
 * Load SEO changelog
 */
function loadChangelog() {
  try {
    const changelogFile = resolve(__dirname, '../history/changes.json');
    if (!existsSync(changelogFile)) return [];
    return JSON.parse(readFileSync(changelogFile, 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * Append a new entry to the SEO changelog
 */
function appendChangelogEntry(entry) {
  try {
    const changelogFile = resolve(__dirname, '../history/changes.json');
    const changelog = loadChangelog();
    changelog.push(entry);
    writeFileSync(changelogFile, JSON.stringify(changelog, null, 2));
    console.log(chalk.green(`\n✓ Change logged to changes.json`));
    console.log(chalk.gray(`  Date: ${entry.date}`));
    console.log(chalk.gray(`  Sites: ${entry.sites.join(', ')}`));
    console.log(chalk.gray(`  Category: ${entry.category}`));
    console.log(chalk.gray(`  Description: ${entry.description}\n`));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Failed to save changelog entry: ${error.message}`));
  }
}

/**
 * Get recent changelog entries for a specific domain (last N days)
 */
function getRecentChanges(domain, changelog, days = 60) {
  const cutoff = subDays(new Date(), days);
  return changelog
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= cutoff && (entry.sites.includes('all') || entry.sites.includes(domain));
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Print recent changelog entries for a domain
 */
function printRecentChanges(domain, changelog) {
  const recent = getRecentChanges(domain, changelog, 60);
  if (recent.length === 0) return;

  const categoryColors = {
    content: 'green',
    technical: 'cyan',
    meta: 'yellow',
    links: 'blue',
    schema: 'magenta',
    analytics: 'gray',
    conversion: 'red',
    performance: 'cyan'
  };

  const categoryIcons = {
    content: '📝',
    technical: '⚙️',
    meta: '🏷️',
    links: '🔗',
    schema: '🧩',
    analytics: '📊',
    conversion: '🎯',
    performance: '⚡'
  };

  console.log(chalk.bold('\n📋 RECENT CHANGES (last 60 days)\n'));
  recent.forEach(entry => {
    const color = categoryColors[entry.category] || 'white';
    const icon = categoryIcons[entry.category] || '•';
    console.log(`  ${chalk.gray(entry.date)}  ${chalk[color](`[${entry.category.toUpperCase()}]`)}  ${icon} ${entry.description}`);
    if (entry.reason) {
      console.log(chalk.gray(`             Why: ${entry.reason}`));
    }
    if (entry.expectedImpact) {
      console.log(chalk.gray(`             Expected: ${entry.expectedImpact}`));
    }
    if (entry.expectedTimeline) {
      console.log(chalk.gray(`             Timeline: ${entry.expectedTimeline}`));
    }
    console.log();
  });
}

/**
 * Load historical metrics for a domain
 */
function loadHistoricalMetrics(domain) {
  try {
    const historyDir = resolve(__dirname, '../history');
    if (!existsSync(historyDir)) {
      mkdirSync(historyDir, { recursive: true });
    }

    const historyFile = resolve(historyDir, `${domain}.json`);
    if (!existsSync(historyFile)) {
      return [];
    }

    const content = readFileSync(historyFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log(chalk.gray(`   No historical data for ${domain}`));
    return [];
  }
}

/**
 * Save current metrics to historical record
 */
function saveHistoricalMetrics(domain, metrics) {
  try {
    const historyDir = resolve(__dirname, '../history');
    if (!existsSync(historyDir)) {
      mkdirSync(historyDir, { recursive: true });
    }

    const historyFile = resolve(historyDir, `${domain}.json`);
    const history = loadHistoricalMetrics(domain);

    // Add current metrics with timestamp
    history.push({
      date: format(new Date(), 'yyyy-MM-dd'),
      ...metrics
    });

    // Keep last 90 days only
    const cutoffDate = subDays(new Date(), 90);
    const filtered = history.filter(h => new Date(h.date) >= cutoffDate);

    writeFileSync(historyFile, JSON.stringify(filtered, null, 2));
    console.log(chalk.gray(`   ✓ Saved to historical record (${filtered.length} data points)`));
  } catch (error) {
    console.log(chalk.yellow(`   ⚠️  Failed to save history: ${error.message}`));
  }
}

/**
 * Calculate trend from historical data
 */
function calculateTrend(history, metricName) {
  if (history.length < 2) return { trend: 'new', change: 0, changePercent: 0 };

  const current = history[history.length - 1][metricName] || 0;
  const previous = history[history.length - 2][metricName] || 0;

  if (previous === 0) return { trend: 'new', change: current, changePercent: 0 };

  const change = current - previous;
  const changePercent = (change / previous) * 100;

  return {
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    change,
    changePercent,
    previous,
    current
  };
}

/**
 * Generate recommendations based on data + audit gaps
 */
function generateRecommendations(domainData, contentGaps, history) {
  const recommendations = [];

  // Baseline metrics for comparison (from MEMORY.md - Feb 9, 2026)
  const baselines = {
    'mydojo.software': { clicks: 1, impressions: 2079, ctr: 0.05, position: 66.1 },
    'petcare.software': { clicks: 0, impressions: 137, ctr: 0.0, position: 85.6 },
    'mydriveschool.software': { clicks: 10, impressions: 3068, ctr: 0.33, position: 51.2 },
    'mytattoo.software': { clicks: 1, impressions: 884, ctr: 0.11, position: 75.4 }
  };

  const baseline = baselines[domainData.domain];
  const current = domainData.metrics;

  // Recommendation 1: Content Gap Priority
  if (contentGaps && contentGaps.gap > 50) {
    const priority = contentGaps.missingPosts
      .filter(p => p.volume > 1000)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3);

    if (priority.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Content Creation',
        issue: `${contentGaps.gap}% content gap - missing ${contentGaps.planned - contentGaps.existing} planned items`,
        action: `Create high-volume posts: ${priority.map(p => `"${p.title}" (${p.volume} vol)`).join(', ')}`,
        impact: 'These posts target 3,000+ monthly searches'
      });
    }
  }

  // Recommendation 2: CTR Optimization
  if (current.avgCtr < 1.0) {
    const impressionWaste = Math.round(current.totalImpressions * (0.02 - current.avgCtr / 100));
    recommendations.push({
      priority: 'HIGH',
      category: 'CTR Optimization',
      issue: `CTR is ${(current.avgCtr * 100).toFixed(2)}% (should be 2-3%)`,
      action: 'Rewrite meta descriptions using [Benefit] + [Data] + [CTA] formula',
      impact: `Could gain ${impressionWaste} additional clicks/month from existing impressions`
    });
  }

  // Recommendation 3: Position Improvements
  const strikingDistance = domainData.topQueries?.filter(q => q.position >= 4 && q.position <= 20) || [];
  if (strikingDistance.length > 0) {
    const topOpportunity = strikingDistance.sort((a, b) => b.impressions - a.impressions)[0];
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Quick Win',
      issue: `${strikingDistance.length} queries in striking distance (positions 4-20)`,
      action: `Optimize "${topOpportunity.query}" (pos ${topOpportunity.position.toFixed(1)}, ${topOpportunity.impressions} impr)`,
      impact: 'Could move to page 1 with internal linking + content optimization'
    });
  }

  // Recommendation 4: Visibility Crisis (PetCare specific)
  if (current.totalImpressions < 200) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Visibility Crisis',
      issue: `Only ${current.totalImpressions} impressions - very low visibility`,
      action: 'Check GSC Coverage report for indexing issues, create more content, build backlinks',
      impact: 'Site is not showing up in search - needs immediate attention'
    });
  }

  // Recommendation 5: Progress Tracking
  if (baseline && history.length > 0) {
    const clickTrend = calculateTrend(history, 'totalClicks');
    if (clickTrend.trend === 'down') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Traffic Decline',
        issue: `Clicks decreased ${Math.abs(clickTrend.change)} (${clickTrend.changePercent.toFixed(1)}%) since last check`,
        action: 'Review recent changes, check for ranking drops, verify no technical issues',
        impact: 'Prevent further traffic loss'
      });
    } else if (clickTrend.trend === 'up') {
      // Positive feedback
      recommendations.push({
        priority: 'INFO',
        category: 'Progress',
        issue: `Clicks increased ${clickTrend.change} (${clickTrend.changePercent.toFixed(1)}%) - improvements working!`,
        action: 'Continue current optimization strategy',
        impact: 'On track to hit traffic goals'
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    return priority[a.priority] - priority[b.priority];
  });
}

/**
 * Get key pages to inspect for a domain (top-level .astro pages only)
 * @param {string} domain - Domain name (e.g., 'mydojo.software')
 * @returns {string[]} Full URLs to inspect
 */
function getKeyPages(domain) {
  try {
    const pagesDir = resolve(__dirname, '../../../', domain, 'src/pages');
    if (!existsSync(pagesDir)) return [`https://${domain}/`];

    const urls = [];
    for (const file of readdirSync(pagesDir)) {
      if (!file.endsWith('.astro')) continue;
      if (file.startsWith('[') || file.startsWith('_')) continue;
      if (file === '404.astro') continue;

      if (file === 'index.astro') {
        urls.push(`https://${domain}/`);
      } else {
        const slug = file.replace('.astro', '');
        urls.push(`https://${domain}/${slug}/`);
      }
    }

    return urls.slice(0, 7);
  } catch {
    return [`https://${domain}/`];
  }
}

/**
 * Print sitemaps health section
 */
function printSitemapsHealth(sitemaps) {
  console.log(chalk.bold('\n🗺️  SITEMAPS HEALTH\n'));

  if (!sitemaps || sitemaps.length === 0) {
    console.log(chalk.yellow('  No sitemaps found in GSC'));
    return;
  }

  for (const sm of sitemaps) {
    const name = sm.path.split('/').pop() || sm.path;
    const lastFetched = sm.lastDownloaded ? sm.lastDownloaded.slice(0, 10) : 'never';
    const pending = sm.isPending ? chalk.yellow(' [PENDING]') : '';
    let status;
    if (sm.errors > 0) {
      status = chalk.red(`${sm.errors} error${sm.errors > 1 ? 's' : ''}`);
    } else if (sm.warnings > 0) {
      status = chalk.yellow(`${sm.warnings} warning${sm.warnings > 1 ? 's' : ''}  ⚠️`);
    } else {
      status = chalk.green('✅');
    }
    console.log(`  ${name.padEnd(30)} Last fetched: ${lastFetched}  ${status}${pending}`);
  }
}

/**
 * Print URL inspection / index coverage section
 */
function printIndexCoverage(urlResults) {
  if (!urlResults || urlResults.length === 0) return;

  console.log(chalk.bold('\n📋 INDEX COVERAGE (key pages)\n'));

  for (const result of urlResults) {
    const path = result.url.replace(/^https?:\/\/[^/]+/, '') || '/';
    const lastCrawl = result.lastCrawlTime ? result.lastCrawlTime.slice(0, 10) : 'never';
    const isIndexed = result.verdict === 'PASS' || (result.coverageState || '').toLowerCase().includes('indexed');
    const stateStr = result.coverageState || result.verdict;
    const statusIcon = isIndexed ? chalk.green('✅') : chalk.yellow('⚠️');
    const stateColor = isIndexed ? 'green' : 'yellow';

    console.log(`  ${path.padEnd(38)} ${chalk[stateColor](stateStr.slice(0, 32).padEnd(33))} Crawl: ${lastCrawl}  ${statusIcon}`);
  }
}

/**
 * Print query position movers vs previous run
 */
function printQueryMovers(currentQueries, history) {
  if (!history || history.length === 0) return;

  const prevEntry = history[history.length - 1];
  if (!prevEntry?.topQueries || prevEntry.topQueries.length === 0) return;
  if (!currentQueries || currentQueries.length === 0) return;

  const prevMap = new Map(prevEntry.topQueries.map(q => [q.query, q]));

  const movers = [];
  for (const curr of currentQueries.slice(0, 20)) {
    const prev = prevMap.get(curr.query);
    if (!prev) continue;
    const diff = prev.position - curr.position; // positive = improved ranking
    if (Math.abs(diff) >= 1) {
      movers.push({ query: curr.query, prevPos: prev.position, currPos: curr.position, diff });
    }
  }

  if (movers.length === 0) return;

  movers.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  console.log(chalk.bold('\n📈 QUERY MOVERS (vs last check)\n'));
  movers.slice(0, 10).forEach(m => {
    const arrow = m.diff > 0 ? '↑' : '↓';
    const color = m.diff > 0 ? 'green' : 'red';
    const posChange = m.diff > 0 ? `+${m.diff.toFixed(1)}` : m.diff.toFixed(1);
    const queryPadded = m.query.length > 44 ? m.query.slice(0, 41) + '...' : m.query.padEnd(44);
    console.log(chalk[color](`  ${arrow} ${queryPadded}  pos ${m.prevPos.toFixed(1)} → ${m.currPos.toFixed(1)} (${posChange})`));
  });
}

/**
 * Print index gap estimate (published pages vs GSC-visible pages)
 */
function printIndexGap(domain, topPages) {
  try {
    const pagesDir = resolve(__dirname, '../../../', domain, 'src/pages');
    const blogDir = resolve(__dirname, '../../../', domain, 'src/content/blog');

    let pageCount = 0;
    let blogCount = 0;

    if (existsSync(pagesDir)) {
      for (const file of readdirSync(pagesDir)) {
        if (file.endsWith('.astro') && !file.startsWith('[') && !file.startsWith('_') && file !== '404.astro') {
          pageCount++;
        }
      }
    }

    if (existsSync(blogDir)) {
      for (const file of readdirSync(blogDir)) {
        if (file.endsWith('.md') || file.endsWith('.mdx')) blogCount++;
      }
    }

    const totalPublished = pageCount + blogCount;
    if (totalPublished === 0) return;

    const gscVisible = topPages ? topPages.length : 0;
    const pct = Math.round((gscVisible / totalPublished) * 100);
    const notIndexed = Math.max(0, totalPublished - gscVisible);
    const pctColor = pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red';

    console.log(chalk.bold('\n📊 INDEX GAP\n'));
    console.log(`  Published: ${chalk.blue(totalPublished)} pages   GSC-visible: ${chalk[pctColor](gscVisible + ' (' + pct + '%)')}   Not yet indexed: ~${chalk.yellow(notIndexed)}`);
  } catch {
    // skip silently if filesystem access fails
  }
}

/**
 * Print enhanced report for a single domain
 */
function printDomainReport(domainData, contentGaps, history, ga4Data = null, changelog = [], sitemapResults = null, urlInspectionResults = null) {
  const domain = domainData.domain;
  const metrics = domainData.metrics;

  console.log(chalk.cyan('\n' + '━'.repeat(70)));
  console.log(chalk.cyan.bold(`📊 ${domain.toUpperCase()}`));
  console.log(chalk.cyan('━'.repeat(70)));

  // Performance Metrics
  console.log(chalk.bold('\n📈 PERFORMANCE METRICS\n'));
  console.log(`  Clicks:       ${chalk.green(metrics.totalClicks.toLocaleString())}`);
  console.log(`  Impressions:  ${chalk.blue(metrics.totalImpressions.toLocaleString())}`);
  console.log(`  CTR:          ${chalk.yellow((metrics.avgCtr * 100).toFixed(2) + '%')}`);
  console.log(`  Avg Position: ${chalk.magenta(metrics.avgPosition.toFixed(1))}`);

  // Historical Trend
  if (history.length >= 2) {
    console.log(chalk.bold('\n📊 TRENDS (vs Previous Check)\n'));
    const clickTrend = calculateTrend(history, 'totalClicks');
    const impressionTrend = calculateTrend(history, 'totalImpressions');
    const ctrTrend = calculateTrend(history, 'avgCtr');

    const trendIcon = (trend) => trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
    const trendColor = (trend) => trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray';

    console.log(`  Clicks:       ${trendIcon(clickTrend.trend)} ${chalk[trendColor(clickTrend.trend)](clickTrend.change > 0 ? '+' + clickTrend.change : clickTrend.change)} (${clickTrend.changePercent.toFixed(1)}%)`);
    console.log(`  Impressions:  ${trendIcon(impressionTrend.trend)} ${chalk[trendColor(impressionTrend.trend)](impressionTrend.change > 0 ? '+' + impressionTrend.change : impressionTrend.change)} (${impressionTrend.changePercent.toFixed(1)}%)`);
    console.log(`  CTR:          ${trendIcon(ctrTrend.trend)} ${chalk[trendColor(ctrTrend.trend)]((ctrTrend.change * 100).toFixed(2) + '%')}`);
  }

  // Sitemaps Health (--with-coverage only)
  if (sitemapResults !== null) {
    printSitemapsHealth(sitemapResults);
  }

  // Index Coverage (--with-coverage only)
  if (urlInspectionResults !== null) {
    printIndexCoverage(urlInspectionResults);
  }

  // Query Movers (always, when previous run has topQueries)
  printQueryMovers(domainData.topQueries, history);

  // Index Gap Estimate (always)
  printIndexGap(domainData.domain, domainData.topPages);

  // Content Gap Analysis
  if (contentGaps) {
    console.log(chalk.bold('\n📝 CONTENT GAP ANALYSIS\n'));
    console.log(`  Existing Content: ${chalk.green(contentGaps.existing)} items`);
    console.log(`  Planned Content:  ${chalk.blue(contentGaps.planned)} items`);
    console.log(`  Content Gap:      ${chalk.yellow(contentGaps.gap + '%')} (${contentGaps.planned - contentGaps.existing} missing)`);

    if (contentGaps.missingPosts.length > 0) {
      const highVolume = contentGaps.missingPosts.filter(p => p.volume > 1000).slice(0, 3);
      if (highVolume.length > 0) {
        console.log(chalk.bold('\n  Top Missing Content (High Volume):\n'));
        highVolume.forEach((post, i) => {
          console.log(chalk.gray(`    ${i + 1}. "${post.title}" (${post.volume.toLocaleString()} monthly searches)`));
        });
      }
    }
  }

  // GA4 Integration
  if (ga4Data) {
    const combinedReport = new CombinedReportGenerator(
      { topQueries: domainData.topQueries, topPages: domainData.topPages, summary: metrics },
      ga4Data
    );

    const healthScore = combinedReport.calculateSEOHealthScore();
    const scoreColor = healthScore >= 70 ? 'green' : healthScore >= 40 ? 'yellow' : 'red';

    console.log(chalk.bold('\n🎯 SEO HEALTH SCORE\n'));
    console.log(`  Score: ${chalk[scoreColor].bold(healthScore + '/100')}`);
  }

  // Content Calendar
  printContentCalendar(domainData.domain);

  // Recent Changes
  printRecentChanges(domainData.domain, changelog);

  // Recommendations
  const recommendations = generateRecommendations(domainData, contentGaps, history);
  if (recommendations.length > 0) {
    console.log(chalk.bold('\n🎯 TOP RECOMMENDATIONS\n'));
    recommendations.slice(0, 5).forEach((rec, i) => {
      const priorityColor = rec.priority === 'CRITICAL' ? 'red' : rec.priority === 'HIGH' ? 'yellow' : rec.priority === 'INFO' ? 'green' : 'gray';
      console.log(chalk[priorityColor].bold(`  ${i + 1}. [${rec.priority}] ${rec.category}`));
      console.log(chalk.gray(`     Issue: ${rec.issue}`));
      console.log(chalk.green(`     Action: ${rec.action}`));
      console.log(chalk.blue(`     Impact: ${rec.impact}`));
      console.log();
    });
  }

  // Top Queries
  if (domainData.topQueries && domainData.topQueries.length > 0) {
    console.log(chalk.bold('🔍 TOP QUERIES\n'));
    domainData.topQueries.slice(0, 5).forEach((q, i) => {
      console.log(chalk.blue(`  ${i + 1}. ${q.query}`));
      console.log(chalk.gray(`     Position: ${q.position.toFixed(1)} | Impressions: ${q.impressions} | Clicks: ${q.clicks}\n`));
    });
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const options = parseArgs();

    // Handle --log-change before doing anything else
    if (options.logChange) {
      const entry = {
        date: format(new Date(), 'yyyy-MM-dd'),
        sites: options.logSites || ['all'],
        category: options.logCategory || 'content',
        description: options.logChange,
        ...(options.logReason && { reason: options.logReason }),
        ...(options.logImpact && { expectedImpact: options.logImpact }),
        ...(options.logTimeline && { expectedTimeline: options.logTimeline })
      };
      appendChangelogEntry(entry);
      process.exit(0);
    }

    const config = await loadConfig();

    console.log(chalk.bold.cyan('\n📊 Enhanced SEO Report with Historical Tracking\n'));
    console.log(chalk.gray('━'.repeat(70)));

    // Load changelog
    const changelog = loadChangelog();
    if (changelog.length > 0) {
      console.log(chalk.green(`✓ Changelog loaded (${changelog.length} entries)`));
    }

    // Load audit report
    console.log(chalk.blue('\n📋 Loading SEO audit report...'));
    const auditGaps = loadAuditReport();
    if (auditGaps) {
      console.log(chalk.green('✓ Audit report loaded - content gap analysis enabled'));
    }

    // Calculate date range
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), options.days), 'yyyy-MM-dd');
    console.log(chalk.gray(`\nDate range: ${startDate} to ${endDate}`));
    console.log(chalk.gray('━'.repeat(70)));

    // Authenticate with GSC
    const client = await authenticate(config.serviceAccountPath);

    // Pre-auth the JWT client for URL inspection if --with-coverage
    let jwtAuth = null;
    if (options.withCoverage) {
      console.log(chalk.blue('\n🔍 Coverage mode enabled — will fetch sitemaps + URL inspection'));
      jwtAuth = await getJwtAuth(config.serviceAccountPath);
    }

    // Determine which domains to check
    const domains = options.domain
      ? config.domains.filter(d => d.name === options.domain && d.enabled)
      : config.domains.filter(d => d.enabled);

    if (domains.length === 0) {
      console.error(chalk.red(`❌ No enabled domains found`));
      process.exit(1);
    }

    // Process each domain
    for (const domainConfig of domains) {
      console.log(chalk.bold(`\n📊 Fetching: ${chalk.cyan(domainConfig.name)}`));

      // Fetch GSC data
      const topQueries = await getTopQueries(client, domainConfig.gscProperty, startDate, endDate, 100);
      const topPages = await getTopPages(client, domainConfig.gscProperty, startDate, endDate, 100);
      const aggregateMetrics = calculateAggregateMetrics([...topQueries, ...topPages]);

      const domainData = {
        domain: domainConfig.name,
        dateRange: { start: startDate, end: endDate },
        metrics: aggregateMetrics,
        topQueries,
        topPages
      };

      console.log(chalk.green(`✓ Retrieved ${topQueries.length} queries, ${topPages.length} pages`));

      // Load historical data
      const history = loadHistoricalMetrics(domainConfig.name);

      // Save current metrics to history (include top 20 queries for position tracking)
      const top20Queries = topQueries.slice(0, 20).map(q => ({
        query: q.query,
        position: q.position,
        impressions: q.impressions,
        clicks: q.clicks
      }));
      saveHistoricalMetrics(domainConfig.name, { ...aggregateMetrics, topQueries: top20Queries });

      // Get content gaps for this domain
      const contentGaps = auditGaps ? auditGaps[domainConfig.name] : null;

      // Fetch GA4 data if enabled
      let ga4Data = null;
      if (options.withAnalytics && config.features?.ga4Enabled && domainConfig.ga4PropertyId) {
        try {
          console.log(chalk.blue('📊 Fetching GA4 engagement metrics...'));
          const ga4Client = new GA4Client(config.serviceAccountPath);

          const engagement = await ga4Client.getPageEngagement(
            domainConfig.ga4PropertyId,
            startDate,
            endDate
          );

          const conversions = await ga4Client.getConversionsByPage(
            domainConfig.ga4PropertyId,
            startDate,
            endDate
          );

          ga4Data = {
            engagement,
            conversions,
            topConverters: ga4Client.identifyTopConverters(conversions),
            problematicPages: ga4Client.identifyProblematicPages(engagement)
          };

          console.log(chalk.green(`✓ GA4 data retrieved`));
        } catch (error) {
          console.log(chalk.yellow(`⚠️  GA4 error: ${error.message}`));
        }
      }

      // Fetch coverage data if --with-coverage
      let sitemapResults = null;
      let urlInspectionResults = null;
      if (options.withCoverage) {
        console.log(chalk.blue('🗺️  Fetching sitemap health...'));
        sitemapResults = await getSitemapStatus(client, domainConfig.gscProperty);
        console.log(chalk.green(`✓ Sitemaps: ${sitemapResults.length} found`));

        const keyPages = getKeyPages(domainConfig.name);
        console.log(chalk.blue(`🔍 Inspecting ${keyPages.length} key pages...`));
        urlInspectionResults = await inspectUrls(jwtAuth, domainConfig.gscProperty, keyPages);
        console.log(chalk.green(`✓ URL inspection complete`));
      }

      // Print enhanced report
      printDomainReport(domainData, contentGaps, history, ga4Data, changelog, sitemapResults, urlInspectionResults);
    }

    // Footer
    console.log(chalk.gray('\n' + '━'.repeat(70)));
    console.log(chalk.green.bold('\n✅ Enhanced SEO Report Complete!\n'));
    console.log(chalk.gray('💡 Historical data saved for trend tracking'));
    if (!options.withAnalytics && config.features?.ga4Enabled) {
      console.log(chalk.yellow('💡 Tip: Add --with-analytics to include GA4 engagement metrics'));
    }
    if (!options.withCoverage) {
      console.log(chalk.yellow('💡 Tip: Add --with-coverage to check sitemaps health + URL indexing status\n'));
    } else {
      console.log();
    }

  } catch (error) {
    console.error(chalk.red('\n\n✗ Error:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Run the main function
main();
