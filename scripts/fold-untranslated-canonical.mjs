#!/usr/bin/env node
/**
 * scripts/fold-untranslated-canonical.mjs
 *
 * 未翻译语言页 canonical 折叠到 EN 根（构建后处理 dist）。
 *
 * 背景：fr/de/es/it 背书语言的相当一部分页面正文仍是英文（05_ci_gate 的 X 类
 * 缺口）。这些页面若 canonical 指向自身，会与英文根页面构成重复内容竞争权重。
 * 本站跨语言 canonical 折叠是既定设计（产品页已手动折叠，G 类检查允许
 * "本地页 → EN 根"），本脚本把判定自动化：
 *
 *   对每个可索引的非英文页面：
 *     1. 语言检测（与 langdetect_lite 同口径的停用词统计：忽略单字母
 *        token、平局判不可靠）判为英文，且置信达标（en 停用词命中 ≥5 且
 *        领先页面语言 ≥3）→ 视为未翻译
 *     2. canonical 指向自身（self）→ 改写为英文根路径
 *     3. 已折叠（canonical = EN 根或他页）→ 不动
 *
 * 采样前剥离 Tldr AI 摘要块（data-ai-block="tldr"）：factory 系列页面的
 * 英文 directAnswer 会把已翻译页误判为英文。置信阈值防止近平局误折叠
 * （实测 de/solutions/offshore-energy 曾以 17:17 平局按表序误判 en）。
 *
 * 已翻译页（正文为该语言）→ 保持 self canonical，不受影响。
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = process.argv[2] || './dist';
const BASE = 'https://inflatablepoolfactory.com';

const STOPWORDS = {
  en: ['the', 'and', 'of', 'to', 'a', 'in', 'for', 'is', 'on', 'that', 'with', 'as', 'by', 'at', 'from'],
  de: ['der', 'die', 'das', 'und', 'in', 'den', 'von', 'mit', 'ist', 'auf', 'zu', 'ein', 'eine', 'sich'],
  pt: ['o', 'a', 'os', 'as', 'do', 'da', 'de', 'que', 'em', 'para', 'com', 'um', 'uma', 'no', 'na'],
  fr: ['le', 'la', 'les', 'de', 'des', 'et', 'pour', 'avec', 'une', 'dans', 'sur', 'est', 'un', 'en', 'au'],
  es: ['el', 'la', 'los', 'las', 'de', 'del', 'que', 'en', 'para', 'con', 'por', 'un', 'una', 'y', 'es'],
  it: ['il', 'lo', 'la', 'le', 'di', 'del', 'che', 'e', 'per', 'con', 'in', 'un', 'una', 'non', 'è'],
  nl: ['de', 'het', 'een', 'van', 'en', 'in', 'op', 'voor', 'met', 'aan', 'die', 'dat', 'is', 'te', 'zijn'],
  sv: ['och', 'i', 'att', 'det', 'som', 'på', 'en', 'för', 'med', 'till', 'av', 'är', 'den', 'de', 'ett'],
  no: ['og', 'i', 'det', 'at', 'som', 'på', 'en', 'med', 'til', 'av', 'er', 'den', 'for', 'de', 'et'],
  da: ['og', 'i', 'det', 'at', 'som', 'på', 'en', 'for', 'med', 'til', 'af', 'er', 'den', 'de', 'et'],
  // cs 毕业清单 §16.4-4：捷克语停用词（token 正则 [a-zà-ÿ] 不含 č/š/ž/ř/ě/ů/ň，选词避开这些字母）。
  // 捷克语最高频介词多为单字符（v/s/k/z/o/a/i），被 stopwordHits 的 length>1 过滤，
  // 因此补齐 2 字符介词（do/od/za/po/ke/ve）与高频动词/代词，否则已翻译页误判英文
  // （实测 cs/ap330：扩表前 cs=7:en=13 误折叠）。
  cs: [
    'na',
    'je',
    'se',
    'pro',
    'ale',
    'nebo',
    'jak',
    'tak',
    'jsou',
    'byl',
    'byla',
    'jako',
    'proto',
    'který',
    'více',
    'aby',
    'ani',
    'bez',
    'tomto',
    // — 扩充（2026-10-03）：2 字符介词 + 系动词 + 代词 + 连词（均无 č/š/ž/ř/ě/ů/ň）—
    'do',
    'od',
    'za',
    'po',
    'ke',
    've',
    'ku',
    'co',
    'bylo',
    'byli',
    'bude',
    'budou',
    'není',
    'tím',
    'mezi',
    'pod',
    'nad',
    'jeho',
    'její',
    'jejich',
    'jen',
    'kde',
    'toho',
    'kterou',
    'které',
    'která',
    'tímto',
    'pouze',
    'velmi',
    'zde',
    'kdy',
    'tedy',
    'nyní',
  ],
  fi: ['ja', 'on', 'ei', 'se', 'että', 'niin', 'kuin', 'ovat', 'toi', 'hän', 'minä', 'sinä', 'tämä', 'mitä'],
  // pl 毕业清单 §16.4-4：波兰语停用词（token 正则 [a-zà-ÿ] 不含 ą/ć/ę/ł/ń/ś/ź/ż，选词避开这些字母）
  pl: ['na', 'do', 'jest', 'oraz', 'dla', 'jak', 'ale', 'czy', 'przez', 'bez', 'ten', 'tego', 'tym', 'tak', 'nie'],
};

const LANGS = [
  'en',
  'fr',
  'de',
  'es',
  'pt',
  'it',
  'ar',
  'ru',
  'pl',
  'nl',
  'sv',
  'no',
  'el',
  'fi',
  'da',
  'cs',
  'th',
  'hr',
  'tl',
  'hu',
  'ro',
  'sk',
  'bg',
  'sl',
  'sr',
  'tr',
  'id',
  'he',
  'ms',
  'lt',
  'lv',
  'et',
  'kk',
  'uz',
  'uk',
  'az',
  'fa',
];

const FULL_SCRIPT = [
  ['ar', /[\u0600-\u06FF]/g],
  ['el', /[\u0370-\u03FF]/g],
  ['ru', /[\u0400-\u04FF]/g],
];

// cs 毕业清单 §16.4-4：捷克语用专属变音字符检测（č/ď/ě/ň/ř/š/ť/ů/ž，Latin Extended-A）。
// 捷克语功能词多为单字符介词（v/s/k/z/o/a/i），被 stopwordHits 的 length>1 过滤，
// 停用词计数天然偏低（实测 cs/ap330 扩表后 cs=10:en=13 仍误折叠）；而英文页面
// 这些字符数为 0，已翻译 cs 页面（labels：Šířka/Vnitřní/délka…）必然远超 6 个。
// 斯洛伐克语共享部分字符，但 sk 为非毕业语言（整体 noindex，不进 fold 流程）。
// 注意：cs 不能用下面的脚本占比门限——正字法本身只用少量变音字母，占比天然偏低。
const CS_DIACRITICS =
  /[\u010C\u010D\u010E\u010F\u011A\u011B\u0147\u0148\u0158\u0159\u0160\u0161\u0164\u0165\u016E\u016F\u017D\u017E]/g;

/**
 * 非拉丁文语言页的脚本占比。
 *
 * 旧逻辑只要正文出现 6 个阿/希/西里尔字母就判定为已翻译。产品页与联系页的
 * UI 标签（"سعر التجزئة"、"Τιμή λιανικής"、"Розничная цена"）正好满足这一条，
 * 于是正文仍是英文的页面被当成译文保留 self canonical，并继续进入 sitemap 与
 * hreflang。实测这些页面脚本占比仅 0.10–0.17，而已翻译页普遍在 0.70 以上，
 * 部分翻译的 about 页约 0.39–0.45。以 0.30 为界：超过视为本地化页面，
 * 低于则交回停用词判定（英文正文会因此正确折叠）。
 */
const TRANSLATED_SCRIPT_SHARE = 0.3;

function scriptShare(text, re) {
  const script = (text.match(re) || []).length;
  const letters = (text.match(/\p{L}/gu) || []).length;
  return letters > 0 ? script / letters : 0;
}

function stopwordHits(text) {
  const sample = (text || '').slice(0, 4000);
  const words = sample.toLowerCase().match(/[a-zà-ÿ]+/g) || [];
  const multi = words.filter((w) => w.length > 1);
  const hits = {};
  for (const [l, sw] of Object.entries(STOPWORDS)) {
    hits[l] = multi.filter((w) => sw.includes(w)).length;
  }
  return hits;
}

// sv/no/da/fi/de 毕业清单：正文头部变音词通道。停用词法对北欧语言失效：高频功能词
// 与 en 同形（en/de/den/at/for），且页面多为"模板本地化 + 内容区英文"混译形态，en
// 计数虚高（实测 /sv/contact en=10:sv=6、/sv/guides en=52:sv=28 —— and×14/to×17
// 来自列表卡片英文摘要——正文开头即瑞典语仍误折叠）。
//
// 判据：正文前 600 字符唯一变音词型 ≥3，或前 300 字符 ≥2。真翻译页正文第一句即
// 本地化（/sv/guides h600=18、/fi/people、/de/guides "Führer Neu bei SUP?"）；未
// 翻译页头部变音词仅来自分类标签/面包屑（"Anvendelsestilfælde"），唯一词型 ≤1
// （实测 294 折叠页中 211 页 h600=0）。"Läs mer"×N 类 CTA 只贡献 1 个词型，不会
// 误救。title/description 已翻译但正文英文的页面（research/use-cases 摘要组）
// 也会命中——SERP 以本语言展示，保持 self canonical 的本地可见性优于折叠。
// 首字符组覆盖 sv/fi/de（åäö）与 no/da（åæø）；sv 先测。no/da 无法互分，返回
// 'no' —— fold 决策只看是否 'en'，二者等价。dry-run 全语言验证：救回 51 页
// （sv16/no10/da10/fi14/de1）零误触发（fr/es/pt/it/ar/ru/pl/nl/el/cs/ja 均为 0）。
function scandiDiacriticLang(bodyText) {
  if (!bodyText) return null;
  const tok = (s) => s.toLowerCase().match(/[a-zà-ÿ]+/g) || [];
  const uniq = (words, re) => new Set(words.filter((w) => re.test(w))).size;
  const head600 = bodyText.slice(0, 600);
  const head300 = bodyText.slice(0, 300);
  const svRe = /[\u00E5\u00E4\u00F6]/;
  const noDaRe = /[\u00E5\u00E6\u00F8]/;
  if (uniq(tok(head600), svRe) >= 3 || uniq(tok(head300), svRe) >= 2) return 'sv';
  if (uniq(tok(head600), noDaRe) >= 3 || uniq(tok(head300), noDaRe) >= 2) return 'no';
  return null;
}

function detectLanguage(text, bodyText) {
  const sample = (text || '').slice(0, 4000);
  if (!sample.trim()) return null;
  for (const [l, re] of FULL_SCRIPT) {
    const letters = sample.match(re) || [];
    if (letters.length >= 6 && scriptShare(sample, re) >= TRANSLATED_SCRIPT_SHARE) return l;
  }
  if ((sample.match(CS_DIACRITICS) || []).length >= 6) return 'cs';
  const scandi = scandiDiacriticLang(bodyText || sample);
  if (scandi) return scandi;
  const hits = stopwordHits(sample);
  let best = 0;
  for (const n of Object.values(hits)) if (n > best) best = n;
  if (best < 3) return null;
  const bestLangs = Object.keys(hits).filter((l) => hits[l] === best);
  return bestLangs.length === 1 ? bestLangs[0] : null;
}

function mainText(html) {
  const body = html.split('</head>')[1] || '';
  let t = (body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || body;
  t = t.replace(/<section\b[^>]*data-ai-block="tldr"[^>]*>[\s\S]*?<\/section>/gi, ' ');
  t = t.replace(/<(script|style|nav|header|footer|template|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  t = t
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t;
}

function normalizeHreflangTarget(href) {
  try {
    const url = new URL(href, BASE);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    return pathname + (pathname === '/' ? '' : '/');
  } catch {
    return '';
  }
}

/**
 * 已折叠页的 canonical 指向 EN 根，继续在其他页面用 hreflang 指向它会形成
 * "hreflang → 非 canonical URL" 的无效注释（Google 会忽略）。折叠完成后，
 * 从所有页面移除指向这些 URL 的 alternate 链接，使 HTML 与 sitemap 的
 * hreflang 集合一致。
 */
function pruneFoldedHreflang(paths) {
  if (!paths.size) return { files: 0, links: 0 };
  let files = 0;
  let links = 0;
  function walkHtml(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        walkHtml(p);
      } else if (e.name === 'index.html') {
        const html = fs.readFileSync(p, 'utf8');
        let removed = 0;
        const next = html.replace(/<link\b[^>]*>/gi, (tag) => {
          if (!/\brel=["']alternate["']/i.test(tag) || !/\bhreflang=["'][^"']+["']/i.test(tag)) return tag;
          const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1] || '';
          const target = href ? normalizeHreflangTarget(href) : '';
          if (target && paths.has(target)) {
            removed++;
            return '';
          }
          return tag;
        });
        if (removed > 0) {
          fs.writeFileSync(p, next, 'utf8');
          files++;
          links += removed;
        }
      }
    }
  }
  walkHtml(DIST);
  return { files, links };
}

function localeOf(pathKey) {
  const seg = pathKey.replace(/^\//, '').split('/')[0];
  return seg && LANGS.includes(seg) && seg !== 'en' ? seg : 'en';
}

function enRootPath(pathKey) {
  // /de/a/b/ -> /a/b/ ； /de/ -> /  ； 根路径返回 null（本来就在 EN 根）
  const seg = pathKey.replace(/^\//, '').split('/');
  if (seg[0] && LANGS.includes(seg[0]) && seg[0] !== 'en') {
    const rest = seg.slice(1).join('/').replace(/\/+$/, '');
    return rest ? `/${rest}/` : '/';
  }
  return null;
}

let folded = 0;
let kept = 0;
let already = 0;
let skippedNoindex = 0;
const samples = [];
const foldedPaths = new Set();

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p);
    } else if (e.name === 'index.html') {
      const rel = '/' + path.relative(DIST, p).replace(/\\/g, '/');
      const pathKey = rel.replace(/\/index\.html$/, '/');
      const locale = localeOf(pathKey);
      if (locale === 'en') continue;
      const html = fs.readFileSync(p, 'utf8');
      const robots = (html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i) || [])[1] || '';
      if (/noindex/i.test(robots)) {
        skippedNoindex++;
        continue;
      }
      const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gis)].map((m) => m[1].replace(/<[^>]+>/g, ' ').trim());
      const text = mainText(html);
      // 采样窗口 3000 字符：产品页开头是规格表（数字/单位/保留原文的技术值），
      // 功能词稀少；正文译文在 1200 字符之后，窗口太小会把已翻译页误判为英文
      // （实测 de/products/ap330 在 1200 时 en=9:de=5 误折叠，3000 时 de=25:en=12 正确）。
      const sample = [title, ...h1s, text.slice(0, 3000)].join(' ').trim();
      const det = detectLanguage(sample, text);
      if (det === 'en') {
        const hits = stopwordHits(sample);
        const enHits = hits.en || 0;
        const locHits = hits[locale] || 0;
        if (!(enHits >= 5 && enHits - locHits >= 3)) {
          kept++;
          continue;
        }
        const enRoot = enRootPath(pathKey);
        const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
        const canonical = canonicalMatch ? canonicalMatch[1] : '';
        const isSelf =
          !canonical ||
          new URL(canonical).pathname.replace(/\/+$/, '').replace(/^\//, '') ===
            pathKey.replace(/^\//, '').replace(/\/+$/, '');
        if (!isSelf) {
          already++;
          continue;
        }
        if (!enRoot) continue;
        const newHtml = html.replace(
          /<link\s+rel="canonical"\s+href="[^"]*"/i,
          `<link rel="canonical" href="${BASE}${enRoot}"`
        );
        fs.writeFileSync(p, newHtml, 'utf8');
        foldedPaths.add(pathKey);
        folded++;
        if (samples.length < 8)
          samples.push(
            `${pathKey} (${locale}) -> ${enRoot} | en=${enHits} ${locale}=${locHits} | title: ${title.slice(0, 50)}`
          );
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  walk(DIST);
  const pruned = pruneFoldedHreflang(foldedPaths);
  console.log(
    `[fold-canonical] folded=${folded} keptLowConfidence=${kept} alreadyFolded=${already} noindexSkipped=${skippedNoindex} hreflangRemoved=${pruned.links} from=${pruned.files} files`
  );
  for (const s of samples) console.log('  ', s);
}

export { mainText, detectLanguage, stopwordHits };
