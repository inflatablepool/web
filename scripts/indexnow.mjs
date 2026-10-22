// IndexNow ping (audit item 19). Reads the published key file from dist/ and
// submits the full URL list from sitemap-entity.xml (≤ 10,000 URLs per call).
// Run AFTER deploy so the URLs are live:
//   npm run indexnow
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const HOST = 'inflatablepoolfactory.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow/';
const MAX_URLS = 10000;

async function main() {
  const keyFile = existsSync(path.join(DIST, '579f6d8a1e2b4c7f9a3d5e8b0c2f4a6b.txt'))
    ? path.join(DIST, '579f6d8a1e2b4c7f9a3d5e8b0c2f4a6b.txt')
    : null;
  const keyDir = existsSync(path.join(ROOT, 'public'))
    ? readFileSync(path.join(ROOT, 'public', '579f6d8a1e2b4c7f9a3d5e8b0c2f4a6b.txt'), 'utf8')
    : null;
  const key = (keyFile ? readFileSync(keyFile, 'utf8') : (keyDir ?? '')).trim();
  if (!key) {
    console.error('[indexnow] key file not found — run after astro build');
    process.exit(1);
  }

  const entityXml = path.join(DIST, 'sitemap-entity.xml');
  if (!existsSync(entityXml)) {
    console.error('[indexnow] sitemap-entity.xml missing — run after astro build');
    process.exit(1);
  }
  const xml = readFileSync(entityXml, 'utf8');
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urlList.length > MAX_URLS) {
    console.warn(`[indexnow] ${urlList.length} URLs — truncating to ${MAX_URLS}`);
  }
  const payload = { host: HOST, key, urlList: urlList.slice(0, MAX_URLS) };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[indexnow] FAIL (${res.status}): ${body}`);
    process.exit(1);
  }
  console.log(`[indexnow] submitted ${payload.urlList.length} URLs (HTTP ${res.status})`);
}

main().catch((err) => {
  console.error('[indexnow] Failed:', err);
  process.exit(1);
});
