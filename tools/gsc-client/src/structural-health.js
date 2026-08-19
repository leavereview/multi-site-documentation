/**
 * Structural Health Checks — Node.js implementation of the 3B–3J audit checks
 * from the /seo-check command.  Runs without bash, suitable for inline use during Slack sends.
 *
 * Per-site configuration in SITE_CONFIG covers all four sites. Can be run directly:
 *
 *   node src/structural-health.js                      # all configured domains
 *   node src/structural-health.js --domain=petcare.software
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Per-site structural rules.
 *  - folder:        local folder name (differs from domain for driveschoolpro.com)
 *  - pillarHubs:    pillar/hub page paths; every blog post must link to one in the first ~200 words
 *  - homepageHubs:  subset of pillarHubs that MUST be linked from the homepage
 *  - prohibited:    filename patterns that must never exist in the blog folder
 *  - eeatPattern:   signals expected on the about page
 */
const SITE_CONFIG = {
  'petcare.software': {
    folder: 'petcare.software',
    pillarHubs: ['/dog-daycare-software', '/dog-boarding-software', '/kennel-software', '/cattery-software'],
    homepageHubs: ['/dog-daycare-software', '/dog-boarding-software', '/kennel-software', '/cattery-software'],
    prohibited: /grooming|pup-cup|roadmap|training-tools/i,
    eeatPattern: /05408918|RevelationPets|Winchester|founded/g
  },
  'mydojo.software': {
    folder: 'mydojo.software',
    pillarHubs: [
      '/martial-arts-software', '/dojo-management-software', '/karate-school-software',
      '/mma-gym-software', '/bjj-gym-software', '/martial-arts-crm',
      '/martial-arts-billing-software', '/martial-arts-scheduling-software'
    ],
    homepageHubs: [
      '/martial-arts-software', '/dojo-management-software', '/karate-school-software',
      '/mma-gym-software', '/bjj-gym-software', '/martial-arts-crm',
      '/martial-arts-billing-software', '/martial-arts-scheduling-software'
    ],
    prohibited: /roadmap/i,
    eeatPattern: /founded|founder/gi
  },
  'mytattoo.software': {
    folder: 'mytattoo.software',
    pillarHubs: [
      '/tattoo-studio-software', '/tattoo-booking-software', '/tattoo-artist-software',
      '/tattoo-scheduling-software', '/tattoo-booking-app', '/tattoo-appointment-software'
    ],
    homepageHubs: [
      '/tattoo-studio-software', '/tattoo-booking-software', '/tattoo-artist-software',
      '/tattoo-scheduling-software', '/tattoo-booking-app', '/tattoo-appointment-software'
    ],
    prohibited: /roadmap/i,
    eeatPattern: /founded|founder/gi
  },
  'driveschoolpro.com': {
    folder: 'mydriveschool.software',
    pillarHubs: [
      '/driving-school-software', '/driving-school-management-software',
      '/driving-school-scheduling-software', '/free-driving-school-software',
      // DVSA learner-skill cluster hub — the 29 DVSA skill posts link here as their hub
      '/dvsa-27-driving-skills'
    ],
    homepageHubs: [
      '/driving-school-software', '/driving-school-management-software',
      '/driving-school-scheduling-software'
    ],
    prohibited: /roadmap/i,
    eeatPattern: /founded|founder|DVSA|ADI/g
  }
};

// Legacy domain shares the driveschoolpro.com folder/rules but its live sitemap
// is a 301 redirect target — skip it by default.
const DEFAULT_DOMAINS = Object.keys(SITE_CONFIG);

/**
 * Run all structural health checks for a domain.
 * Returns a structured results object.
 *
 * @param {string} domain - e.g. 'petcare.software'
 * @returns {Promise<object>} check results
 */
export async function runStructuralHealthChecks(domain) {
  const config = SITE_CONFIG[domain];
  if (!config) {
    return { domain, error: `No structural config for ${domain}. Known: ${DEFAULT_DOMAINS.join(', ')}` };
  }

  const { pillarHubs, homepageHubs, prohibited, eeatPattern } = config;
  const siteDir = resolve(__dirname, '../../../', config.folder);
  const blogDir = resolve(siteDir, 'src/content/blog');
  const pagesDir = resolve(siteDir, 'src/pages');

  // ── 3B  Sitemap live ──────────────────────────────────────────────────────
  let sitemapCheck = { pass: false, status: 'not checked' };
  try {
    const res = await fetch(`https://${domain}/sitemap-0.xml`, {
      signal: AbortSignal.timeout(6000)
    });
    sitemapCheck = { pass: res.ok, status: res.status };
  } catch (err) {
    sitemapCheck = { pass: false, status: err.message };
  }

  // ── Blog post checks (3C, 3D, 3E, 3F, 3H) ────────────────────────────────
  let blogFiles = [];
  if (existsSync(blogDir)) {
    blogFiles = readdirSync(blogDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  }

  const missingRelatedArticles = [];
  const hubLinkNotInFirst200 = [];  // has hub link somewhere but not in first 200 words
  const missingHubLink = [];        // no hub link anywhere in the post
  const shortPosts = [];            // under 800 words
  const prohibitedFiles = [];

  for (const file of blogFiles) {
    const content = readFileSync(resolve(blogDir, file), 'utf-8');
    const words = content.split(/\s+/).length;

    // 3D — Related Articles H2
    if (!content.includes('## Related Articles')) {
      missingRelatedArticles.push(file.replace('.md', ''));
    }

    // 3E — Word count
    if (words < 800) {
      shortPosts.push({ file: file.replace('.md', ''), words });
    }

    // 3H — Prohibited filenames
    if (prohibited.test(file)) {
      prohibitedFiles.push(file);
    }

    // 3C — Hub link in first ~1500 chars (skip YAML frontmatter)
    const body = content.replace(/^---[\s\S]*?\n---\n/, '');
    const first1500 = body.slice(0, 1500);
    const hasHubAnywhere  = pillarHubs.some(h => body.includes(h));
    const hasHubEarly     = pillarHubs.some(h => first1500.includes(h));
    if (!hasHubAnywhere) {
      missingHubLink.push(file.replace('.md', ''));
    } else if (!hasHubEarly) {
      hubLinkNotInFirst200.push(file.replace('.md', ''));
    }
  }

  // ── 3G  Broken image refs in pillar .astro pages ──────────────────────────
  const brokenImages = [];
  if (existsSync(pagesDir)) {
    const astroFiles = readdirSync(pagesDir).filter(
      f => f.endsWith('.astro') && !f.startsWith('_') && !f.startsWith('[')
    );
    for (const file of astroFiles) {
      const content = readFileSync(resolve(pagesDir, file), 'utf-8');
      const refs = [...content.matchAll(/src="(\/images\/[^"]+)"/g)].map(m => m[1]);
      for (const img of refs) {
        if (!existsSync(resolve(siteDir, 'public', img.slice(1)))) {
          brokenImages.push({ page: file, img });
        }
      }
    }
  }

  // ── 3I  Homepage pillar links ─────────────────────────────────────────────
  let homepagePillarLinks = [];
  const indexPath = resolve(pagesDir, 'index.astro');
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath, 'utf-8');
    homepagePillarLinks = homepageHubs.filter(h => content.includes(`href="${h}`));
  }

  // ── 3J  About E-E-A-T ─────────────────────────────────────────────────────
  let aboutEEAT = { signals: 0, pillarLinks: 0 };
  const aboutPath = resolve(pagesDir, 'about.astro');
  if (existsSync(aboutPath)) {
    const content = readFileSync(aboutPath, 'utf-8');
    aboutEEAT.signals     = (content.match(eeatPattern) || []).length;
    aboutEEAT.pillarLinks = pillarHubs.filter(h => content.includes(`href="${h}`)).length;
  }

  // ── Scoring ───────────────────────────────────────────────────────────────
  const checks = {
    sitemap:          { pass: sitemapCheck.pass,                  label: 'Sitemap live',           severity: 'CRITICAL' },
    hubLinks:         { pass: hubLinkNotInFirst200.length === 0 && missingHubLink.length === 0, label: 'Hub links <200w', severity: 'HIGH' },
    relatedArticles:  { pass: missingRelatedArticles.length === 0, label: 'Related Articles',      severity: 'HIGH'     },
    shortPosts:       { pass: shortPosts.length === 0,            label: 'Short posts (<800w)',     severity: 'MEDIUM'   },
    brokenImages:     { pass: brokenImages.length === 0,          label: 'Broken image refs',      severity: 'HIGH'     },
    prohibitedPages:  { pass: prohibitedFiles.length === 0,       label: 'Prohibited pages',       severity: 'CRITICAL' },
    homepagePillars:  { pass: homepagePillarLinks.length === homepageHubs.length, label: 'Homepage pillar links', severity: 'HIGH' },
    aboutEEAT:        { pass: aboutEEAT.signals > 0 && aboutEEAT.pillarLinks > 0, label: 'About E-E-A-T',       severity: 'MEDIUM'   },
  };

  const passing = Object.values(checks).filter(c => c.pass).length;
  const total   = Object.keys(checks).length;

  return {
    domain,
    checks,
    passing,
    total,
    details: {
      sitemapCheck,
      missingHubLink,
      hubLinkNotInFirst200,
      missingRelatedArticles,
      shortPosts,
      brokenImages,
      prohibitedFiles,
      homepagePillarLinks,
      homepagePillarTotal: homepageHubs.length,
      aboutEEAT
    }
  };
}

// ── CLI entry ────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const domainArg = process.argv.find(a => a.startsWith('--domain='));
  const domains = domainArg ? [domainArg.split('=')[1]] : DEFAULT_DOMAINS;

  for (const domain of domains) {
    const r = await runStructuralHealthChecks(domain);
    console.log('━'.repeat(60));
    console.log(`🏗️  STRUCTURAL HEALTH — ${domain}`);
    console.log('━'.repeat(60));
    if (r.error) {
      console.log(`  ❌ ${r.error}\n`);
      process.exitCode = 1;
      continue;
    }
    for (const c of Object.values(r.checks)) {
      console.log(`  ${c.pass ? '✅' : c.severity === 'CRITICAL' ? '❌' : '⚠️ '} ${c.label.padEnd(24)} ${c.pass ? 'pass' : c.severity}`);
    }
    console.log(`\n  Structural Score: ${r.passing}/${r.total} checks passing\n`);

    const d = r.details;
    const detailLines = [
      ['Sitemap status', r.checks.sitemap.pass ? null : d.sitemapCheck.status],
      ['No hub link anywhere', d.missingHubLink],
      ['Hub link not in first 200w', d.hubLinkNotInFirst200],
      ['Missing Related Articles', d.missingRelatedArticles],
      ['Short posts (<800w)', d.shortPosts.map(p => `${p.file} (${p.words}w)`)],
      ['Broken images', d.brokenImages.map(b => `${b.page}: ${b.img}`)],
      ['Prohibited files', d.prohibitedFiles],
      ['Homepage pillars linked', `${d.homepagePillarLinks.length}/${d.homepagePillarTotal}`],
      ['About E-E-A-T', `${d.aboutEEAT.signals} signals, ${d.aboutEEAT.pillarLinks} pillar links`]
    ];
    for (const [label, value] of detailLines) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        console.log(`  ${label}:`);
        value.slice(0, 15).forEach(v => console.log(`    - ${v}`));
        if (value.length > 15) console.log(`    … and ${value.length - 15} more`);
      } else {
        console.log(`  ${label}: ${value}`);
      }
    }
    console.log('');
    if (r.passing < r.total) process.exitCode = 1;
  }
}
