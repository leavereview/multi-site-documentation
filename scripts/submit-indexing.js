#!/usr/bin/env node

/**
 * submit-indexing.js
 *
 * Batch-submits URLs to the Google Indexing API (type: URL_UPDATED).
 * Reads the URL list from scripts/urls-to-index.json, logs per-URL status,
 * and enforces the 200-requests/day quota with a persisted daily counter
 * (scripts/.indexing-quota.json).
 *
 * Zero dependencies — signs the service-account JWT with node:crypto.
 * (A googleapis-based variant also exists at tools/gsc-client/src/request-indexing.js.)
 *
 * Usage:
 *   GOOGLE_INDEXING_SA_PATH=/path/to/service-account.json node scripts/submit-indexing.js
 *
 * One-time manual setup (REQUIRED — this script cannot do it for you):
 *   1. In Google Cloud Console, create a service account and download its JSON key.
 *   2. Enable the "Web Search Indexing API" for that Cloud project.
 *   3. In Google Search Console, add the service account's client_email as a
 *      verified OWNER of the property (Settings → Users and permissions).
 *      "Full" user is not enough — it must be Owner.
 *   4. Point GOOGLE_INDEXING_SA_PATH at the downloaded JSON key file.
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createSign } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URLS_FILE = resolve(__dirname, 'urls-to-index.json');
const QUOTA_FILE = resolve(__dirname, '.indexing-quota.json');
const DAILY_QUOTA = 200;

// ── credentials ───────────────────────────────────────────────────────────────

const saPath = process.env.GOOGLE_INDEXING_SA_PATH;
if (!saPath) {
  console.error(
    'ERROR: GOOGLE_INDEXING_SA_PATH is not set.\n\n' +
    'Point it at a Google service-account JSON key file, e.g.:\n' +
    '  GOOGLE_INDEXING_SA_PATH=~/keys/indexing-sa.json node scripts/submit-indexing.js\n\n' +
    'See the header of this script for the one-time setup steps\n' +
    '(create service account, enable Indexing API, add SA email as GSC Owner).'
  );
  process.exit(1);
}
if (!existsSync(saPath)) {
  console.error(`ERROR: service-account file not found at: ${saPath}`);
  process.exit(1);
}

// ── OAuth2 token via signed JWT (no dependencies) ─────────────────────────────

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(claims)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = signer.sign(credentials.private_key, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ── daily quota counter ───────────────────────────────────────────────────────

async function loadQuota() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const q = JSON.parse(await readFile(QUOTA_FILE, 'utf8'));
    if (q.date === today) return q;
  } catch { /* first run or corrupt file — start fresh */ }
  return { date: today, used: 0 };
}

async function saveQuota(quota) {
  await writeFile(QUOTA_FILE, JSON.stringify(quota, null, 2));
}

// ── main ──────────────────────────────────────────────────────────────────────

const credentials = JSON.parse(await readFile(saPath, 'utf8'));
const { urls } = JSON.parse(await readFile(URLS_FILE, 'utf8'));
const quota = await loadQuota();

console.log(`Submitting ${urls.length} URLs (quota used today: ${quota.used}/${DAILY_QUOTA})\n`);

const token = await getAccessToken(credentials);
let ok = 0, failed = 0;

for (const url of urls) {
  if (quota.used >= DAILY_QUOTA) {
    console.warn(`QUOTA REACHED (${DAILY_QUOTA}/day) — stopping. Remaining URLs not submitted.`);
    break;
  }
  try {
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    });
    quota.used++;
    const body = await res.json();
    if (res.ok) {
      ok++;
      console.log(`  OK    ${url}`);
    } else {
      failed++;
      console.error(`  FAIL  ${url} — ${res.status}: ${body.error?.message ?? JSON.stringify(body)}`);
    }
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${url} — ${err.message}`);
  }
  await saveQuota(quota);
}

console.log(`\nDone. ${ok} submitted, ${failed} failed, ${quota.used}/${DAILY_QUOTA} quota used today.`);
process.exit(failed > 0 ? 1 : 0);
