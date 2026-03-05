#!/usr/bin/env node
/**
 * Post-build SEO verification script.
 * Run automatically via "postbuild" in each site's package.json.
 * Reads dist/ relative to process.cwd().
 * Exits 1 if any SEO issues are found.
 */

import fs from 'fs';
import path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const siteDir = process.cwd();
const distDir = path.join(siteDir, 'dist');

if (!fs.existsSync(distDir)) {
  console.error('ERROR: dist/ directory not found. Run npm run build first.');
  process.exit(1);
}

// Detect siteUrl from astro.config.mjs
const configPath = path.join(siteDir, 'astro.config.mjs');
let siteUrl = '';
if (fs.existsSync(configPath)) {
  const configText = fs.readFileSync(configPath, 'utf8');
  const match = configText.match(/site:\s*['"]([^'"]+)['"]/);
  if (match) siteUrl = match[1].replace(/\/$/, '');
}
if (!siteUrl) {
  console.error('ERROR: Could not detect site URL from astro.config.mjs');
  process.exit(1);
}

console.log(`\nSEO verification — ${siteUrl}`);
console.log(`Dist: ${distDir}\n`);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtml(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function filePathToPagePath(filePath) {
  const rel = path.relative(distDir, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  // dist/about/index.html → /about/
  // dist/blog/post.html → /blog/post/
  if (rel.endsWith('/index.html')) {
    return '/' + rel.slice(0, -'/index.html'.length) + '/';
  }
  return '/' + rel.slice(0, -'.html'.length) + '/';
}

function normalizeInternalHref(href, siteUrl) {
  if (!href) return null;
  // Skip non-page hrefs
  if (href.startsWith('#') || href.startsWith('mailto:') ||
      href.startsWith('tel:') || href.startsWith('javascript:')) return null;

  let p = href;

  // Absolute URL on same domain
  if (p.startsWith('http://') || p.startsWith('https://')) {
    if (!p.startsWith(siteUrl)) return null;
    p = p.slice(siteUrl.length);
  }

  // Must be root-relative now
  if (!p.startsWith('/')) return null;

  // Strip query and hash
  p = p.split('?')[0].split('#')[0];

  // Ensure trailing slash (unless it has a file extension)
  if (!p.endsWith('/') && !path.extname(p)) p += '/';

  return p || '/';
}

// ─── Parse sitemaps ───────────────────────────────────────────────────────────

function parseSitemapPaths(siteUrl) {
  const sitemapPaths = new Set();
  const indexPath = path.join(distDir, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) return sitemapPaths;

  const indexXml = fs.readFileSync(indexPath, 'utf8');
  const subUrls = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

  for (const subUrl of subUrls) {
    // Convert URL to local file path
    let subFile = subUrl;
    if (subFile.startsWith(siteUrl)) {
      subFile = subFile.slice(siteUrl.length);
    }
    // Strip leading slash → relative path in dist/
    const localPath = path.join(distDir, subFile.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) continue;

    const subXml = fs.readFileSync(localPath, 'utf8');
    for (const m of subXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = m[1].trim();
      if (url.startsWith(siteUrl)) {
        let p = url.slice(siteUrl.length);
        if (!p.endsWith('/')) p += '/';
        if (!p.startsWith('/')) p = '/' + p;
        sitemapPaths.add(p);
      }
    }
  }

  return sitemapPaths;
}

// ─── Build link graph ─────────────────────────────────────────────────────────

function buildLinkGraph(htmlFiles, siteUrl) {
  const inboundLinks = new Map();  // path → Set of paths that link TO it
  const outboundLinks = new Map(); // path → Set of paths it links TO

  for (const file of htmlFiles) {
    const pagePath = filePathToPagePath(file);
    const html = fs.readFileSync(file, 'utf8');

    if (!outboundLinks.has(pagePath)) outboundLinks.set(pagePath, new Set());
    if (!inboundLinks.has(pagePath)) inboundLinks.set(pagePath, new Set());

    for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
      const normalized = normalizeInternalHref(m[1], siteUrl);
      if (!normalized || normalized === pagePath) continue; // skip self-links

      outboundLinks.get(pagePath).add(normalized);

      if (!inboundLinks.has(normalized)) inboundLinks.set(normalized, new Set());
      inboundLinks.get(normalized).add(pagePath);
    }
  }

  return { inboundLinks, outboundLinks };
}

// ─── Checks ───────────────────────────────────────────────────────────────────

function checkPage(filePath, pagePath, siteUrl, sitemapPaths, inboundLinks, outboundLinks, htmlPageSet) {
  const html = fs.readFileSync(filePath, 'utf8');
  const failures = [];

  // 1. Sitemap presence
  if (!sitemapPaths.has(pagePath)) {
    failures.push('Not in sitemap');
  }

  // 2. Canonical tag
  const canonicalTagMatch = html.match(/<link\s[^>]*\brel=["']canonical["'][^>]*/i);
  if (!canonicalTagMatch) {
    failures.push('Missing canonical tag');
  } else {
    const hrefMatch = canonicalTagMatch[0].match(/\bhref=["']([^"']+)["']/);
    const expected = siteUrl + pagePath;
    if (!hrefMatch) {
      failures.push('Canonical tag has no href');
    } else if (hrefMatch[1].replace(/\/$/, '') + '/' !== pagePath.replace(/\/$/, '') + '/' ||
               !hrefMatch[1].startsWith(siteUrl)) {
      // Normalise both to compare
      const actualNorm = hrefMatch[1].replace(/\/$/, '');
      const expectedNorm = expected.replace(/\/$/, '');
      if (actualNorm !== expectedNorm) {
        failures.push(`Canonical mismatch: expected ${expected}, got ${hrefMatch[1]}`);
      }
    }
  }

  // 3. Exactly 1 H1
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 0) {
    failures.push('Missing H1');
  } else if (h1Count > 1) {
    failures.push(`Multiple H1 tags (${h1Count})`);
  }

  // 4. Meta description
  if (!/<meta\s[^>]*\bname=["']description["']/i.test(html)) {
    failures.push('Missing meta description');
  }

  // 5. Inbound links ≥ 2 (homepage exempt — nothing links "to" it by path)
  if (pagePath !== '/') {
    const inbound = inboundLinks.get(pagePath);
    const inboundCount = inbound ? inbound.size : 0;
    if (inboundCount < 2) {
      failures.push(`Insufficient inbound internal links (${inboundCount}, need ≥ 2)`);
    }
  }

  // 6. Outbound internal link ≥ 1
  const outbound = outboundLinks.get(pagePath);
  const validOutbound = outbound
    ? [...outbound].filter(p => htmlPageSet.has(p)).length
    : 0;
  if (validOutbound < 1) {
    failures.push('No outbound internal links to existing pages');
  }

  return failures;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const allHtmlFiles = walkHtml(distDir).filter(f => !f.endsWith('404.html'));
const sitemapPaths = parseSitemapPaths(siteUrl);
const { inboundLinks, outboundLinks } = buildLinkGraph(allHtmlFiles, siteUrl);

// Set of all known page paths (for outbound validation)
const htmlPageSet = new Set(allHtmlFiles.map(filePathToPagePath));

const pageFailures = [];
let skippedCount = 0;

const noindexRe = [
  /<meta\s[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i,
  /<meta\s[^>]*\bcontent=["'][^"']*noindex[^"']*["'][^>]*\bname=["']robots["']/i,
];

for (const file of allHtmlFiles) {
  const pagePath = filePathToPagePath(file);
  const html = fs.readFileSync(file, 'utf8');

  // Skip intentionally noindexed pages — SEO checks don't apply to them
  if (noindexRe.some(re => re.test(html))) {
    skippedCount++;
    continue;
  }

  const failures = checkPage(file, pagePath, siteUrl, sitemapPaths, inboundLinks, outboundLinks, htmlPageSet);
  if (failures.length > 0) {
    pageFailures.push({ page: siteUrl + pagePath, failures });
  }
}

const checkedCount = allHtmlFiles.length - skippedCount;

if (pageFailures.length > 0) {
  console.error(`SEO VERIFICATION FAILED — ${pageFailures.length} page(s) have issues:\n`);
  for (const { page, failures } of pageFailures) {
    console.error(`  ${page}`);
    for (const f of failures) {
      console.error(`    • ${f}`);
    }
    console.error('');
  }
  if (skippedCount > 0) console.error(`(${skippedCount} noindexed page(s) skipped)`);
  process.exit(1);
} else {
  const skippedNote = skippedCount > 0 ? `, ${skippedCount} noindexed skipped` : '';
  console.log(`SEO verification passed — ${checkedCount} pages checked${skippedNote}`);
}
