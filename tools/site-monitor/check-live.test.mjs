// Tests for tools/site-monitor/check-live.mjs. Run: node --test tools/site-monitor/
// Pure functions only: no network. The nightly workflow (.github/workflows/site-monitor.yml)
// runs the CLI against the four live sites.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareCounts, extractInternalLinks, pageFindings, parseLocs, renderReport, sameUrl } from './check-live.mjs';

test('parseLocs reads every <loc>, trimmed, in order', () => {
  const xml = `<urlset><url><loc> https://a.com/ </loc></url><url><loc>https://a.com/b/</loc></url></urlset>`;
  assert.deepEqual(parseLocs(xml), ['https://a.com/', 'https://a.com/b/']);
  assert.deepEqual(parseLocs('<html>not a sitemap</html>'), []);
});

test('sameUrl ignores a trailing slash and a fragment, nothing else', () => {
  assert.ok(sameUrl('https://a.com/blog/x/', 'https://a.com/blog/x'));
  assert.ok(sameUrl('https://a.com/', 'https://a.com'));
  assert.ok(!sameUrl('https://a.com/blog/x', 'https://a.com/blog/y'));
  assert.ok(!sameUrl('https://a.com/x', 'http://a.com/x'));
});

test('pageFindings: a healthy page has none', () => {
  const html = '<head><link rel="canonical" href="https://a.com/x/"><meta name="robots" content="index,follow"></head>';
  assert.deepEqual(pageFindings('https://a.com/x/', 200, html), []);
});

test('pageFindings flags non-200, a redirect, missing/foreign canonical and noindex', () => {
  assert.match(pageFindings('https://a.com/x/', 404, '').join(), /HTTP 404/);
  assert.match(pageFindings('https://a.com/x/', 301, '', 'https://a.com/y/').join(), /redirects to https:\/\/a\.com\/y\//);
  assert.match(pageFindings('https://a.com/x/', 200, '<head></head>').join(), /no canonical/);
  assert.match(pageFindings('https://a.com/x/', 200, '<link href="https://a.com/z/" rel="canonical">').join(), /canonical points to https:\/\/a\.com\/z\//);
  assert.match(pageFindings('https://a.com/x/', 200, '<link rel="canonical" href="https://a.com/x/"><meta name="robots" content="noindex">').join(), /noindex/);
});

test('extractInternalLinks keeps same-host page links only, absolute and de-duplicated', () => {
  const html = `
    <a href="/pricing/">p</a><a href="https://a.com/pricing/#plans">p2</a><a href="blog/x/">rel</a>
    <a href="https://other.com/">ext</a><a href="mailto:x@a.com">m</a><a href="tel:1">t</a>
    <a href="#top">frag</a><a href="javascript:void(0)">js</a><a href="/cdn-cgi/l/email-protection">cf</a>`;
  assert.deepEqual(extractInternalLinks(html, 'https://a.com/features/').sort(), [
    'https://a.com/features/blog/x/',
    'https://a.com/pricing/',
  ]);
});

test('compareCounts: a >20% drop fails, growth and small drops only inform', () => {
  assert.deepEqual(compareCounts(100, 75), { change: -25, failed: true });
  assert.deepEqual(compareCounts(100, 85), { change: -15, failed: false });
  assert.deepEqual(compareCounts(100, 130), { change: 30, failed: false });
  assert.deepEqual(compareCounts(undefined, 40), { change: null, failed: false });
});

test('renderReport lists problems per site and says when a site is clean', () => {
  const md = renderReport([
    { domain: 'a.com', urls: 10, change: -1, problems: ['https://a.com/x/: HTTP 404'], linksChecked: 50 },
    { domain: 'b.com', urls: 5, change: 0, problems: [], linksChecked: 20 },
  ]);
  assert.match(md, /a\.com/);
  assert.match(md, /HTTP 404/);
  assert.match(md, /b\.com.*✅/);
});
