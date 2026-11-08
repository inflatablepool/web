/**
 * audit-meta-dist.cjs — head/meta quality gate over every sitemap page in
 * dist: titles, descriptions, H1s, JSON-LD parse errors, img alt coverage,
 * and cross-locale duplicate titles within the same resource path.
 */
const fs = require('node:fs');
const path = require('node:path');
const dist = process.argv[2] || 'dist';

const sitemaps = fs.readdirSync(dist).filter((f) => /^sitemap-.*\.xml$/.test(f) && f !== 'sitemap-index.xml');
const urls = new Set();
for (const sm of sitemaps) {
  const xml = fs.readFileSync(path.join(dist, sm), 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = new URL(m[1]);
    urls.add(u.pathname.endsWith('/') ? u.pathname : u.pathname + '/');
  }
}

const stats = { titleMissing: 0, titleLong: 0, descMissing: 0, descLong: 0, h1Zero: 0, h1Multi: 0, ldError: 0, imgNoAlt: 0 };
const dupTitles = new Map();
const problems = [];

for (const p of urls) {
  const file = path.join(dist, decodeURIComponent(p).replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) {
    problems.push(['missing file', p]);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const title = (head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const desc = (head.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1] || '';
  if (!title.trim()) stats.titleMissing++;
  if (title.length > 100) {
    stats.titleLong++;
    problems.push([`title ${title.length}`, p]);
  }
  if (!desc.trim()) stats.descMissing++;
  if (desc.length > 165) {
    stats.descLong++;
    problems.push([`desc ${desc.length}`, p]);
  }
  const h1 = (html.match(/<h1\b/gi) || []).length;
  if (h1 === 0) stats.h1Zero++;
  if (h1 > 1) stats.h1Multi++;
  // Inline runtime scripts build <img> strings (e.g. search results with
  // decorative alt=""); strip script/style bodies before counting images,
  // but keep them for the ld+json parse check below.
  const imgScope = html.replace(/<script\b(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
  for (const b of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(b[1]);
    } catch {
      stats.ldError++;
      problems.push(['ld+json parse error', p]);
    }
  }
  for (const m of imgScope.matchAll(/<img\b[^>]*>/gi)) {
    if (/<img\b[^>]*\salt=""/.test(m[0]) || !/\salt="/.test(m[0])) {
      stats.imgNoAlt++;
      problems.push(['img without alt', p, m[0].slice(0, 100)]);
    }
  }
  const dup = title.replace(/\u2014[^|]*$/, '').trim();
  if (!dupTitles.has(dup)) dupTitles.set(dup, []);
  dupTitles.get(dup).push(p);
}

const dupes = [...dupTitles.entries()].filter(([, v]) => v.length > 1);
console.log(
  JSON.stringify({
    ...stats,
    pages: urls.size,
    dupTitleGroups: dupes.length,
  })
);
for (const [t, list] of dupes) problems.push([`"${t}" x${list.length}`, list.join(', ')]);
for (const pr of problems.slice(0, 40)) console.log(' ', pr.join(' | '));
