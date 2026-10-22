#!/usr/bin/env node
/**
 * scripts/translate-body-components.mjs
 *
 * 翻译正文组件（src/components/{legal,research,randdcenter,marine-industry,technology}/
 * <name>.{de,en}.astro）到缺失的 GRAD 语言，生成 <name>.<lang>.astro，并扩展对应
 * 页面（src/pages/[lang]/...）的 import 块与 Body map（磁盘组件驱动，幂等可重跑）。
 *
 * 源语言：组件目录存在 <name>.en.astro 用 en（randdcenter），否则用 de。
 *
 * 解析器为 Astro/JSX 感知状态机（非正则替换）：
 *   - 标签扫描跳过引号与 {...}（attr 表达式内的 headline/description/name/label
 *     字符串字段翻译：JsonLd article/breadcrumbs、AiQuickAnswer facts）
 *   - 文本节点仅在元素内部翻译；表达式递归时基线深度 = 入口深度 —— 表达式内
 *     JS 代码（未开新标签）不翻译，嵌套标签内的可见文本翻译
 *   - script/style/code/pre 内容与 HTML 注释原样保留；片段 <>/</> 支持深度计数
 *   - 静态引号属性 title/alt/aria-label/placeholder/quickAnswer 翻译；
 *     entityType 是 SEO AI 管线的 data-ai-entity 标记值，保守不译
 *   - 实体先解码（&auml; → ä）再翻译；文本输出重编码 & < >，JS 字符串上下文
 *     反斜杠转义，属性值按包裹引号实体转义；文件 raw UTF-8
 *   - 技术片段（纯数字/单位/标点，如 "3.000 – 5.000 N/5cm"）跳过不译；
 *     数字与数值范围经哨兵保护防翻译引擎改写数值
 *
 * 翻译走 Google translate_a/single（sl=源语言；CI runner 可用，本地 TCP 被墙
 * 自动降级 MyMemory —— 超过 450 字符的段落跳过 MyMemory 防 500 字符静默截断），
 * 结果缓存 .cache/body-components-cache.json（键 `${src}>${lang}::${text}`），
 * 并以 page-meta-cache.json 条目（de 源）作只读种子，保证与已上线 META 口径一致。
 *
 * 输出组件经 prettier API（parser astro + prettier-plugin-astro，项目配置）格式化，
 * 同时充当语法门（解析失败即抛错）。任一段落翻译失败 → 该组件本轮跳过不写，
 * 下轮重跑（缓存已热）自动补齐；接线只接磁盘上已存在的组件文件，不会产生悬空 import。
 *
 * 用法：
 *   node scripts/translate-body-components.mjs --dry-run   # 只提取统计，不翻译不写
 *   node scripts/translate-body-components.mjs --stub      # 本地测试：[lang] 标记，不联网不写缓存
 *   node scripts/translate-body-components.mjs             # 全部缺失语言
 *   node scripts/translate-body-components.mjs --lang=sv   # 单语言
 *   GOOGLE_PROXY=socks5h://host:port node ...              # 本地：Google 请求经 curl SOCKS 代理
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import prettier from 'prettier';
import * as astroPlugin from 'prettier-plugin-astro';

const execFileP = promisify(execFile);
const GOOGLE_PROXY = process.env.GOOGLE_PROXY || null;

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src/pages/[lang]');
const COMPONENTS_DIR = path.join(ROOT, 'src/components');
const CACHE_FILE = path.join(ROOT, '.cache/body-components-cache.json');
const META_CACHE_FILE = path.join(ROOT, '.cache/page-meta-cache.json');
const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const GOOGLE_BATCH_URL = 'https://translate.googleapis.com/translate_a/t';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
// 批量端点把请求数降一个数量级后仍保持温和节奏（gtx 对高频 IP 会 429 硬限速）
const RATE_MS = 500;

const GRAD = ['de', 'fr', 'es', 'it', 'cs', 'sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt'];
const LANG_CAP = {
  cs: 'Cs',
  sv: 'Sv',
  da: 'Da',
  el: 'El',
  no: 'No',
  ru: 'Ru',
  nl: 'Nl',
  fi: 'Fi',
  pl: 'Pl',
  ar: 'Ar',
  pt: 'Pt',
};

// 数字范围在前（组合优先于裸数字），其后为 META 同款术语表，最后裸数字兜底
const PRESERVE_PATTERNS = [
  /\d[\d.,]*\s*[–—-]\s*\d[\d.,]*/g,
  /\bRIB\b/g,
  /\bCE\b/g,
  /\bSOLAS\b/g,
  /\bHP\b/g,
  /\bUV\b/g,
  /\bPVC\b/g,
  /\bCNC\b/g,
  /\bHypalon\b/gi,
  /\bDrop-Stitch\b/gi,
  /\bdrop-stitch\b/g,
  /\bInflatable Pool Factory\b/g,
  /\bISO\b/g,
  /\bPSI\b/g,
  /\bFRP\b/g,
  /\bCSM\b/g,
  /\bDTEX\b/g,
  /\bRCD\b/g,
  /\bHIN\b/g,
  /\bWIN\b/g,
  /\bOEM\b/g,
  /\bODM\b/g,
  /\bSUP\b/g,
  /\bGMT\b/g,
  /\b\d+HP\b/g,
  /\b\d+L\b/g,
  /\b\d+ kg\b/g,
  /\b\d+ mm\b/g,
  /\b\d+°[A-Z]?\b/g,
  /\b\d+\.?\d*°\b/g,
  /\b\d+'\d+"\b/g,
  /\b\d+ft\b/gi,
  /\b\d+ lbs\b/gi,
  /\b\d[\d.,]*\b/g,
];

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  szlig: 'ß',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  agrave: 'à',
  aelig: 'æ',
  ccedil: 'ç',
  ntilde: 'ñ',
  deg: '°',
  sup2: '²',
  sup3: '³',
  micro: 'µ',
  middot: '·',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  laquo: '«',
  raquo: '»',
  times: '×',
  divide: '÷',
  plusmn: '±',
  le: '≤',
  ge: '≥',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  bull: '•',
  dagger: '†',
  sect: '§',
  para: '¶',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  pound: '£',
  yen: '¥',
  frac12: '½',
  iexcl: '¡',
  iquest: '¿',
};

// 纯单位/标准/材料缩写词片段（如 "850 – 1.200 g"、"PVC"、"CE"）不翻译
const UNITS = new Set([
  'N',
  'kN',
  'm',
  'cm',
  'mm',
  'km',
  'g',
  'kg',
  't',
  'L',
  'l',
  'ml',
  'PSI',
  'DTEX',
  'HP',
  'W',
  'kW',
  'V',
  'A',
  'h',
  'min',
  's',
  'C',
  'F',
  'dB',
  'bar',
  'Pa',
  'kPa',
  'MPa',
  'Hz',
  'kHz',
  'kmh',
  'mph',
  'kn',
  'PS',
  'CE',
  'ISO',
  'DIN',
  'EN',
  'PVC',
  'ABS',
  'PE',
  'PP',
  'TPU',
  'EVA',
  'PA',
  'HDPE',
  'LDPE',
  'FRP',
  'GRP',
  'CSM',
  'RIB',
  'SUP',
  'OEM',
  'ODM',
  'UV',
]);

const VOID_TAGS = new Set([
  'br',
  'hr',
  'img',
  'input',
  'meta',
  'link',
  'source',
  'area',
  'base',
  'col',
  'embed',
  'track',
  'wbr',
]);
const SKIP_TAGS = new Set(['script', 'style', 'code', 'pre']);
const TRANS_ATTRS = 'title|alt|aria-label|placeholder|quickAnswer';
const KV_KEYS = 'headline|description|name|label';

// ---------------------------------------------------------------------------
// 翻译核心（与 translate-page-meta.mjs 同模式：Google → MyMemory → 缓存 → 断路器）
// ---------------------------------------------------------------------------

let cache = {};
let apiCalls = 0;
let cacheHits = 0;
let googleFailStreak = 0;
let googleDownUntil = 0;

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    cache = {};
  }
  // page-meta 缓存作只读种子（META 项目源语言为 de）：标题/常用短语与正文口径一致
  try {
    if (fs.existsSync(META_CACHE_FILE)) {
      const meta = JSON.parse(fs.readFileSync(META_CACHE_FILE, 'utf8'));
      for (const [k, v] of Object.entries(meta)) {
        const seedKey = `de>${k}`;
        if (!(seedKey in cache)) cache[seedKey] = v;
      }
    }
  } catch {
    /* seed is best-effort */
  }
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}

function saveCache() {
  if (STUB) return;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function preserveTerms(text) {
  const placeholders = [];
  let result = text;
  for (const pattern of PRESERVE_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const ph = `__PH${placeholders.length}__`;
      placeholders.push(match);
      return ph;
    });
  }
  return { text: result, placeholders };
}

// 清洗 Google 译文中的不规则空白（ESLint no-irregular-whitespace）：宽度空白归一为普通空格，零宽字符移除
const IRREGULAR_WS = /[\u0085\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g;
const ZERO_WIDTH = /[\u200B-\u200D\u2060]/g;
function sanitizeWs(text) {
  return text.replace(IRREGULAR_WS, ' ').replace(ZERO_WIDTH, '');
}

function restoreTerms(text, placeholders) {
  let result = text;
  for (let i = placeholders.length - 1; i >= 0; i--) {
    result = result.replace(new RegExp(`__PH${i}__`, 'g'), placeholders[i]);
  }
  return sanitizeWs(result);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function googleTranslate(preservedText, sourceLang, lang) {
  try {
    const url = `${GOOGLE_URL}?client=gtx&sl=${sourceLang}&tl=${lang}&dt=t&q=${encodeURIComponent(preservedText)}`;
    const data = await googleFetchJson(url);
    if (Array.isArray(data) && data[0]) {
      const t = data[0]
        .map((seg) => seg[0])
        .join('')
        .trim();
      // Google 回显原文 = 判定无需翻译（品牌/软件名/标准号/URL 等），identity 即正确译文
      if (t) return t;
    }
    return null;
  } catch {
    googleFailStreak++;
    if (googleFailStreak >= 3) {
      googleDownUntil = Date.now() + 15 * 60 * 1000;
      console.log(`  [circuit] Google unreachable x${googleFailStreak}, pausing for 15 min`);
    }
    return null;
  }
}

async function myMemoryTranslate(preservedText, sourceLang, lang) {
  // MyMemory 免费接口 ~500 字符截断：长段落宁可失败留给下轮，不要静默残句
  if (preservedText.length > 450) return null;
  try {
    const mmDe = process.env.MM_DE || 'translate@inflatablepoolfactory.com';
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(preservedText)}&langpair=${sourceLang}|${lang}&de=${encodeURIComponent(mmDe)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (res.status === 429) {
      console.log('  [quota] MyMemory HTTP 429');
      return null;
    }
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      let t = data.responseData.translatedText;
      if (/MYMEMORY WARNING|ALL AVAILABLE FREE TRANSLATIONS/i.test(t)) {
        console.log('  [quota] MyMemory daily quota exhausted');
        return null;
      }
      if (t && t !== preservedText) return t;
    }
  } catch {
    /* fall through */
  }
  return null;
}

async function translateText(text, lang, sourceLang) {
  if (!text) return text;
  if (STUB) return `[${lang}] ${text}`;
  const ck = `${sourceLang}>${lang}::${text}`;
  if (cache[ck]) {
    cacheHits++;
    return cache[ck];
  }
  const { text: preserved, placeholders } = preserveTerms(text);

  let t = null;
  if (Date.now() >= googleDownUntil) {
    t = await googleTranslate(preserved, sourceLang, lang);
    if (t !== null) googleFailStreak = 0;
  }
  if (t === null) t = await myMemoryTranslate(preserved, sourceLang, lang);
  if (t === null) return null;

  t = restoreTerms(t, placeholders);
  if (!t) return null;
  cache[ck] = t;
  apiCalls++;
  if (apiCalls % 100 === 0) saveCache();
  return t;
}

// ---------------------------------------------------------------------------
// 实体与文本工具
// ---------------------------------------------------------------------------

function decodeEntities(s) {
  return s
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) => ENTITIES[name] ?? m)
    .replace(/&#(\d+);/g, (m, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return m;
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (m, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return m;
      }
    });
}

// 文本节点上下文：只需转义会破坏解析的三个字符
function encodeText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// JS 字符串字面量上下文（frontmatter / attr 表达式内）
function encodeJsString(s, q) {
  let out = s.replace(/\\/g, '\\\\').replace(/\r?\n/g, ' ');
  if (q === "'") out = out.replace(/'/g, "\\'");
  else if (q === '"') out = out.replace(/"/g, '\\"');
  return out;
}

// HTML 属性值上下文：文本转义后，包裹引号本身用实体转义
function encodeAttrValue(s, q) {
  let out = encodeText(s);
  if (q === '"') out = out.replace(/"/g, '&quot;');
  else if (q === "'") out = out.replace(/'/g, '&#39;');
  return out;
}

function isTechnical(text) {
  const t = text.trim();
  if (!t) return true;
  if (/^[\d\s.,:;+\-–—/()[\]{}%°²³$€£¥'"*·×±=<>|~^!?…«»“”‘’]+$/.test(t)) return true;
  const words = t.match(/[A-Za-z]+/g) || [];
  if (words.length === 0) return true;
  return words.every((w) => UNITS.has(w));
}

// 文本 run → { lead, trail, decoded }；技术片段/空白返回 null（保持原样）
function prepareRun(run) {
  const m = run.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m || !m[2]) return null;
  const decoded = decodeEntities(m[2]).replace(/\s+/g, ' ').trim();
  if (!decoded || isTechnical(decoded)) return null;
  return { lead: m[1], trail: m[3], decoded };
}

// ---------------------------------------------------------------------------
// Astro/JSX 感知 walker
// ---------------------------------------------------------------------------

// 字符串感知花括号匹配（跳过引号内容/转义/行注释）
function matchBrace(src, openPos) {
  let i = openPos;
  let depth = 0;
  let q = null;
  while (i < src.length) {
    const c = src[i];
    if (q) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === q) q = null;
      i++;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      q = c;
      i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '{') {
      depth++;
      i++;
      continue;
    }
    if (c === '}') {
      depth--;
      if (depth === 0) return i;
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

/**
 * visit: { text(run)->string, tag(tagText)->string, attrExpr(inner)->string }
 * baseline: 当前递归层的深度基线（顶层 0；表达式递归 = 表达式入口深度）。
 * 文本 run 仅在 depth > baseline 时翻译 —— 表达式内的 JS 代码位于基线深度，
 * 不会被当作可见文本；表达式内新开标签的文本深度 > 基线，正常翻译。
 */
function transformTemplate(src, visit, baseline = 0, startDepth = 0) {
  let out = '';
  let i = 0;
  let depth = startDepth;
  const len = src.length;

  while (i < len) {
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      const stop = end === -1 ? len : end + 3;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    const c = src[i];

    if (c === '<') {
      const n = src[i + 1] ?? '';
      if (n === '>') {
        out += '<>';
        i += 2;
        depth++;
        continue;
      }
      if (n === '/' && src[i + 2] === '>') {
        out += '</>';
        i += 3;
        depth = Math.max(baseline, depth - 1);
        continue;
      }
      if (/[A-Za-z]/.test(n) || (n === '/' && /[A-Za-z]/.test(src[i + 2] ?? ''))) {
        // 标签扫描：引号与 {...} 内的 '>' 不闭合标签；记录 attr 表达式区间
        let j = i + 1;
        let q = null;
        const exprs = [];
        let broken = false;
        while (j < len) {
          const ch = src[j];
          if (q) {
            if (ch === '\\') {
              j += 2;
              continue;
            }
            if (ch === q) q = null;
            j++;
            continue;
          }
          if (ch === '"' || ch === "'") {
            q = ch;
            j++;
            continue;
          }
          if (ch === '{') {
            const e = matchBrace(src, j);
            if (e === -1) {
              broken = true;
              break;
            }
            exprs.push([j, e]);
            j = e + 1;
            continue;
          }
          if (ch === '>') break;
          j++;
        }
        if (broken) {
          out += src.slice(i);
          break;
        }
        const tagEnd = Math.min(j + 1, len);
        const tagName = (src.slice(i + 1).match(/^([A-Za-z][A-Za-z0-9-]*)/) || [])[1] || '';
        const isClose = n === '/';
        const selfClose = /\/\s*>$/.test(src.slice(i, tagEnd));

        // script/style/code/pre 内容整体跳过：找到闭合标签原样复制
        if (!isClose && !selfClose && SKIP_TAGS.has(tagName.toLowerCase())) {
          const closeIdx = src.toLowerCase().indexOf(`</${tagName.toLowerCase()}`, tagEnd);
          const stop = closeIdx === -1 ? len : src.indexOf('>', closeIdx) + 1 || len;
          out += src.slice(i, stop);
          i = stop;
          continue;
        }

        let tagText = src.slice(i, tagEnd);
        for (let k = exprs.length - 1; k >= 0; k--) {
          const [s, e] = exprs[k];
          const inner = src.slice(s + 1, e);
          tagText = tagText.slice(0, s - i + 1) + visit.attrExpr(inner) + tagText.slice(e - i);
        }
        tagText = visit.tag(tagText);
        out += tagText;

        if (!selfClose && !isClose && !VOID_TAGS.has(tagName.toLowerCase())) depth++;
        else if (isClose) depth = Math.max(baseline, depth - 1);
        i = tagEnd;
        continue;
      }
      out += '<';
      i++;
      continue;
    }

    if (c === '{') {
      const e = matchBrace(src, i);
      if (e === -1) {
        out += src.slice(i);
        break;
      }
      const inner = src.slice(i + 1, e);
      out += '{' + transformTemplate(inner, visit, depth, depth) + '}';
      i = e + 1;
      continue;
    }

    // 文本 run：直到下一个标签/注释/表达式起点
    let j = i;
    while (j < len && src[j] !== '<' && src[j] !== '{') j++;
    const run = src.slice(i, j);
    out += depth > baseline ? visit.text(run) : run;
    i = j;
  }
  return out;
}

// ---------------------------------------------------------------------------
// frontmatter / 组件级处理
// ---------------------------------------------------------------------------

function splitFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n)([\s\S]*)$/);
  if (!m) return { fm: '', sep: '\n', tpl: src, hasFm: false };
  return { fm: m[1], sep: m[2], tpl: m[3], hasFm: true };
}

// JS 字符串字面量的 key:value 翻译（JsonLd headline/description、facts label 等）
function kvReplace(text, visitKv) {
  const re = new RegExp(`((?:${KV_KEYS})\\s*:\\s*)(["'])((?:[^\\\\]|\\\\.)*?)\\2`, 'g');
  return text.replace(re, (m0, key, q, val) => {
    const decoded = decodeEntities(val).replace(/\s+/g, ' ').trim();
    if (!decoded || isTechnical(decoded)) return m0;
    const t = visitKv(decoded);
    if (!t) return m0;
    return `${key}${q}${encodeJsString(t, q)}${q}`;
  });
}

// 静态引号属性翻译（title/alt/aria-label/placeholder/quickAnswer）
function attrReplace(tagText, visitAttr) {
  const re = new RegExp(`(^|\\s)(${TRANS_ATTRS})(\\s*=\\s*)(["'])((?:[^\\\\]|\\\\.)*?)\\4`, 'g');
  return tagText.replace(re, (m0, pre, name, eq, q, val) => {
    const decoded = decodeEntities(val).replace(/\s+/g, ' ').trim();
    if (!decoded || isTechnical(decoded)) return m0;
    const t = visitAttr(decoded);
    if (!t) return m0;
    return `${pre}${name}${eq}${q}${encodeAttrValue(t, q)}${q}`;
  });
}

// ---------------------------------------------------------------------------
// 页面/组件发现
// ---------------------------------------------------------------------------

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.astro')) out.push(p);
  }
  return out;
}

function discoverPages() {
  const pages = [];
  for (const file of walk(PAGES_DIR)) {
    const src = fs.readFileSync(file, 'utf8');
    const importRe = new RegExp(
      `import (\\w+) from '~\\/components\\/(legal|research|randdcenter|marine-industry|technology)\\/([a-z0-9-]+)\\.([a-z]{2})\\.astro';`,
      'g'
    );
    let m;
    const imports = [];
    while ((m = importRe.exec(src))) imports.push({ var: m[1], group: m[2], name: m[3], lang: m[4] });
    if (imports.length === 0) continue;
    const group = imports[0].group;
    const name = imports[0].name;
    const compDir = path.join(COMPONENTS_DIR, group);
    const onDisk = new Set();
    for (const f of fs.readdirSync(compDir)) {
      const cm = f.match(new RegExp(`^${name}\\.([a-z]{2})\\.astro$`));
      if (cm) onDisk.add(cm[1]);
    }
    const sourceLang = onDisk.has('en') ? 'en' : onDisk.has('de') ? 'de' : null;
    if (!sourceLang) {
      console.log(`[skip] no de/en source component for ${group}/${name}`);
      continue;
    }
    const targets = GRAD.filter((l) => !onDisk.has(l));
    pages.push({ file, group, name, sourceLang, targets, imports, onDisk });
  }
  return pages;
}

// ---------------------------------------------------------------------------
// 提取 / 应用
// ---------------------------------------------------------------------------

function extractSegments(compSrc) {
  const segments = new Set();
  const visit = {
    text: (run) => {
      const p = prepareRun(run);
      if (p) segments.add(p.decoded);
      return run;
    },
    tag: (tagText) => {
      const re = new RegExp(`(?:^|\\s)(?:${TRANS_ATTRS})\\s*=\\s*(["'])((?:[^\\\\]|\\\\.)*?)\\1`, 'g');
      let m;
      while ((m = re.exec(tagText))) {
        const decoded = decodeEntities(m[2]).replace(/\s+/g, ' ').trim();
        if (decoded && !isTechnical(decoded)) segments.add(decoded);
      }
      return tagText;
    },
    attrExpr: (inner) => {
      const re = new RegExp(`(?:${KV_KEYS})\\s*:\\s*(["'])((?:[^\\\\]|\\\\.)*?)\\1`, 'g');
      let m;
      while ((m = re.exec(inner))) {
        const decoded = decodeEntities(m[2]).replace(/\s+/g, ' ').trim();
        if (decoded && !isTechnical(decoded)) segments.add(decoded);
      }
      return inner;
    },
  };
  const { fm, hasFm, tpl } = splitFrontmatter(compSrc);
  if (hasFm) {
    const re = new RegExp(`(?:${KV_KEYS})\\s*:\\s*(["'])((?:[^\\\\]|\\\\.)*?)\\1`, 'g');
    let m;
    while ((m = re.exec(fm))) {
      const decoded = decodeEntities(m[2]).replace(/\s+/g, ' ').trim();
      if (decoded && !isTechnical(decoded)) segments.add(decoded);
    }
  }
  transformTemplate(tpl, visit);
  return segments;
}

function applyTranslations(compSrc, lang, sourceLang, dict) {
  let misses = 0;
  let eligible = 0;
  const lookup = (decoded) => {
    eligible++;
    const t = dict.get(decoded);
    if (t === undefined) {
      misses++;
      return null;
    }
    return t;
  };
  const visit = {
    text: (run) => {
      const p = prepareRun(run);
      if (!p) return run;
      const t = lookup(p.decoded);
      if (!t) return run;
      return p.lead + encodeText(t) + p.trail;
    },
    tag: (tagText) => attrReplace(tagText, lookup),
    attrExpr: (inner) => kvReplace(inner, lookup),
  };
  const { fm, sep, tpl, hasFm } = splitFrontmatter(compSrc);
  let newFm = fm;
  if (hasFm) {
    newFm = kvReplace(fm, lookup);
    // 组件默认 lang 指向自身语言（页面显式传 lang，这里只改默认值）
    newFm = newFm.replace(/(lang\s*=\s*)(['"])([a-z]{2})\2/, (m0, a, q) => `${a}${q}${lang}${q}`);
  }
  const newTpl = transformTemplate(tpl, visit);
  return {
    out: hasFm ? `---\n${newFm}\n---${sep}${newTpl}` : newTpl,
    misses,
    eligible,
  };
}

// ---------------------------------------------------------------------------
// 页面接线（磁盘组件驱动，幂等）
// ---------------------------------------------------------------------------

async function wirePage(page, fmtFn) {
  let src = fs.readFileSync(page.file, 'utf8').replace(/\r\n/g, '\n');
  // 重新扫描磁盘：本轮新生成的组件也要接线
  const compDir = path.join(COMPONENTS_DIR, page.group);
  const onDisk = new Set();
  for (const f of fs.readdirSync(compDir)) {
    const cm = f.match(new RegExp(`^${page.name}\\.([a-z]{2})\\.astro$`));
    if (cm) onDisk.add(cm[1]);
  }
  const importedLangs = new Set(page.imports.map((im) => im.lang));
  const toWire = GRAD.filter((l) => onDisk.has(l) && !importedLangs.has(l));
  if (toWire.length === 0) return false;

  const last = page.imports[page.imports.length - 1];
  // 前缀从 import 变量名去掉语言后缀推导（De/En/Cs/Ja…均为 大写+小写 两字符）
  const prefix = last.var.replace(/(?:[A-Z][a-z])$/, '');

  const anchorRe = new RegExp(
    `^import ${last.var} from '~/components/${page.group}/${page.name}\\.${last.lang}\\.astro';$`,
    'm'
  );
  const am = src.match(anchorRe);
  if (!am) {
    console.error(`  [wire-error] anchor import not found in ${path.relative(ROOT, page.file)}`);
    return false;
  }
  const newImports = toWire
    .map((l) => `import ${prefix}${LANG_CAP[l]} from '~/components/${page.group}/${page.name}.${l}.astro';`)
    .join('\n');
  const insertAt = am.index + am[0].length;
  src = src.slice(0, insertAt) + '\n' + newImports + src.slice(insertAt);

  const firstEntry = `de: ${prefix}De`;
  const mIdx = src.indexOf(firstEntry);
  if (mIdx === -1) {
    console.error(`  [wire-error] Body map not found in ${path.relative(ROOT, page.file)}`);
    return false;
  }
  const open = src.lastIndexOf('{', mIdx);
  if (open === -1 || open < insertAt) {
    console.error(`  [wire-error] Body map brace not found in ${path.relative(ROOT, page.file)}`);
    return false;
  }
  const close = matchBrace(src, open);
  if (close === -1) {
    console.error(`  [wire-error] unterminated Body map in ${path.relative(ROOT, page.file)}`);
    return false;
  }
  const entries = toWire.map((l) => `${l}: ${prefix}${LANG_CAP[l]}`).join(', ');
  // 回退 close 前的空白与尾逗号，保证插入后是合法的单逗号分隔
  let cut = close;
  while (cut > open && /[\s,]/.test(src[cut - 1])) cut--;
  src = src.slice(0, cut) + ', ' + entries + src.slice(close);

  fs.writeFileSync(page.file, await fmtFn(src), 'utf8');
  return true;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const onlyLang = (args.find((a) => a.startsWith('--lang=')) || '').replace('--lang=', '') || null;
const STUB = args.includes('--stub');
const DRY = args.includes('--dry-run');

const pages = discoverPages();
if (pages.length === 0) {
  console.log('[body-components] no wired pages found — nothing to do');
  process.exit(0);
}
console.log(`[body-components] discovered ${pages.length} pages; stub=${STUB} dry=${DRY} lang=${onlyLang || 'all'}`);

// 每页目标语言过滤
const pending = [];
for (const page of pages) {
  const targets = onlyLang ? page.targets.filter((l) => l === onlyLang) : page.targets;
  if (targets.length > 0) pending.push({ ...page, targets });
  else if (onlyLang) console.log(`  [done] ${page.group}/${page.name} has nothing pending for ${onlyLang}`);
}

// phase 1: 提取
const segmentsBySource = new Map(); // sourceLang -> Set<segment>
for (const page of pending) {
  const srcFile = path.join(COMPONENTS_DIR, page.group, `${page.name}.${page.sourceLang}.astro`);
  const compSrc = fs.readFileSync(srcFile, 'utf8').replace(/\r\n/g, '\n');
  page.compSrc = compSrc;
  if (!segmentsBySource.has(page.sourceLang)) segmentsBySource.set(page.sourceLang, new Set());
  const segs = extractSegments(compSrc);
  page.segmentCount = segs.size;
  for (const s of segs) segmentsBySource.get(page.sourceLang).add(s);
}

const totalSegments = [...segmentsBySource.values()].reduce((n, s) => n + s.size, 0);
const totalJobs = pending.reduce((n, p) => n + p.targets.length * p.segmentCount, 0);

console.log(`[extract] pages=${pending.length} uniqueSegments=${totalSegments} translateJobs=${totalJobs}`);
if (DRY) {
  for (const page of pending) {
    console.log(
      `  ${page.group}/${page.name}: src=${page.sourceLang} targets=${page.targets.join(',')} segments=${page.segmentCount}`
    );
  }
  let shown = 0;
  let longCount = 0;
  for (const [sl, segs] of segmentsBySource) {
    for (const s of segs) {
      if (s.length > 450) longCount++;
      if (shown < 12) {
        console.log(`  sample[${sl}] ${s.slice(0, 110)}`);
        shown++;
      }
    }
  }
  console.log(`[dry-run] segments>450 chars (MyMemory-excluded if Google down): ${longCount}`);
  process.exit(0);
}

// phase 2: 翻译 —— 批量端点为主（translate_a/t 一次最多 ~30 段，把请求数降一个
// 数量级，绕开 gtx 对 CI/数据中心 IP 的 429 硬限速），批量失败逐段回退
// （single 端点 + MyMemory）。本地直连被墙时设 GOOGLE_PROXY 走 curl SOCKS 代理。
loadCache();
const dicts = new Map(); // `${lang}` -> Map<segment, translated>
const startedAt = Date.now();

async function googleFetchJson(url) {
  if (GOOGLE_PROXY) {
    const { stdout } = await execFileP('curl', ['-s', '--max-time', '30', '-x', GOOGLE_PROXY, url], {
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    });
    return JSON.parse(stdout);
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  return res.json();
}

// 按 URL 编码长度与条数分批（gtx 对 URL 长度敏感，~4KB 内稳妥）
function buildBatches(items, maxChars = 3800, maxItems = 30) {
  const batches = [];
  let cur = [];
  let curLen = 0;
  for (const item of items) {
    const enc = encodeURIComponent(item.preserved).length + 3;
    if (cur.length > 0 && (curLen + enc > maxChars || cur.length >= maxItems)) {
      batches.push(cur);
      cur = [];
      curLen = 0;
    }
    cur.push(item);
    curLen += enc;
  }
  if (cur.length > 0) batches.push(cur);
  return batches;
}

async function googleTranslateBatch(items, sourceLang, lang) {
  const params = items.map((x) => `q=${encodeURIComponent(x.preserved)}`).join('&');
  const url = `${GOOGLE_BATCH_URL}?client=gtx&sl=${sourceLang}&tl=${lang}&${params}`;
  const data = await googleFetchJson(url);
  if (!Array.isArray(data) || data.length !== items.length) return null;
  return data.map((entry) => (Array.isArray(entry) ? entry[0] : entry));
}

const allLangs = [...new Set(pending.flatMap((p) => p.targets))];
for (const lang of allLangs) {
  if (!dicts.has(lang)) dicts.set(lang, new Map());
  const dict = dicts.get(lang);

  // 预热：cache 已有译文直接进 dict，幂等重跑不重译
  for (const sl of ['de', 'en']) {
    const pfx = `${sl}>${lang}::`;
    for (const [k, v] of Object.entries(cache)) {
      if (k.startsWith(pfx)) dict.set(k.slice(pfx.length), v);
    }
  }

  // 按源语言归组本语言待译段（去重、跳过已有）
  const bySource = new Map();
  for (const page of pending) {
    if (!page.targets.includes(lang)) continue;
    if (!bySource.has(page.sourceLang)) bySource.set(page.sourceLang, new Set());
    for (const seg of segmentsBySource.get(page.sourceLang)) {
      if (!dict.has(seg)) bySource.get(page.sourceLang).add(seg);
    }
  }

  for (const [sourceLang, segSet] of bySource) {
    if (segSet.size === 0) continue;
    if (STUB) {
      for (const s of segSet) dict.set(s, `[${lang}] ${s}`);
      continue;
    }
    const items = [...segSet].map((s) => {
      const { text: preserved, placeholders } = preserveTerms(s);
      return { seg: s, preserved, placeholders };
    });
    const batches = buildBatches(items);
    let batchNo = 0;
    for (const batch of batches) {
      batchNo++;
      let results = null;
      for (let attempt = 0; attempt < 2 && !results; attempt++) {
        try {
          results = await googleTranslateBatch(batch, sourceLang, lang);
        } catch {
          /* retry / fallback */
        }
        if (!results && attempt === 0) await sleep(3000);
      }
      if (results) {
        for (let i = 0; i < batch.length; i++) {
          let t = (results[i] || '').trim();
          if (t) {
            t = restoreTerms(t, batch[i].placeholders);
            if (t) {
              dict.set(batch[i].seg, t);
              cache[`${sourceLang}>${lang}::${batch[i].seg}`] = t;
              apiCalls++;
            }
          }
        }
      }
      // 批量失败/漏译的段：逐段回退（single Google → MyMemory → 缓存）
      for (const item of batch) {
        if (dict.has(item.seg)) continue;
        const t = await translateText(item.seg, lang, sourceLang);
        if (t !== null && t !== undefined) {
          dict.set(item.seg, t);
        } else {
          console.log(`  [miss] ${sourceLang}>${lang}: ${JSON.stringify(item.seg.slice(0, 140))}`);
        }
      }
      if (batchNo % 10 === 0 || batchNo === batches.length) {
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        console.log(
          `  [${lang}] batch ${batchNo}/${batches.length} (${elapsed}s, api=${apiCalls} cache=${cacheHits} dict=${dict.size})`
        );
        saveCache();
      }
      await sleep(RATE_MS + Math.floor(Math.random() * 200));
    }
  }
}
saveCache();

// phase 3: 生成组件（任一段落缺译 → 该组件本轮跳过，保持无半译文件）
const prettierConfig = (await prettier.resolveConfig(path.join(ROOT, 'astro.config.mjs'))) || {};
const fmt = (code) => prettier.format(code, { ...prettierConfig, parser: 'astro', plugins: [astroPlugin] });

let written = 0;
let skippedPartial = 0;
for (const page of pending) {
  for (const lang of page.targets) {
    const dict = dicts.get(lang);
    const { out, misses, eligible } = applyTranslations(page.compSrc, lang, page.sourceLang, dict);
    if (misses > 0) {
      skippedPartial++;
      console.log(
        `  [partial-skip] ${page.group}/${page.name}.${lang}: ${misses}/${eligible} segments untranslated — retry next run`
      );
      continue;
    }
    const target = path.join(COMPONENTS_DIR, page.group, `${page.name}.${lang}.astro`);
    fs.writeFileSync(target, await fmt(out), 'utf8');
    written++;
  }
}

// phase 4: 接线（遍历全部页面，wirePage 幂等且自愈——不限于本轮翻译过的页面）
let wired = 0;
for (const page of pages) {
  if (await wirePage(page, fmt)) wired++;
}

const elapsed = Math.round((Date.now() - startedAt) / 1000);
console.log(
  `[body-components] components=${written} partialSkipped=${skippedPartial} pagesWired=${wired} apiCalls=${apiCalls} cacheHits=${cacheHits} elapsed=${elapsed}s`
);
if (written > 0 && !STUB) {
  console.log('Next: npx prettier --check on changed files, astro check, then commit.');
}
