#!/usr/bin/env node
// Nightly live check of the four marketing sites (agentbox roadmap WS5). It runs from
// .github/workflows/site-monitor.yml. deploy.sh already proves live == fresh build at deploy time;
// this catches what happens between deploys, and what a deploy alone can't see:
//   - every sitemap URL answers 200 directly (no redirect), self-canonical, not noindex
//     (the petcare lesson: 48/55 pages unknown to Google because of sitemap/indexing faults);
//   - every same-site link on those pages resolves (<400 after redirects);
//   - the sitemap didn't shrink by more than 20% since last night (a stale dist/ or a bad deploy).
// No dependencies (Node 22 fetch + regex), so CI needs no npm install.
//
//   node tools/site-monitor/check-live.mjs --out report.md --counts counts.json [--prev prev.json] <domain>...
// Exit 1 if any site has a problem.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const parseLocs = (xml) => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);

const norm = (u) => {
  const x = new URL(u);
  x.hash = '';
  let s = x.toString();
  if (s.endsWith('/') && x.pathname !== '/') s = s.slice(0, -1);
  return s.replace(/\/$/, '');
};
export const sameUrl = (a, b) => norm(a) === norm(b);

const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];

export function pageFindings(url, status, html, location) {
  if (status >= 300 && status < 400) return [`redirects to ${location ?? '?'} (sitemap URLs must answer 200 directly)`];
  if (status !== 200) return [`HTTP ${status}`];
  const out = [];
  const canonTag = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => /rel\s*=\s*["']canonical["']/i.test(t));
  const canon = canonTag && attr(canonTag, 'href');
  if (!canon) out.push('no canonical');
  else if (!sameUrl(new URL(canon, url).toString(), url)) out.push(`canonical points to ${canon}`);
  const robots = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((t) => /name\s*=\s*["']robots["']/i.test(t));
  if (robots && /noindex/i.test(attr(robots, 'content') ?? '')) out.push('noindex');
  return out;
}

export function extractInternalLinks(html, pageUrl) {
  const host = new URL(pageUrl).host;
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const href = m[1].trim();
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    let u;
    try { u = new URL(href, pageUrl); } catch { continue; }
    if (u.host !== host || !/^https?:$/.test(u.protocol) || u.pathname.startsWith('/cdn-cgi/')) continue;
    u.hash = '';
    out.add(u.toString());
  }
  return [...out];
}

export function compareCounts(prev, now) {
  if (prev === undefined || prev === null) return { change: null, failed: false };
  return { change: now - prev, failed: prev > 0 && (prev - now) / prev > 0.2 };
}

export function renderReport(sites) {
  const lines = ['| Site | Sitemap URLs | Change since last night | Links checked | Status |', '|---|---|---|---|---|'];
  for (const s of sites) {
    const change = s.change === null || s.change === undefined ? 'first run' : s.change === 0 ? '0' : (s.change > 0 ? `+${s.change}` : `${s.change}`);
    lines.push(`| ${s.domain} | ${s.urls} | ${change} | ${s.linksChecked} | ${s.problems.length ? `❌ ${s.problems.length} problem(s)` : '✅'} |`);
  }
  for (const s of sites.filter((x) => x.problems.length)) {
    lines.push('', `### ${s.domain}`, '', ...s.problems.slice(0, 50).map((p) => `- ${p}`));
    if (s.problems.length > 50) lines.push(`- …and ${s.problems.length - 50} more`);
  }
  return `${lines.join('\n')}\n`;
}

const UA = { 'user-agent': 'leavereview-site-monitor (+multi-site-documentation/.github/workflows/site-monitor.yml)' };
async function get(url, redirect = 'manual') {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect, headers: UA, signal: AbortSignal.timeout(20_000) });
      return { status: res.status, location: res.headers.get('location') ?? undefined, text: await res.text() };
    } catch (e) {
      if (attempt >= 2) return { status: 0, location: undefined, text: '', error: e instanceof Error ? e.message : String(e) };
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

async function checkSite(domain, prev) {
  const problems = [];
  const sm = await get(`https://${domain}/sitemap-0.xml`, 'follow');
  const urls = sm.status === 200 ? parseLocs(sm.text) : [];
  if (sm.status !== 200) problems.push(`sitemap-0.xml: HTTP ${sm.status}${sm.error ? ` (${sm.error})` : ''}`);
  else if (urls.length === 0) problems.push('sitemap-0.xml has no <loc> entries');
  const { change, failed } = compareCounts(prev, urls.length);
  if (failed) problems.push(`sitemap shrank from ${prev} to ${urls.length} URLs (>20%): stale dist/ or a bad deploy?`);

  const links = new Set();
  await pool(urls, 4, async (u) => {
    const r = await get(u);
    for (const f of pageFindings(u, r.status, r.text, r.location)) problems.push(`${u}: ${f}${r.error ? ` (${r.error})` : ''}`);
    if (r.status === 200) for (const l of extractInternalLinks(r.text, u)) links.add(l);
  });
  const sitemapSet = new Set(urls.map(norm));
  const toCheck = [...links].filter((l) => !sitemapSet.has(norm(l))).slice(0, 500);
  await pool(toCheck, 6, async (l) => {
    const r = await get(l, 'follow');
    if (!(r.status >= 200 && r.status < 400)) problems.push(`broken internal link ${l}: HTTP ${r.status}${r.error ? ` (${r.error})` : ''}`);
  });
  return { domain, urls: urls.length, change, problems, linksChecked: toCheck.length + urls.length };
}

function arg(name) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; }

async function main() {
  const domains = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--'));
  let prev = {};
  try { prev = JSON.parse(readFileSync(arg('--prev') ?? '', 'utf8')); } catch { prev = {}; }
  const sites = [];
  for (const d of domains) sites.push(await checkSite(d, prev[d]));
  const md = renderReport(sites);
  if (arg('--out')) writeFileSync(arg('--out'), md);
  if (arg('--counts')) writeFileSync(arg('--counts'), JSON.stringify(Object.fromEntries(sites.map((s) => [s.domain, s.urls]))));
  console.log(md);
  process.exit(sites.some((s) => s.problems.length) ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
