import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const BASE = 'https://inflatablepoolfactory.com';

const EXCLUDE_PREFIXES = ['/keystatic/', '/admin/', '/login/', '/register/', '/api/', '/404/', '/500/'];
const EXCLUDE_EXACT = new Set(['/brand/', '/v2/']);

// P0-1/P0-6：noindex 页不进任何 sitemap（由 03_apply_noindex 生成）
const EXCLUDE_CFG = JSON.parse(readFileSync(path.join(ROOT, 'src/config/sitemap-exclude.json'), 'utf8'));
const EXCLUDE_PATHS = new Set(EXCLUDE_CFG.paths.map((p) => normalizePath(p)));
const EXCLUDE_REGEX = EXCLUDE_CFG.regex.map((r) => new RegExp(r));

// 渲染层 noindex(seo-suppress) = 不进任何 sitemap：从同一来源派生，避免配置漂移
const SEO_CFG = JSON.parse(readFileSync(path.join(ROOT, 'src/config/seo-suppress.json'), 'utf8'));
const RENDER_NOINDEX_PATHS = new Set(SEO_CFG.paths.map((p) => normalizePath(p)));
const RENDER_NOINDEX_REGEX = SEO_CFG.regex.map((r) => new RegExp(r));
// P0-1：compare 只有 allowlist 内的 slug 可索引（与 astro.config sitemapFilter 一致）
const COMPARE_ALLOWLIST = new Set(SEO_CFG.compareAllowlist);
const COMPARE_REGEX = new RegExp(SEO_CFG.compareRegex);
const MIN_WORDS_TO_INDEX = SEO_CFG.minWordsToIndex ?? 400;

/** 与 05_ci_gate / 渲染侧同一口径：<main> 词数 + 渲染后的 noindex 状态 */
function distSeo(urlPath) {
  try {
    const html = readFileSync(path.join(DIST, urlPath.replace(/^\//, ''), 'index.html'), 'utf8');
    const robots = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0] ?? '';
    const noindex = /noindex/i.test(robots);
    const body = html.split('</head>')[1] || '';
    const text = body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || body;
    const clean = text
      .replace(/<(script|style|nav|header|footer|template|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { noindex, words: clean.split(/\s+/).filter(Boolean).length };
  } catch {
    return { noindex: false, words: Infinity };
  }
}

function normalizePath(p) {
  const clean = String(p)
    .replace(/^https?:\/\/[^/]+/, '')
    .split('?')[0];
  const t = '/' + clean.replace(/^\/+|\/+$/g, '');
  return t === '/' ? '/' : t + '/';
}

// P1-D：降级语言整体 noindex + 移出 sitemap/hreflang；hreflang alternates 只为背书语言输出（cs/sv/da/el/no/ru/nl/fi/pl/ar/pt 已毕业，清单见 TECH.md §16.4）
const LANGS = ['fr', 'de', 'es', 'it', 'cs', 'sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt'];

function hreflangLinks(urlPath, pages) {
  const m = /^\/([a-z]{2})\/(.*)$/.exec(urlPath);
  const base = m ? '/' + m[2] : urlPath;
  const exists = (q) => pages.includes(q);
  const links = [
    `\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE}${base}"/>`,
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${base}"/>`,
  ];
  for (const l of LANGS) {
    const variant = `/${l}${base}`;
    if (exists(variant)) links.push(`\n    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${variant}"/>`);
  }
  return links.join('');
}

function walk(dir, base, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walk(full, rel, out);
    } else if (entry.name === 'index.html') {
      let urlPath = rel.slice(0, -'index.html'.length);
      if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
      out.push(urlPath);
    }
  }
}

function collectPages() {
  const pages = [];
  walk(DIST, '', pages);
  const seen = new Set();
  const result = [];
  for (const p of pages) {
    if (EXCLUDE_PREFIXES.some((prefix) => p.startsWith(prefix))) continue;
    if (EXCLUDE_EXACT.has(p)) continue;
    if (EXCLUDE_PATHS.has(p)) continue;
    if (EXCLUDE_REGEX.some((re) => re.test(p))) continue;
    if (RENDER_NOINDEX_PATHS.has(p)) continue;
    if (RENDER_NOINDEX_REGEX.some((re) => re.test(p))) continue;
    const cm = COMPARE_REGEX.exec(p);
    if (cm && !COMPARE_ALLOWLIST.has(cm[1])) continue;
    const seo = distSeo(p);
    if (seo.noindex) continue; // 渲染侧已 noindex（显式/正则/词数任一来源）→ 不进 sitemap
    if (seo.words < MIN_WORDS_TO_INDEX) continue; // 词数兜底
    if (seen.has(p)) continue;
    seen.add(p);
    result.push(p);
  }
  return result.sort();
}

const TYPE_BY_PREFIX = [
  ['/products/', 'product'],
  ['/guides/', 'guide'],
  ['/compare/', 'compare'],
  ['/use-cases/', 'service'],
  ['/v2/', 'article'],
  ['/news/', 'article'],
  ['/llms/', 'reference'],
  ['/academy/', 'education'],
  ['/learn/', 'guide'],
  ['/faq', 'support'],
  ['/factory', 'service'],
  ['/about', 'brand'],
  ['/randdcenter', 'technology'],
  ['/technology', 'technology'],
  ['/safety', 'safety'],
  ['/media', 'media'],
  ['/gallery', 'media'],
  ['/solutions/', 'service'],
  ['/oem-odm-manufacturer', 'service'],
  ['/inflatable-pool-factory-story', 'brand'],
  ['/marine-industry', 'industry'],
  ['/contact', 'service'],
  ['/warranty', 'support'],
  ['/custom', 'service'],
];

const PRIORITY_BY_TYPE = {
  brand: '0.8',
  product: '0.8',
  guide: '0.7',
  compare: '0.7',
  service: '0.6',
  article: '0.5',
  education: '0.6',
  support: '0.5',
  safety: '0.7',
  technology: '0.7',
  media: '0.5',
  industry: '0.6',
  reference: '0.3',
};

function classify(urlPath) {
  for (const [prefix, type] of TYPE_BY_PREFIX) {
    if (urlPath.startsWith(prefix)) return { type, entity: urlPath.slice(prefix.length).replace(/\/$/, '') || 'index' };
  }
  return { type: 'page', entity: urlPath.replace(/^\/+/, '').replace(/\/$/, '') || 'index' };
}

function entityXml(pages) {
  const rows = [];
  for (const p of pages) {
    const { type, entity } = classify(p);
    rows.push(
      `  <url>\n    <loc>${BASE}${p}</loc>${hreflangLinks(p, pages)}\n    <x:entity>${entity}</x:entity>\n    <x:type>${type}</x:type>\n    <priority>${PRIORITY_BY_TYPE[type] || '0.5'}</priority>\n  </url>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:x="https://inflatablepoolfactory.com/geo" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}

function simpleXml(urls, changefreq, pages) {
  const rows = urls.map(
    (u) =>
      `  <url><loc>${BASE}${u}</loc>${hreflangLinks(u, pages)}<priority>0.5</priority><changefreq>${changefreq}</changefreq></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}

const AI_TOP_SECTIONS = [
  '/',
  '/about/',
  '/about/inflatable-pool-factory/',
  '/products/',
  '/faq/',
  '/academy/',
  '/factory/',
  '/technology/',
  '/safety/',
  '/news/',
  '/guides/',
  '/compare/',
  '/custom/',
  '/media/',
  '/contact/',
  '/size-guide/',
  '/randdcenter/',
  '/inflatable-pool-factory-story/',
  '/gallery/',
  '/warranty/',
  '/quality/',
  '/oem-odm-manufacturer/',
  '/engineering-perfection/',
  '/design-powerhouse/',
  '/engineering-team/',
  '/marine-industry/',
  '/solutions/by-industry/',
  '/solutions/by-use-case/',
  '/use-cases/search-and-rescue/',
  '/use-cases/disaster-relief/',
  '/use-cases/commercial-workboats/',
];

function main() {
  if (!existsSync(DIST)) {
    console.error('[sitemaps] dist/ not found 鈥?run after astro build');
    process.exit(1);
  }

  const pages = collectPages();
  const isEn = (p) => !/^\/[a-z]{2}\//.test(p);

  const entity = entityXml(pages);
  writeFileSync(path.join(DIST, 'sitemap-entity.xml'), entity);
  writeFileSync(path.join(PUBLIC, 'sitemap-entity.xml'), entity);

  const ai = AI_TOP_SECTIONS.filter((u) => pages.includes(u));
  const aiXml = simpleXml(ai, 'monthly', pages);
  writeFileSync(path.join(DIST, 'ai-sitemap.xml'), aiXml);
  writeFileSync(path.join(PUBLIC, 'ai-sitemap.xml'), aiXml);

  const knowledge = pages.filter(
    (p) =>
      isEn(p) &&
      (p.startsWith('/v2/') ||
        p.startsWith('/guides/') ||
        p.startsWith('/faq') ||
        p.startsWith('/academy/') ||
        p.startsWith('/learn/'))
  );
  const knowledgeXml = simpleXml(knowledge, 'monthly', pages);
  writeFileSync(path.join(DIST, 'knowledge-sitemap.xml'), knowledgeXml);
  writeFileSync(path.join(PUBLIC, 'knowledge-sitemap.xml'), knowledgeXml);

  const products = pages.filter((p) => isEn(p) && p.startsWith('/products/'));
  const productsXml = simpleXml(products, 'monthly', pages);
  writeFileSync(path.join(DIST, 'sitemap-products.xml'), productsXml);
  writeFileSync(path.join(PUBLIC, 'sitemap-products.xml'), productsXml);

  const community = pages.filter(
    (p) => isEn(p) && ['/community/', '/gallery/', '/lifestyle/', '/journal/'].includes(p)
  );
  const communityXml = simpleXml(community, 'monthly', pages);
  writeFileSync(path.join(DIST, 'sitemap-community.xml'), communityXml);
  writeFileSync(path.join(PUBLIC, 'sitemap-community.xml'), communityXml);

  const media = pages.filter((p) => isEn(p) && ['/media/', '/news/'].includes(p));
  const mediaXml = simpleXml(media, 'monthly', pages);
  writeFileSync(path.join(DIST, 'sitemap-media.xml'), mediaXml);
  writeFileSync(path.join(PUBLIC, 'sitemap-media.xml'), mediaXml);

  const learning = pages.filter((p) => isEn(p) && p.startsWith('/learn/'));
  const learningXml = simpleXml(learning, 'monthly', pages);
  writeFileSync(path.join(DIST, 'sitemap-learning.xml'), learningXml);
  writeFileSync(path.join(PUBLIC, 'sitemap-learning.xml'), learningXml);

  // 单一 sitemap 入口（robots.txt 指向 sitemap-index.xml；gate 汇总时跳过 sitemapindex）
  const INDEX_FILES = [
    'sitemap-entity.xml',
    'ai-sitemap.xml',
    'knowledge-sitemap.xml',
    'sitemap-products.xml',
    'sitemap-community.xml',
    'sitemap-media.xml',
    'sitemap-learning.xml',
  ];
  const indexXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    INDEX_FILES.map((f) => `  <sitemap><loc>${BASE}/${f}</loc></sitemap>`).join('\n') +
    `\n</sitemapindex>\n`;
  writeFileSync(path.join(DIST, 'sitemap-index.xml'), indexXml);
  writeFileSync(path.join(PUBLIC, 'sitemap-index.xml'), indexXml);

  console.log(
    `[sitemaps] entity=${pages.length} ai=${ai.length} knowledge=${knowledge.length} products=${products.length} community=${community.length} media=${media.length} learning=${learning.length}`
  );
}

main();
