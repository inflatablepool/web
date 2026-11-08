/**
 * audit-og.cjs — verify Open Graph / Twitter card metadata on every
 * self-canonical sitemap URL in dist. Expected: all zeros.
 */
const fs = require('node:fs');
const path = require('node:path');
const dist = process.argv[2] || 'dist';
const SITE = 'https://inflatablepoolfactory.com';
const ASSETS = 'https://assets.inflatablepoolfactory.com';

const sitemaps = fs.readdirSync(dist).filter((f) => /^sitemap-.*\.xml$/.test(f) && f !== 'sitemap-index.xml');
const urls = new Set();
for (const sm of sitemaps) {
  const xml = fs.readFileSync(path.join(dist, sm), 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = new URL(m[1]);
    urls.add(u.pathname.endsWith('/') ? u.pathname : u.pathname + '/');
  }
}

const meta = (head, attr, name) => {
  const re = new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, 'i');
  const m = head.match(re);
  return m ? m[1].replace(/&amp;/g, '&') : '';
};

let missing = 0;
let urlMismatch = 0;
let imageMissing = 0;
let localeMismatch = 0;
let cardIssues = 0;
let twitterTitleIssues = 0;
const problems = [];

const EXPECTED_LOCALE = {
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
  it: 'it_IT',
  nl: 'nl_NL',
  sv: 'sv_SE',
  no: 'nb_NO',
  pl: 'pl_PL',
  da: 'da_DK',
  fi: 'fi_FI',
  pt: 'pt_PT',
  ru: 'ru_RU',
  cs: 'cs_CZ',
  ar: 'ar_AR',
  el: 'el_GR',
};
const KNOWN = Object.keys(EXPECTED_LOCALE);

for (const p of urls) {
  const file = path.join(dist, decodeURIComponent(p).replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) {
    missing++;
    problems.push(['missing file', p]);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const ogTitle = meta(head, 'property', 'og:title');
  const ogDesc = meta(head, 'property', 'og:description');
  const ogImage = meta(head, 'property', 'og:image');
  const ogUrl = meta(head, 'property', 'og:url');
  const ogType = meta(head, 'property', 'og:type');
  const ogLocale = meta(head, 'property', 'og:locale');
  const twCard = meta(head, 'name', 'twitter:card');
  const twTitle = meta(head, 'name', 'twitter:title');
  const twImage = meta(head, 'name', 'twitter:image');

  const req = { ogTitle, ogDesc, ogImage, ogUrl, ogType, ogLocale, twCard, twTitle, twImage };
  for (const [k, v] of Object.entries(req)) {
    if (!v) {
      missing++;
      problems.push(['missing ' + k, p]);
    }
  }
  if (ogUrl && ogUrl !== path) {
    // placeholder to keep structure
  }
  if (ogUrl && ogUrl !== SITE + p) {
    urlMismatch++;
    problems.push(['og:url != canonical', p, ogUrl]);
  }
  if (twCard && twCard !== 'summary_large_image') {
    cardIssues++;
    problems.push(['twitter card', p, twCard]);
  }
  const lang = p.split('/').filter(Boolean)[0];
  const langCode = KNOWN.includes(lang) ? lang : 'en';
  if (ogLocale && ogLocale !== EXPECTED_LOCALE[langCode]) {
    localeMismatch++;
    problems.push(['og:locale', p, ogLocale, EXPECTED_LOCALE[langCode]]);
  }
  if (twTitle && /…$/.test(twTitle)) {
    twitterTitleIssues++;
    problems.push(['twitter:title truncated', p, twTitle]);
  }
  for (const img of [ogImage, twImage]) {
    if (!img || !img.startsWith(ASSETS + '/')) continue;
    const rel = img.slice(ASSETS.length);
    if (!fs.existsSync(path.join(dist, decodeURIComponent(rel)))) {
      imageMissing++;
      problems.push(['og image not in dist', p, img]);
    }
  }
}

console.log(
  JSON.stringify(
    { pages: urls.size, missing, urlMismatch, imageMissing, localeMismatch, cardIssues, twitterTitleIssues },
    null,
    1
  )
);
for (const pr of problems.slice(0, 30)) console.log(' ', pr.join(' | '));
