// Post-build deep link integrity audit:
//   1. Every internal href/src/poster target in built HTML must resolve to a
//      file in dist/ or to a live Cloudflare Worker route. The worker allowlist
//      is derived from workers/*/wrangler.toml, so route changes stay in sync.
//   2. hreflang alternates resolve (same rules).
//   3. Inline JSON-LD blocks parse.
//   4. Regression guards: /en/news and /en/downloads must never be referenced —
//      EN is served at the root, the news worker has no /en route, and the
//      downloads folder does not exist (fixed in 0f52a29).
// Inline <script> bodies are skipped: href/src found there are JS template
// strings, not real links. Non-self canonicals are info-only (redirect and
// mirror pages are expected). Exit code 1 on any hard violation.
// Usage: npm run build && npm run check:links
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const FORBIDDEN = [/^\/en\/news(\/|$)/, /^\/en\/downloads(\/|$)/];
const ATTR_RE = /(?:href|src|poster)="([^"]*)"/g;
const ASSET_RE = /\.(css|js|mjs|json|xml|txt|webp|png|jpg|jpeg|svg|gif|ico|avif|woff2?|ttf|mp4|webm|pdf)([#?]|$)/i;

function loadWorkerRoutes() {
  const workersDir = path.join(ROOT, 'workers');
  const exact = new Set();
  const prefixes = [];
  for (const entry of readdirSync(workersDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const toml = path.join(workersDir, entry.name, 'wrangler.toml');
    if (!existsSync(toml)) continue;
    const txt = readFileSync(toml, 'utf8');
    for (const m of txt.matchAll(/pattern\s*=\s*"Inflatable Pool Factory\.com(\/[^"]*?)(\*)?"/g)) {
      if (m[2]) prefixes.push(m[1]);
      else exact.add(m[1]);
    }
  }
  if (exact.size === 0 && prefixes.length === 0) {
    console.error(
      '[audit-links] no worker routes found in workers/*/wrangler.toml — refusing to audit with an empty allowlist'
    );
    process.exit(1);
  }
  return { exact, prefixes };
}

function listHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...listHtmlFiles(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

function main() {
  if (!existsSync(DIST)) {
    console.error('[audit-links] dist/ not found — run after npm run build');
    process.exit(1);
  }
  const { exact, prefixes } = loadWorkerRoutes();
  const isWorkerRoute = (p) => {
    const c = p.replace(/[#?].*$/, '');
    if (exact.has(c)) return true;
    return prefixes.some((pre) => c === pre || c.startsWith(pre));
  };

  const pages = listHtmlFiles(DIST);
  const existsCache = new Map();
  const targetExists = (urlPath) => {
    if (existsCache.has(urlPath)) return existsCache.get(urlPath);
    const clean = urlPath.replace(/[#?].*$/, '');
    let ok;
    if (clean === '' || clean === '/') ok = existsSync(path.join(DIST, 'index.html'));
    else {
      const noSlash = clean.endsWith('/') ? clean.slice(0, -1) : clean;
      ok =
        existsSync(path.join(DIST, noSlash, 'index.html')) ||
        existsSync(path.join(DIST, noSlash + '.html')) ||
        existsSync(path.join(DIST, clean));
    }
    existsCache.set(urlPath, ok);
    return ok;
  };

  const brokenLinks = [];
  const brokenAssets = [];
  const brokenHreflang = [];
  const jsonldFail = [];
  const nonSelfCanonical = [];
  const forbiddenRefs = [];
  let totalRefs = 0;
  let internalRefs = 0;
  let assetRefs = 0;
  let jsonldBlocks = 0;
  let hreflangRefs = 0;
  let dynamicRefs = 0;
  const brokenTargetCount = new Map();

  for (const page of pages) {
    let t;
    try {
      t = readFileSync(page, 'utf8');
    } catch {
      continue;
    }

    // JSON-LD parse
    const jlRe = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    let jm;
    while ((jm = jlRe.exec(t)) !== null) {
      jsonldBlocks++;
      try {
        JSON.parse(jm[1]);
      } catch (e) {
        if (jsonldFail.length < 30) jsonldFail.push(`${page} :: ${e.message.slice(0, 80)}`);
      }
    }

    // canonical (info-only — redirect/mirror pages are expected)
    const cm = t.match(/<link rel="canonical" href="([^"]*)"/);
    if (cm) {
      const self = cm[1]
        .replace(/[#?].*$/, '')
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/\/$/, '');
      const rel = page
        .slice(DIST.length + 1)
        .replace(/\\/g, '/')
        .replace(/index\.html$/, '')
        .replace(/\.html$/, '');
      const selfNorm = (self + '/').replace(/\/\/+/g, '/');
      const pageNorm = rel === '' ? '/' : '/' + rel;
      if (selfNorm !== pageNorm && selfNorm !== '/' + rel) {
        if (nonSelfCanonical.length < 30) nonSelfCanonical.push(`${page} -> ${cm[1]}`);
      }
    }

    // hreflang alternates
    const hlRe = /<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g;
    let hm;
    while ((hm = hlRe.exec(t)) !== null) {
      hreflangRefs++;
      const href = hm[2];
      if (/^https?:\/\/(www\.)?Inflatable Pool Factory\.com\//.test(href) || href.startsWith('/')) {
        const p = href.replace(/^https?:\/\/[^/]+/, '');
        if (!targetExists(p) && !isWorkerRoute(p)) brokenHreflang.push(`${page} [${hm[1]}] -> ${href}`);
      }
    }

    // strip inline scripts: href/src inside <script> are JS template strings
    const html = t.replace(/<script[\s\S]*?<\/script>/g, '');

    ATTR_RE.lastIndex = 0;
    let m;
    while ((m = ATTR_RE.exec(html)) !== null) {
      const raw = m[1];
      totalRefs++;
      if (!raw || raw.startsWith('#') || /^(mailto|tel|javascript|data|sms|whatsapp):/i.test(raw)) continue;
      let p = raw;
      if (/^https?:\/\//i.test(raw)) {
        if (!/^https?:\/\/(www\.)?Inflatable Pool Factory\.com\//i.test(raw)) continue; // external
        p = raw.replace(/^https?:\/\/(www\.)?Inflatable Pool Factory\.com/i, '');
      } else if (raw.startsWith('//')) continue;
      else if (!raw.startsWith('/')) continue; // relative — astro emits absolute; skip noise
      internalRefs++;
      const clean = p.replace(/[#?].*$/, '');
      if (FORBIDDEN.some((re) => re.test(clean))) {
        forbiddenRefs.push(`${page} -> ${raw}`);
        continue;
      }
      const isAsset = ASSET_RE.test(p);
      if (isAsset) assetRefs++;
      if (!targetExists(p)) {
        if (isWorkerRoute(p)) {
          dynamicRefs++;
          continue;
        }
        (isAsset ? brokenAssets : brokenLinks).push(`${page} -> ${raw}`);
        const k = raw.replace(/[#?].*$/, '');
        brokenTargetCount.set(k, (brokenTargetCount.get(k) || 0) + 1);
      }
    }
  }

  console.log(`[audit-links] pages: ${pages.length}`);
  console.log(
    `[audit-links] refs total=${totalRefs} internal=${internalRefs} (assets=${assetRefs}) hreflang=${hreflangRefs} jsonld=${jsonldBlocks} worker/api=${dynamicRefs}`
  );
  console.log(`\n=== BROKEN LINKS: ${brokenLinks.length}`);
  brokenLinks.slice(0, 40).forEach((l) => console.log('  ' + l));
  console.log(`\n=== BROKEN ASSETS: ${brokenAssets.length}`);
  brokenAssets.slice(0, 40).forEach((l) => console.log('  ' + l));
  console.log(`\n=== FORBIDDEN TARGETS (/en/news, /en/downloads): ${forbiddenRefs.length}`);
  forbiddenRefs.slice(0, 30).forEach((l) => console.log('  ' + l));
  console.log(`\n=== BROKEN HREFLANG: ${brokenHreflang.length}`);
  brokenHreflang.slice(0, 30).forEach((l) => console.log('  ' + l));
  console.log(`\n=== JSON-LD FAIL: ${jsonldFail.length}`);
  jsonldFail.forEach((l) => console.log('  ' + l));
  console.log(
    `\n=== NON-SELF CANONICAL (sample ${Math.min(nonSelfCanonical.length, 30)}, info-only): ${nonSelfCanonical.length}`
  );
  nonSelfCanonical.slice(0, 30).forEach((l) => console.log('  ' + l));
  console.log(`\n=== TOP BROKEN TARGETS:`);
  [...brokenTargetCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .forEach(([k, v]) => console.log(`  ${v}x  ${k}`));

  const failed =
    brokenLinks.length + brokenAssets.length + forbiddenRefs.length + brokenHreflang.length + jsonldFail.length;
  console.log(`\n[audit-links] RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${failed} real issues)`);
  if (failed > 0) process.exit(1);
}

main();
