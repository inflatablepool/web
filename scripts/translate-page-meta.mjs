#!/usr/bin/env node
/**
 * scripts/translate-page-meta.mjs
 *
 * 翻译 src/pages/[lang]/**.astro 中的语言键控 META 块并注入缺失语言条目。
 *
 * 三种声明形态：
 *   const META: Record<string, { title: string; description: string }> = {...}
 *   const PAGE_META: Record<string, { title: string }> = {...}
 *   const PAGE_DESC: Record<string, { description: string }> = {...}
 *
 * 源语言：META 型有 en 键用 en；PAGE_META/PAGE_DESC 无 en 键（英文源在使用处的
 * fallback 字符串里），用 de 作为翻译源（短 title/desc 从德语直接翻译质量可靠）。
 *
 * 翻译走 Google translate_a/single（CI runner 上可用，本地 TCP 被墙自动降级
 * MyMemory），技术术语经 preserveTerms 占位保护，结果缓存 .cache/page-meta-cache.json。
 *
 * 注入格式与 prettier（printWidth 120, singleQuote, tabWidth 2）完全一致：
 *   - 整行 ≤120 字符保持单行；超宽在冒号后断行、值缩进 +2
 *   - PAGE_META 单行条目 `  cs: { title: '...' },` 与既有风格一致
 * 定位用字符串感知花括号匹配（值内含 {}/引号 均不影响），不做行级正则注入。
 *
 * 用法：
 *   node scripts/translate-page-meta.mjs              # 全部缺失语言
 *   node scripts/translate-page-meta.mjs --lang=sv    # 单语言
 *   node scripts/translate-page-meta.mjs --stub       # 本地测试：不联网，注入 [lang] 标记
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src/pages/[lang]');
const CACHE_FILE = path.join(ROOT, '.cache/page-meta-cache.json');
const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const RATE_MS = 900;

const GRAD = ['de', 'fr', 'es', 'it', 'cs', 'sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt'];
const PRINT_WIDTH = 120;

const PRESERVE_PATTERNS = [
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
];

let cache = {};
let apiCalls = 0;
let cacheHits = 0;
let googleFailStreak = 0;
let googleDownUntil = 0;

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    /* ignore */
  }
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}
function saveCache() {
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
function restoreTerms(text, placeholders) {
  let result = text;
  for (let i = placeholders.length - 1; i >= 0; i--) {
    result = result.replace(new RegExp(`__PH${i}__`, 'g'), placeholders[i]);
  }
  return result;
}

async function translateText(text, lang, sourceLang, stub) {
  if (!text) return text;
  if (stub) return `[${lang}] ${text}`;
  const ck = `${lang}::${text}`;
  if (cache[ck] && cache[ck] !== text) {
    cacheHits++;
    return cache[ck];
  }
  const { text: preservedText, placeholders } = preserveTerms(text);

  if (Date.now() >= googleDownUntil) {
    try {
      const gUrl = `${GOOGLE_URL}?client=gtx&sl=${sourceLang}&tl=${lang}&dt=t&q=${encodeURIComponent(preservedText)}`;
      const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(5000) });
      const gData = await gRes.json();
      if (Array.isArray(gData) && gData[0]) {
        let t = gData[0]
          .map((seg) => seg[0])
          .join('')
          .trim();
        if (t && t !== preservedText) {
          t = restoreTerms(t, placeholders);
          cache[ck] = t;
          apiCalls++;
          googleFailStreak = 0;
          return t;
        }
      }
    } catch {
      googleFailStreak++;
      if (googleFailStreak >= 3) {
        googleDownUntil = Date.now() + 15 * 60 * 1000;
        console.log(`  [circuit] Google unreachable x${googleFailStreak}, skipping for 15 min`);
      }
    }
  }

  try {
    const mmDe = process.env.MM_DE || 'translate@inflatablepoolfactory.com';
    const mUrl = `${MYMEMORY_URL}?q=${encodeURIComponent(preservedText)}&langpair=${sourceLang}|${lang}&de=${encodeURIComponent(mmDe)}`;
    const mRes = await fetch(mUrl, { signal: AbortSignal.timeout(15000) });
    if (mRes.status === 429) {
      console.log('  [quota] MyMemory HTTP 429, stopping.');
      saveCache();
      process.exit(2);
    }
    const mData = await mRes.json();
    if (mData.responseStatus === 200 && mData.responseData?.translatedText) {
      let t = mData.responseData.translatedText;
      if (/MYMEMORY WARNING|ALL AVAILABLE FREE TRANSLATIONS/i.test(t)) {
        console.log('  [quota] MyMemory daily quota exhausted, stopping.');
        saveCache();
        process.exit(2);
      }
      t = restoreTerms(t, placeholders);
      if (t && t !== text) {
        cache[ck] = t;
        apiCalls++;
        return t;
      }
    }
  } catch {
    /* fall through to warn */
  }
  console.log(`  [warn] no translation for ${lang}: ${text.slice(0, 50)}...`);
  return null;
}

// 字符串感知花括号匹配
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

function unescapeTs(s) {
  return s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
}

// prettier 引号启发式（makeString）：选转义次数少的引号；相等时用单引号。
// 值内单引号多于双引号 → 双引号包裹（如法语 d'assistance）。
function quoteTs(value) {
  const singles = (value.match(/'/g) || []).length;
  const doubles = (value.match(/"/g) || []).length;
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  if (singles > doubles) return `"${esc(value).replace(/"/g, '\\"')}"`;
  return `'${esc(value).replace(/'/g, "\\'")}'`;
}
// prettier 的 printWidth 按显示宽度计（string-width 语义）：CJK/全角字符占
// 2 列。日文描述用 .length 会低估 40-50%，导致本应断行的行被写成单行，
// CI 的 check:prettier 失败（2026-10 页面 META 注入事故）。
function charW(cp) {
  if (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xa960 && cp <= 0xa97f) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe10 && cp <= 0xfe19) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff)
  )
    return 2;
  return 1;
}
function displayWidth(s) {
  let w = 0;
  for (const ch of s) w += charW(ch.codePointAt(0));
  return w;
}

// 字段值 → TS 字面量。带插值表达式的（__TPLn__ 哨兵仍在值内）输出反引号
// 模板：先转义正文（含哨兵不受影响），再还原 ${...} 表达式本身（不可转义）。
function fieldLit(value, exprs) {
  if (exprs) {
    const esc = value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    let out = esc;
    exprs.forEach((e, i) => {
      out = out.split(`__TPL${i}__`).join(e);
    });
    return '`' + out + '`';
  }
  return quoteTs(value);
}

// prettier 风格输出：key: 'value' —— 超过 printWidth（按显示宽度）在冒号后
// 断行，值缩进 +2
function propLine(indent, key, value, eol, exprs) {
  const lit = fieldLit(value, exprs);
  const oneLine = `${indent}${key}: ${lit},`;
  if (displayWidth(oneLine) <= PRINT_WIDTH) return oneLine;
  return `${indent}${key}:${eol}${indent}  ${lit},`;
}

function langBlock(name, lang, values, eol) {
  // PAGE_META 单行风格：  cs: { title: '...' },
  if (name === 'PAGE_META') {
    const oneLine = `  ${lang}: { title: ${fieldLit(values.title, values.titleTpl)} },`;
    if (displayWidth(oneLine) <= PRINT_WIDTH) return oneLine;
    return `  ${lang}: {${eol}${propLine('    ', 'title', values.title, eol, values.titleTpl)}${eol}  },`;
  }
  const fields = [];
  if (values.title !== undefined) fields.push(propLine('    ', 'title', values.title, eol, values.titleTpl));
  if (values.description !== undefined)
    fields.push(propLine('    ', 'description', values.description, eol, values.descriptionTpl));
  return `  ${lang}: {${eol}${fields.join(eol)}${eol}  },`;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.astro')) out.push(p);
  }
  return out;
}

function parseBlockEntries(block) {
  // 返回 Map<lang, {title?, description?}>：仅识别两空格缩进的语言键条目
  // 注意：regex 不能消费 \r（如 \r?$）——entryRe 的 match 长度用于定位条目 `{`，
  // 消费了 \r 会使 start-1 偏移、matchBrace 从错误位置扫描而整体失效。
  // JS 多行模式的 $ 本身就能匹配 \r 之前的位置，CRLF/LF 通吃。
  const entries = new Map();
  const entryRe = /^ {2}([a-z]{2}): \{$/gm;
  let m;
  while ((m = entryRe.exec(block))) {
    const start = m.index + m[0].length;
    const end = matchBrace(block, start - 1);
    if (end === -1) continue;
    const body = block.slice(start, end);
    const entry = {};
    for (const field of ['title', 'description']) {
      // 引号感知：prettier 会按启发式把含单引号的值重写为双引号字符串
      // （如法语 d'assistance），必须同时匹配两种引号，否则既有条目被
      // 误判缺失而重复注入。\\1 反向引用保证开闭引号一致；内容必须用
      // 惰性量词 —— 贪婪的 [^\\] 会越过闭引号把后续字段一并吞进值里。
      let fm = body.match(new RegExp(`${field}:\\s*(?:\\n\\s+)?(['"])((?:[^\\\\]|\\\\.)*?)\\1`));
      if (fm) {
        entry[field] = unescapeTs(fm[2]);
        continue;
      }
      // 模板字面量：randdcenter 的 description 用反引号；disclaimer/terms 的
      // title 带 ${SITE.name} 插值 —— 插值表达式提取后以 __TPLn__ 哨兵占位，
      // 翻译时随 preserveTerms 的 __PHn__ 一起被保护，输出时还原回反引号模板。
      const tm = body.match(new RegExp(`${field}:\\s*(?:\\n\\s+)?\`((?:[^\\\\\`]|\\\\.)*?)\``));
      if (tm) {
        const raw = tm[1];
        if (raw.includes('${')) {
          const exprs = [];
          entry[field] = raw.replace(/\$\{[^}]*\}/g, (e) => {
            exprs.push(e);
            return `__TPL${exprs.length - 1}__`;
          });
          entry[`${field}Tpl`] = exprs;
        } else {
          entry[field] = unescapeTs(raw);
        }
        continue;
      }
      // 字段存在但值不可解析（如 technology 的 localizePageTitle(page, `...`)）
      // —— 标记为不可注入，调用方据此跳过整块，避免产出违反块类型的残缺条目。
      if (new RegExp(`\\b${field}\\s*:`).test(body)) {
        entry[`${field}Unparseable`] = true;
      }
    }
    if (Object.keys(entry).length > 0) entries.set(m[1], entry);
  }
  // 单行条目：  de: { title: 'Kontakt' },（同样引号感知 + 惰性内容）
  // 注意分组序号：lang=1、引号=2、内容=3，闭引号反向引用是 \2 而非 \1。
  const singleRe = /^ {2}([a-z]{2}): \{ title: (['"])((?:[^\\]|\\.)*?)\2 \},$/gm;
  while ((m = singleRe.exec(block))) {
    entries.set(m[1], { title: unescapeTs(m[3]) });
  }
  return entries;
}

const args = process.argv.slice(2);
const onlyLang = (args.find((a) => a.startsWith('--lang=')) || '').replace('--lang=', '') || null;
const stub = args.includes('--stub');

if (onlyLang && !GRAD.includes(onlyLang)) {
  console.error(`Unknown lang: ${onlyLang}`);
  process.exit(1);
}
if (stub) console.log('[stub mode] no network calls; injecting [lang] markers');

loadCache();
const targets = onlyLang ? [onlyLang] : GRAD;

let injected = 0;
let skippedNoSource = 0;
const touched = [];

for (const file of walk(PAGES_DIR)) {
  let src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  // 仓库标准是 LF（CI 的 check:prettier 以 LF 校验；autocrlf 工作区的 CRLF
  // 只是本地检出形态）。注入一律用 \n，写回时把整个文件归一为 LF，
  // 这样本地 prettier --check 也能真实通过，且 git blob 与 CI 完全一致。
  const eol = '\n';
  const declRe = /const (META|PAGE_META|PAGE_DESC)[^=]*=\s*\{/g;
  let m;
  let fileChanged = false;
  while ((m = declRe.exec(src))) {
    const name = m[1];
    const openPos = m.index + m[0].length - 1;
    const closePos = matchBrace(src, openPos);
    if (closePos === -1) continue;
    const block = src.slice(openPos, closePos + 1);
    const entries = parseBlockEntries(block);
    if (entries.size === 0) continue;

    // 源语言：en 优先（META 型），否则 de（PAGE_META/PAGE_DESC 型）
    const sourceLang = entries.has('en') ? 'en' : entries.has('de') ? 'de' : null;
    if (!sourceLang) {
      skippedNoSource++;
      continue;
    }
    const source = entries.get(sourceLang);

    // 源条目存在不可解析字段（localizePageTitle(page, `...`) 等函数调用）时
    // 跳过整块：强行注入会产出缺 title/description 的残缺条目，违反块的
    // Record 类型（astro check ts(2741)）。运行期 META[lang] || META.en 兜底。
    if (source.titleUnparseable || source.descriptionUnparseable) {
      skippedNoSource++;
      console.log(`${rel} :: ${name} skip (unparseable source field)`);
      continue;
    }

    const missing = targets.filter((l) => !entries.has(l));
    if (missing.length === 0) continue;

    const additions = [];
    for (const lang of missing) {
      const values = {};
      let ok = true;
      if (source.title !== undefined) {
        const t = await translateText(source.title, lang, sourceLang, stub);
        if (t) {
          values.title = t;
          if (source.titleTpl) values.titleTpl = source.titleTpl;
        } else ok = false;
      }
      if (source.description !== undefined) {
        const d = await translateText(source.description, lang, sourceLang, stub);
        if (d) {
          values.description = d;
          if (source.descriptionTpl) values.descriptionTpl = source.descriptionTpl;
        } else ok = false;
      }
      if (ok && Object.keys(values).length > 0) {
        additions.push(langBlock(name, lang, values, eol));
        injected++;
        if (apiCalls > 0 && apiCalls % 25 === 0) saveCache();
        if (!stub) await new Promise((r) => setTimeout(r, RATE_MS));
      }
    }
    if (additions.length === 0) continue;

    // 注入：块闭合 } 前（闭合 } 前必有换行）
    const insertion = additions.join(eol) + eol;
    const before = src.slice(0, closePos);
    const after = src.slice(closePos);
    if (!before.endsWith('\n')) {
      console.error(`  [skip] unexpected block end in ${rel} (${name})`);
      continue;
    }
    src = before + insertion + after;
    fileChanged = true;
    // 修正 declRe 继续扫描的位置（src 变长）
    declRe.lastIndex = closePos + insertion.length + 1;
    console.log(`${rel} :: ${name} +${additions.length} langs`);
  }
  if (fileChanged) {
    fs.writeFileSync(file, src.replace(/\r\n/g, '\n'), 'utf8');
    touched.push(rel);
  }
}

saveCache();
console.log(
  `[page-meta] injected=${injected} files=${touched.length} apiCalls=${apiCalls} cacheHits=${cacheHits} noSource=${skippedNoSource}`
);
if (touched.length > 0 && !stub) {
  console.log('Next: run prettier --check & astro check, then commit.');
}
