#!/usr/bin/env node

/**
 * Striking-distance worklist — the queries where clicks are actually available.
 *
 * Positions 4-20 are the only place a snippet or a small ranking push can pay. Everything
 * deeper is a ranking/indexing problem no meta rewrite will solve (see utils/ctr-curve.js).
 *
 * Splits each query into one of two buckets, because they need completely different work:
 *
 *   SNIPPET   ranks fine, but earns far fewer clicks than its position should pay.
 *             The page is already in front of people and they are not clicking.
 *             Fix: rewrite the title/meta on the ranking page. Cheap, no ranking work.
 *
 *   RANKING   click-through is in line with the position; it simply is not high enough.
 *             Fix: content depth, internal links, authority. Slower, more expensive.
 *
 * Usage:
 *   node src/striking-distance.js                       # all enabled domains
 *   node src/striking-distance.js --domain=mytattoo.software
 *   node src/striking-distance.js --days=90 --min-impressions=20
 */

import { format, subDays } from 'date-fns';
import chalk from 'chalk';
import { authenticate } from './auth.js';
import { loadConfig } from './utils/config.js';
import { getTopQueries, getTopPages } from './api/search-analytics.js';
import { expectedCtr, clickUpside, underperformingRows } from './utils/ctr-curve.js';

// A query needs enough impressions for its CTR to mean anything. Below this, a single click
// swings the ratio wildly and we would be chasing noise.
const DEFAULT_MIN_IMPRESSIONS = 25;

// Below this share of expected CTR, the snippet — not the position — is what is losing clicks.
const SNIPPET_FAIL_RATIO = 0.5;

function parseArgs(argv) {
  const opts = { days: 28, minImpressions: DEFAULT_MIN_IMPRESSIONS, domain: null };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--domain=')) opts.domain = arg.split('=')[1];
    else if (arg.startsWith('--days=')) opts.days = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--min-impressions=')) opts.minImpressions = parseInt(arg.split('=')[1], 10);
  }
  return opts;
}

function classify(query) {
  const expected = query.impressions * expectedCtr(query.position);
  const ratio = expected > 0 ? query.clicks / expected : null;

  // Snippet problem: the position is being served, the click is not being earned.
  if (ratio !== null && ratio < SNIPPET_FAIL_RATIO) {
    return {
      bucket: 'SNIPPET',
      // Recoverable without moving the ranking at all.
      upside: expected - query.clicks,
      expected,
      ratio
    };
  }

  // Otherwise the snippet is doing its job; the only upside is ranking higher.
  return {
    bucket: 'RANKING',
    upside: clickUpside(query, 3),
    expected,
    ratio
  };
}

function printDomain(domain, queries, opts) {
  const inRange = queries.filter(
    q => q.position >= 4 && q.position <= 20 && q.impressions >= opts.minImpressions
  );

  console.log(chalk.cyan('\n' + '━'.repeat(60)));
  console.log(chalk.bold.cyan(`🎯  STRIKING DISTANCE — ${domain.toUpperCase()}`));
  console.log(chalk.cyan('━'.repeat(60)));

  if (inRange.length === 0) {
    console.log(chalk.gray(
      `\n  No queries at positions 4-20 with >=${opts.minImpressions} impressions.\n` +
      `  Nothing here is close enough to page 1 to be worth snippet work.\n`
    ));
    return { snippet: [], ranking: [] };
  }

  const scored = inRange
    .map(q => ({ ...q, ...classify(q) }))
    .sort((a, b) => b.upside - a.upside);

  const snippet = scored.filter(q => q.bucket === 'SNIPPET');
  const ranking = scored.filter(q => q.bucket === 'RANKING');

  const row = q =>
    `    ${chalk.white(q.query.slice(0, 42).padEnd(44))}` +
    `pos ${q.position.toFixed(1).padStart(4)}   ` +
    `${String(q.impressions).padStart(5)} impr   ` +
    `${String(q.clicks).padStart(3)} clicks   ` +
    chalk.green(`+${q.upside.toFixed(1)}`);

  if (snippet.length > 0) {
    console.log(chalk.bold.yellow(`\n  ✍️  SNIPPET — ranking, not being clicked (${snippet.length})`));
    console.log(chalk.gray('     Rewrite title/meta on the ranking page. No ranking work needed.\n'));
    snippet.forEach(q => console.log(row(q)));
    const total = snippet.reduce((s, q) => s + q.upside, 0);
    console.log(chalk.yellow(`\n     Recoverable at current rankings: ~${total.toFixed(0)} clicks/mo`));
  }

  if (ranking.length > 0) {
    console.log(chalk.bold.blue(`\n  📈 RANKING — clicking as expected, just too low (${ranking.length})`));
    console.log(chalk.gray('     CTR is fine. Needs content depth / internal links / authority.\n'));
    ranking.slice(0, 10).forEach(q => console.log(row(q)));
    if (ranking.length > 10) {
      console.log(chalk.gray(`     … and ${ranking.length - 10} more`));
    }
    const total = ranking.reduce((s, q) => s + q.upside, 0);
    console.log(chalk.blue(`\n     Upside if lifted to top 3: ~${total.toFixed(0)} clicks/mo`));
  }

  return { snippet, ranking };
}

async function main() {
  const opts = parseArgs(process.argv);
  const config = await loadConfig();

  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), opts.days), 'yyyy-MM-dd');

  console.log(chalk.bold.cyan('\n🎯 Striking-Distance Worklist'));
  console.log(chalk.gray(`   ${startDate} to ${endDate}  ·  positions 4-20  ·  >=${opts.minImpressions} impressions`));

  const client = await authenticate(config.serviceAccountPath);

  const domains = opts.domain
    ? config.domains.filter(d => d.name === opts.domain && d.enabled)
    : config.domains.filter(d => d.enabled);

  if (domains.length === 0) {
    console.error(chalk.red('❌ No enabled domains found'));
    process.exit(1);
  }

  const totals = { snippet: 0, ranking: 0, snippetClicks: 0, rankingClicks: 0 };

  for (const domainConfig of domains) {
    const queries = await getTopQueries(client, domainConfig.gscProperty, startDate, endDate, 100);
    const pages = await getTopPages(client, domainConfig.gscProperty, startDate, endDate, 100);
    const { snippet, ranking } = printDomain(domainConfig.name, queries, opts);

    // The page view matters as much as the query view, and is easy to skip: GSC anonymizes the
    // long tail, so query rows carry only ~5-11% of impressions here while page rows carry ~90%.
    // mydojo's single biggest fact — one blog post holding 27% of all site impressions at zero
    // clicks — is invisible in the query rows entirely.
    const weakPages = underperformingRows(pages, { minImpressions: 100, maxRatio: 0.4 });
    if (weakPages.length > 0) {
      console.log(chalk.bold.red(`\n  🚩 PAGES ranking top-20 but not clicked (${weakPages.length})`));
      console.log(chalk.gray('     Check intent before touching the meta: if these rank for an audience'));
      console.log(chalk.gray('     your product does not serve, no snippet rewrite will earn the click.\n'));
      weakPages.forEach(p => {
        const path = p.page.replace(/^https?:\/\/[^/]+/, '');
        console.log(
          `    ${chalk.white(path.slice(0, 42).padEnd(44))}` +
          `pos ${p.position.toFixed(1).padStart(4)}   ` +
          `${String(p.impressions).padStart(5)} impr   ` +
          `${String(p.clicks).padStart(3)} clicks   ` +
          chalk.red(`${(p.ratio * 100).toFixed(0)}% of expected`)
        );
      });
    }

    totals.snippet += snippet.length;
    totals.ranking += ranking.length;
    totals.snippetClicks += snippet.reduce((s, q) => s + q.upside, 0);
    totals.rankingClicks += ranking.reduce((s, q) => s + q.upside, 0);
  }

  console.log(chalk.cyan('\n' + '━'.repeat(60)));
  console.log(chalk.bold.cyan('📋  PORTFOLIO TOTAL'));
  console.log(chalk.cyan('━'.repeat(60)));
  console.log(
    `\n  ✍️  Snippet fixes:  ${chalk.bold(totals.snippet)} queries  →  ` +
    chalk.green(`~${totals.snippetClicks.toFixed(0)} clicks/mo`) + chalk.gray('  (no ranking change needed)')
  );
  console.log(
    `  📈 Ranking pushes: ${chalk.bold(totals.ranking)} queries  →  ` +
    chalk.green(`~${totals.rankingClicks.toFixed(0)} clicks/mo`) + chalk.gray('  (if lifted to top 3)')
  );
  console.log(chalk.gray('\n  Do the snippet fixes first — same clicks, a fraction of the work.\n'));
}

main().catch(err => {
  console.error(chalk.red(`\n❌ ${err.message}`));
  process.exit(1);
});
