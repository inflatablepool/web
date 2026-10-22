import { desc, count, eq, and, sql } from 'drizzle-orm';
import { createDb, type DB } from '../shared/client';
import { newPost as news, type News } from '../shared/schema';
import {
  LANGS,
  NEWS_UI,
  escapeHtml,
  escapeAttr,
  renderMarkdown,
  readingTime,
  formatDate,
  isoDate,
  excerptFromBody,
  toSlug,
} from '../shared/news-render';

interface Env {
  DB: D1Database;
  SITE?: string;
}

const SITE = 'https://inflatablepoolfactory.com';
const POSTS_PER_PAGE = 6;

// ---------- helpers ----------

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function htmlResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers } });
}

function xmlResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

function parseTags(raw: string | null): string[] {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function publicUrl(path: string): string {
  return SITE + (path.startsWith('/') ? path : '/' + path);
}

function postHref(lang: string, slug: string): string {
  return lang === 'en' ? `/news/${slug}/` : `/${lang}/news/${slug}/`;
}

function langPrefix(lang: string): string {
  return lang === 'en' ? '' : `/${lang}`;
}

function langRoot(lang: string): string {
  return lang === 'en' ? '/' : `/${lang}/`;
}

// ---------- page shell ----------

const CSS = `
*{box-sizing:border-box;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#fafaf8;color:#1a1a1a;line-height:1.6}
.wrap{max-width:860px;margin:0 auto;padding:0 20px}
.top{display:flex;align-items:center;justify-content:space-between;padding:18px 0;border-bottom:1px solid #e8e8e4;flex-wrap:wrap;gap:8px}
.logo{font-size:20px;font-weight:700;text-decoration:none;color:#0b3a5b}
.logo .dot{color:#c0392b}
.top nav a{color:#0a3a5b;text-decoration:none;margin-left:16px;font-size:14px}
.top nav a:hover{text-decoration:underline}
.hero{padding:44px 0 26px}
.hero h1{font-size:34px;line-height:1.2;color:#0b3260}
.hero p{margin-top:8px;color:#666;font-size:16px}
.list{list-style:none;padding:0;margin:0}
.card{display:block;text-decoration:none;color:inherit;padding:22px 0;border-bottom:1px solid #eee}
.card:last-child{border-bottom:none}
.card h3{font-size:20px;color:#0b3260;line-height:1.3}
.card:hover h3{text-decoration:underline}
.meta{font-size:13px;color:#8a8a8a;margin-top:6px}
.card p{margin-top:8px;color:#444}
.pagination{display:flex;justify-content:space-between;padding:30px 0 40px;font-size:15px}
.pagination a{color:#0b3a5b;text-decoration:none}
.pagination a:hover{text-decoration:underline}
.article h1{font-size:30px;line-height:1.25;color:#0b3260}
.post-meta{color:#8a8a8a;font-size:14px;margin:12px 0 8px}
.article img{max-width:100%;height:auto;border-radius:8px;margin:14px 0}
.body{font-size:17px;color:#2b2b2b}
.body h2{font-size:23px;margin:26px 0 10px;color:#0b3260}
.body h3{font-size:19px;margin:22px 0 8px;color:#0b3260}
.body p{margin:12px 0}
.body a{color:#0a58a0}
.body pre{background:#111;color:#eee;padding:14px;border-radius:6px;overflow:auto;font-size:13px;margin:14px 0}
.body code{background:#eef0f0;padding:2px 5px;border-radius:4px;font-size:13px}
.body blockquote{border-left:4px solid #c0392c;padding-left:14px;color:#555;margin:14px 0}
.body ul,.body ol{margin:12px 0 12px 20px}
.back{margin:34px 0 12px}
.back a{color:#0a3a5b;text-decoration:none}
.back a:hover{text-decoration:underline}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 4px}
.chip{background:#eef4f8;color:#0a4a7a;border-radius:14px;padding:3px 10px;font-size:12px;text-decoration:none}
footer{border-top:1px solid #eee;padding:26px 0 40px;color:#8a8a8a;font-size:13px;text-align:center}
`;

function pageShell(lang: string, body: string, title: string, canonical: string, description: string, extraHead = '') {
  const dir = lang === 'ar' ? ' dir="rtl"' : '';
  return `<!DOCTYPE html>
<html lang="${lang}"${dir}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${escapeAttr(title)}"/>
<meta property="og:description" content="${escapeAttr(description)}"/>
<meta property="og:url" content="${canonical}"/>
${hreflangAlternates(lang, canonical)}
${extraHead}
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <a class="logo" href="${langRoot(lang)}">Inflatable Pool Factory <span class="dot">News</span></a>
  <nav>
    <a href="${langPrefix(lang)}/news/">${escapeHtml(NEWS_UI[lang]?.title || 'News')}</a>
    <a href="${langRoot(lang)}contact/">Contact</a>
    <a href="${langPrefix(lang)}/rss.xml">RSS</a>
  </nav>
</header>
${body}
<footer>
  <p>© ${new Date().getFullYear()} Inflatable Pool Factory — Inflatable boats, RIBs, SUP boards & kayaks. <a href="${langRoot(lang)}">${escapeHtml('Visit inflatablepoolfactory.com')}</a></p>
</footer>
</div>
</body>
</html>`;
}

function hreflangAlternates(lang: string, canonical: string): string {
  const url = new URL(canonical);
  const parts = url.pathname.split('/').filter(Boolean);
  // Determine whether this path is already lang-prefixed
  const langPrefixed = parts[0] && parts[0] !== 'en' && LANGS.includes(parts[0]);
  const basePath = langPrefixed
    ? '/' + parts.slice(1).join('/') + (url.pathname.endsWith('/') ? '/' : '')
    : url.pathname;
  const links = LANGS.map((l) => {
    const href = publicUrl(l === 'en' ? basePath : `/${l}${basePath === '/' ? '' : basePath}`);
    const tag = `<link rel="alternate" hreflang="${l}" href="${href}"/>`;
    return tag;
  }).join('\n');
  return `${links}\n<link rel="alternate" hreflang="x-default" href="${canonical}"/>`;
}

function langCanonical(lang: string, pathTokens: string[]): string {
  const p = lang === 'en' ? '' : `/${lang}`;
  return publicUrl(`${p}/${pathTokens.join('/')}/`);
}

// ---------- data access ----------

async function publishedPosts(db: DB, opts: { category?: string; tag?: string; page?: number; limit?: number } = {}) {
  const page = Math.max(1, opts.page || 1);
  const limit = opts.limit ?? POSTS_PER_PAGE;
  if (opts.tag) {
    const all = await db.select().from(news).where(eq(news.draft, false)).orderBy(desc(news.publishDate));
    const filtered = all.filter((r) => parseTags(r.tags).some((t) => toSlug(t) === opts.tag));
    return filtered.slice((page - 1) * limit, page * limit);
  }
  let rows: News[];
  if (opts.category) {
    rows = await db
      .select()
      .from(news)
      .where(and(eq(news.draft, false), eq(news.category, opts.category)))
      .orderBy(desc(news.publishDate))
      .limit(limit)
      .offset((page - 1) * limit);
  } else {
    rows = await db
      .select()
      .from(news)
      .where(eq(news.draft, false))
      .orderBy(desc(news.publishDate))
      .limit(limit)
      .offset((page - 1) * limit);
  }
  return rows;
}

async function countPublished(db: DB, opts: { category?: string; tag?: string } = {}) {
  if (opts.tag) {
    const all = await db.select().from(news).where(eq(news.draft, false));
    return all.filter((r) => parseTags(r.tags).some((t) => toSlug(t) === opts.tag)).length;
  }
  const [{ c }] = opts.category
    ? await db
        .select({ c: count() })
        .from(news)
        .where(and(eq(news.draft, false), eq(news.category, opts.category)))
    : await db.select({ c: count() }).from(news).where(eq(news.draft, false));
  return Number(c);
}

async function getPost(db: DB, slug: string): Promise<News | undefined> {
  const rows = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  return rows[0];
}

async function relatedPosts(db: DB, post: News, limit = 4): Promise<News[]> {
  if (!post.category) return [];
  return db
    .select()
    .from(news)
    .where(and(eq(news.draft, false), eq(news.category, post.category), sql`${news.slug} != ${post.slug}`))
    .orderBy(desc(news.publishDate))
    .limit(limit);
}

// ---------- pages ----------

function listPage(lang: string, posts: News[], total: number, page: number, canonical: string, subtitle: string) {
  const ui = NEWS_UI[lang] || NEWS_UI.en;
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const items = posts
    .map(
      (p) => `<a class="card" href="${postHref(lang, p.slug)}">
  <h3>${escapeHtml(p.title)}</h3>
  <div class="meta">${fmtDate(p.publishDate, lang)}${p.author ? ' · ' + escapeHtml(p.author) : ''}${p.category ? ' · ' + escapeHtml(p.category) : ''}</div>
  ${p.image ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.title)}" loading="lazy"/>` : ''}
  ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ''}
</a>`
    )
    .join('');

  const prev =
    page > 1
      ? `<a href="${langPrefix(lang)}/news/${page === 2 ? '' : `page/${page - 1}/`}">← ${escapeHtml(ui.title)}</a>`
      : '<span></span>';
  const next =
    page < totalPages
      ? `<a href="${langPrefix(lang)}/news/page/${page + 1}/">${escapeHtml('Next →')}</a>`
      : '<span></span>';

  const body = `<section class="hero">
  <h1>${escapeHtml(ui.title)}</h1>
  <p>${escapeHtml(subtitle || ui.subtitle)}</p>
</section>
<ul class="list">${items || '<li class="card"><h3>No posts yet</h3></li>'}</ul>
<div class="pagination">${prev}${next}</div>`;

  return pageShell(lang, body, `${ui.title} | Inflatable Pool Factory`, canonical, ui.subtitle || 'News from Inflatable Pool Factory');
}

function postPage(lang: string, post: News, related: News[], canonical: string) {
  const { html } = renderMarkdown(post.body);
  const img = post.image ? `<img src="${escapeAttr(post.image)}" alt="${escapeAttr(post.title)}"/>` : '';
  const tags = parseTags(post.tags)
    .map((t) => `<a class="chip" href="${langPrefix(lang)}/news/tag/${toSlug(t)}/">${escapeHtml(t)}</a>`)
    .join('');
  const relatedHtml = related.length
    ? `<div class="hero" style="padding:28px 0 0"><h2 style="font-size:22px;color:#0b3260">${escapeHtml('Related')}</h2><ul class="list">${related
        .map(
          (r) =>
            `<a class="card" href="${postHref(lang, r.slug)}"><h3>${escapeHtml(r.title)}</h3><div class="meta">${fmtDate(r.publishDate, lang)}</div></a>`
        )
        .join('')}</ul></div>`
    : '';

  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: isoDate(post.publishDate),
    dateModified: isoDate(post.updateDate || post.publishDate),
    author: post.author ? { '@type': 'Person', name: post.author } : { '@type': 'Organization', name: 'Inflatable Pool Factory' },
    publisher: { '@type': 'Organization', name: 'Inflatable Pool Factory', url: SITE },
    mainEntityOfPage: canonical,
    articleSection: post.category || undefined,
    inLanguage: lang,
  })}</script>`;

  const body = `<article class="article" style="padding:36px 0 10px">
  <h1>${escapeHtml(post.title)}</h1>
  <div class="post-meta">${fmtDate(post.publishDate, lang)}${post.author ? ' · ' + escapeHtml(post.author) : ''} · ${readingTime(post.body)} min read</div>
  ${img}
  <div class="body">${html}</div>
  ${tags ? `<div class="chips">${tags}</div>` : ''}
  <div class="back"><a href="${langPrefix(lang)}/news/">← ${escapeHtml(NEWS_UI[lang]?.title || 'News')}</a></div>
</article>
${relatedHtml}`;

  return pageShell(lang, body, `${post.title} | Inflatable Pool Factory`, canonical, post.excerpt || '', jsonLd);
}

function fmtDate(d: Date, lang: string): string {
  return formatDate(d, lang);
}

// ---------- feeds ----------

function rssXml(lang: string, posts: News[]): string {
  const site = lang === 'en' ? publicUrl('/') : publicUrl(`/${lang}/`);
  const items = posts
    .map(
      (p) => `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${publicUrl(postHref(lang, p.slug))}</link>
    <guid isPermaLink="false">${p.slug}@${lang}</guid>
    <pubDate>${p.publishDate.toUTCString()}</pubDate>
    ${p.excerpt ? `<description>${escapeHtml(p.excerpt)}</description>` : ''}
  </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeHtml(NEWS_UI[lang]?.title || 'News')} | Inflatable Pool Factory</title>
  <link>${site}</link>
  <description>Latest news from Inflatable Pool Factory</description>
  <atom:link href="${publicUrl(langPrefix(lang) + '/rss.xml')}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;
}

function sitemapNewsXml(posts: News[]): string {
  const urls = posts
    .map(
      (p) => `  <url>
    <loc>${publicUrl(`/news/${p.slug}/`)}</loc>
    <lastmod>${isoDate(p.updateDate || p.publishDate)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

function searchIndexJson(posts: News[]) {
  return posts.map((p) => ({
    title: p.title,
    url: publicUrl(`/news/${p.slug}/`),
    excerpt: p.excerpt || excerptFromBody(p.body),
    type: 'article',
    tags: parseTags(p.tags),
    lang: 'en',
  }));
}

function llmsPost(p: News): string {
  const lines: string[] = [];
  lines.push(`# ${p.title}`);
  lines.push('');
  if (p.publishDate) lines.push(`- **Published**: ${isoDate(p.publishDate).split('T')[0]}`);
  if (p.updateDate) lines.push(`- **Updated**: ${isoDate(p.updateDate).split('T')[0]}`);
  if (p.author) lines.push(`- **Author**: ${p.author}`);
  if (p.category) lines.push(`- **Category**: ${p.category}`);
  const tags = parseTags(p.tags);
  if (tags.length) lines.push(`- **Tags**: ${tags.join(', ')}`);
  if (p.excerpt) lines.push(`- **Excerpt**: ${p.excerpt}`);
  if (p.image) lines.push(`- **Image**: ${p.image}`);
  lines.push('');
  if (p.body?.trim()) lines.push(p.body.trim());
  lines.push('');
  lines.push('---');
  lines.push(`Source: ${publicUrl(`/news/${p.slug}/`)}`);
  return lines.join('\n');
}

// ---------- router ----------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const db = createDb(env.DB);
    const segs = url.pathname.split('/').filter(Boolean);

    // language prefix detection; 'en' is also accepted (site builds /en/news)
    let lang = 'en';
    let tokens = segs;
    if (segs.length && LANGS.includes(segs[0])) {
      lang = segs[0];
      tokens = segs.slice(1);
    }

    try {
      // ---- RSS ----
      if (tokens.length === 1 && tokens[0] === 'rss.xml') {
        const posts = await publishedPosts(db, { limit: 50 });
        return xmlResponse(rssXml(lang, posts));
      }

      // ---- llms/news/[slug] ----
      if (tokens[0] === 'llms' && tokens[1] === 'news' && tokens[2]) {
        const post = await getPost(db, tokens[2]);
        if (!post) return new Response('Not found', { status: 404 });
        return new Response(llmsPost(post), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
      }

      // ---- sitemap-news.xml ----
      if (tokens.length === 1 && tokens[0] === 'sitemap-news.xml') {
        const posts = await publishedPosts(db, { limit: 500 });
        return xmlResponse(sitemapNewsXml(posts));
      }

      // ---- search index (news only) ----
      if (tokens[0] === 'news' && tokens[1] === 'search-index.json') {
        const posts = await publishedPosts(db, { limit: 200 });
        return json(searchIndexJson(posts), 200, { 'Cache-Control': 'public, max-age=300' });
      }

      // ---- news routes ----
      if (tokens[0] === 'news') {
        const rest = tokens.slice(1);
        // /news/[slug]/ (single post) or /news/search-index.json handled above
        if (rest.length === 0 || (rest.length === 1 && rest[0] === 'page')) {
          const page = rest.length === 1 && rest[0] === 'page' ? NaN : 1;
          const pageNum = Number.isNaN(page) ? 1 : page;
          const [posts, total] = await Promise.all([publishedPosts(db, { page: pageNum }), countPublished(db)]);
          const canonical = langCanonical(lang, rest.length ? ['news', 'page', String(pageNum)] : ['news']);
          return htmlResponse(listPage(lang, posts, total, pageNum, canonical, ''), 200, {
            'Cache-Control': 'public, max-age=300',
          });
        }
        if (rest.length === 2 && rest[0] === 'page' && /^\d+$/.test(rest[1])) {
          const pageNum = Math.max(1, Number(rest[1]));
          const [posts, total] = await Promise.all([publishedPosts(db, { page: pageNum }), countPublished(db)]);
          return htmlResponse(
            listPage(lang, posts, total, pageNum, langCanonical(lang, ['news', 'page', String(pageNum)]), '')
          );
        }
        if (rest.length >= 2 && rest[0] === 'category') {
          const catSlug = rest[1];
          const pageNum = rest[2] === 'page' && /^\d+$/.test(rest[3] || '') ? Number(rest[3]) : 1;
          // match category by slug: iterate all categories
          const all = await db.select({ category: news.category }).from(news).where(eq(news.draft, false));
          const cats = [...new Set(all.map((r) => r.category).filter(Boolean))] as string[];
          const cat = cats.find((c) => toSlug(c) === catSlug);
          if (!cat)
            return htmlResponse(
              pageShell(
                lang,
                '<h1 style="padding:60px 0">404 — Category not found</h1>',
                'Not found',
                publicUrl(url.pathname),
                'Not found'
              ),
              404
            );
          const [posts, total] = await Promise.all([
            publishedPosts(db, { category: cat, page: pageNum }),
            countPublished(db, { category: cat }),
          ]);
          return htmlResponse(
            listPage(
              lang,
              posts,
              total,
              pageNum,
              langCanonical(lang, ['news', 'category', catSlug, ...(pageNum > 1 ? ['page', String(pageNum)] : [])]),
              cat
            )
          );
        }
        if (rest.length >= 2 && rest[0] === 'tag') {
          const tagSlug = rest[1];
          const pageNum = rest[2] === 'page' && /^\d+$/.test(rest[3] || '') ? Number(rest[3]) : 1;
          const [posts, total] = await Promise.all([
            publishedPosts(db, { tag: tagSlug, page: pageNum }),
            countPublished(db, { tag: tagSlug }),
          ]);
          return htmlResponse(
            listPage(
              lang,
              posts,
              total,
              pageNum,
              langCanonical(lang, ['news', 'tag', tagSlug, ...(pageNum > 1 ? ['page', String(pageNum)] : [])]),
              ''
            ),
            200,
            { 'Cache-Control': 'public, max-age=300' }
          );
        }
        // single post
        const slug = rest[0];
        const post = await getPost(db, slug);
        if (!post)
          return htmlResponse(
            pageShell(
              lang,
              '<h1 style="padding:60px 0">404 — Post not found</h1>',
              'Not found',
              publicUrl(url.pathname),
              'Not found'
            ),
            404
          );
        const related = await relatedPosts(db, post);
        return htmlResponse(postPage(lang, post, related, publicUrl(postHref(lang, slug))), 200, {
          'Cache-Control': 'public, max-age=300',
        });
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.error('news-worker error:', e);
      return new Response(String(e instanceof Error ? e.message : e), { status: 500 });
    }
  },
};
