#!/usr/bin/env node
/**
 * translate-content-v2.mjs
 *
 * Translate content-v2 guides (src/data/site/content-v2.yaml, 75 records) and
 * business articles (src/data/content-v2-business.ts, 11 records) into the
 * remaining GRAD languages using the Bing web translator (cn.bing.com direct).
 *
 * Output:
 *   src/data/site/content-v2.<lang>.yaml
 *   src/data/content-v2-business.<lang>.ts
 *
 * Usage:
 *   node scripts/translate-content-v2.mjs [--lang=cs,sv] [--force] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LANGS = ['cs', 'sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt'];

const MAIN_EN = path.join(ROOT, 'src/data/site/content-v2.yaml');
const MAIN_OUT = (lang) => path.join(ROOT, 'src/data/site', `content-v2.${lang}.yaml`);
const BIZ_EN = path.join(ROOT, 'src/data/content-v2-business.ts');
const BIZ_OUT = (lang) => path.join(ROOT, 'src/data', `content-v2-business.${lang}.ts`);
const BIZ_TMP = path.join(ROOT, '.cache', 'content-v2-business-src.mjs');

const CACHE_FILE = path.join(ROOT, '.cache', 'content-v2-bing-cache.json');
const RATE_MS = 250;
const SESSION_REFRESH_EVERY = 200;
const SAVE_EVERY = 50;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const argOf = (name) => {
  const a = process.argv.find((s) => s.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
};
const FILTER_LANG = argOf('lang');
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

// --- placeholder protection (superset of translate-pages-bing) --------------
const PROTECT_PATTERNS = [
  /<\/?[a-zA-Z][^>]*>/g, // inline HTML tags
  /https?:\/\/[^\s<>"']+/g, // URLs
  /\bInflatable Pool Factory\b/g,
  /\bRIB\b/g,
  /\bRIBs\b/g,
  /\bCE\b/g,
  /\bSOLAS\b/g,
  /\bISO\b/g,
  /\bBSCI\b/g,
  /\bREACH\b/g,
  /\bUSCG\b/g,
  /\bFDA\b/g,
  /\bEMA\b/g,
  /\bOEM\b/g,
  /\bODM\b/g,
  /\bMOQ\b/g,
  /\bMOQs\b/g,
  /\bPVC\b/g,
  /\bEVA\b/g,
  /\bUV\b/g,
  /\bCNC\b/g,
  /\bHP\b/g,
  /\bPSI\b/g,
  /\bFRP\b/g,
  /\bAQHB\b/g,
  /\bAQMT\b/g,
  /\bAQDRB\b/g,
  /\bUKCA\b/g,
  /\bDTEX\b/g,
  /\bAQL\b/g,
  /\bRoHS\b/g,
  /\bEAN\b/g,
  /\bUPC\b/g,
  /\bSKU\b/g,
  /\bERP\b/g,
  /\bFOB\b/g,
  /\bCIF\b/g,
  /\bDDP\b/g,
  /\bNDA\b/g,
  /\bCSM\b/g,
  /\bPFD\b/g,
  /\bPFDs\b/g,
  /\bRCD\b/g,
  /\bSGS\b/g,
  /\bTÜV\b/g,
  /\bHypalon\b/gi,
  /\bValmex\b/gi,
  /\bORCA\b/gi,
  /\bDrop-Stitch\b/gi,
  /\bdrop-stitch\b/g,
  /\bAirDeck\b/g,
  /\bKaBoat\b/g,
  /\bSup\b/g,
  /\bSUP\b/g,
  /\bSUPs\b/g,
  /\biSUP\b/g,
  /\biSUPs\b/g,
  /\bB2B\b/g,
  /\bROI\b/g,
  /\$\d[\d,]*(?:\.\d+)?/g, // $8,000 / $25-40 amounts
  /\+/g,
  /→/g,
  /←/g,
  /±/g,
];

const IRREGULAR_WS = /[\u00A0\u2000-\u200A\u202F\u205F]/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

const BING_LANG = { no: 'nb' };
const bingCode = (lang) => BING_LANG[lang] || lang;

function preserve(text) {
  const placeholders = [];
  let result = text;
  for (const re of PROTECT_PATTERNS) {
    result = result.replace(re, (m) => {
      placeholders.push(m);
      return `<ph${placeholders.length - 1}>`;
    });
  }
  return { text: result, placeholders };
}

// --- placeholder formats (ladder: btag survives where <phN> deterministically drops) ---
const PH_FORMATS = [
  {
    name: 'angle',
    wrap: (i) => `<ph${i}>`,
    normalize: (t) => t,
    kept: (t) => (t.match(/[<＜〈]ph\s*\d/gi) || []).length,
  },
  {
    name: 'btag',
    wrap: (i) => `<b>[[${i}]]</b>`,
    normalize: (t) =>
      t
        .replace(
          /(?:<|＜|〈)b(?:>|＞|〉)?\s*[[［][[［]\s*(\d+)\s*[\]］][\]］]\s*(?:<|＜|〈)\s*\/?\s*b(?:>|＞|〉)?/gi,
          (_m, d) => `<ph${d}>`
        )
        .replace(/[[［][[［]\s*(\d+)\s*[\]］][\]］]/g, (_m, d) => `<ph${d}>`),
    kept: (t) => (t.match(/[[［][[［]\s*\d\s*[\]］][\]］]/g) || []).length,
  },
  {
    name: 'guillemet',
    wrap: (i) => `«ph${i}»`,
    normalize: (t) => t.replace(/«\s*ph\s*(\d+)\s*»/gi, (_m, d) => `<ph${d}>`),
    kept: (t) => (t.match(/«\s*ph\s*\d/gi) || []).length,
  },
];

function restore(text, placeholders) {
  let result = cleanWs(text);
  if (!placeholders.length) return result;
  // primary: <phN> style; tolerate full-width brackets (ja: ＜ph0＞/〈ph1〉) and
  // corrupted closers (ar: "<ph0؟")
  result = result.replace(/[<＜〈]ph\s*(\d+)\s*\/?[>＞〉]?/gi, (m, d) => {
    const i = Number(d);
    return i < placeholders.length ? placeholders[i] : m;
  });
  result = result.replace(/[<＜〈]ph\s*(\d+)\s*[？?]/gi, (m, d) => {
    const i = Number(d);
    return i < placeholders.length ? placeholders[i] : m;
  });
  return cleanWs(result);
}

function cleanWs(text) {
  return text.replace(IRREGULAR_WS, ' ').replace(ZERO_WIDTH, '');
}

// --- Bing web translator ----------------------------------------------------
const jar = new Map();
let ig = null;
let iid = null;
let abuseKey = null;
let abuseToken = null;
let requestCount = 0;

function mergeCookies(res) {
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of setCookies) {
    const [kv] = c.split(';');
    const eq = kv.indexOf('=');
    if (eq > 0) jar.set(kv.slice(0, eq).trim(), kv.slice(eq + 1).trim());
  }
}

async function fetchBing(url, opts = {}, redirects = 0) {
  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  const res = await fetch(url, {
    ...opts,
    redirect: 'manual',
    signal: AbortSignal.timeout(20000),
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'en-US,en;q=0.9',
      ...(opts.headers || {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
  mergeCookies(res);
  if ([301, 302, 303, 307, 308].includes(res.status) && redirects < 5) {
    const loc = res.headers.get('location');
    if (loc) return fetchBing(new URL(loc, url).href, { method: 'GET' }, redirects + 1);
  }
  return res;
}

async function refreshSession() {
  const res = await fetchBing('https://cn.bing.com/translator');
  const page = await res.text();
  ig = /IG:"([^"]+)"/.exec(page)?.[1] || null;
  iid = /data-iid="([^"]+)"/.exec(page)?.[1] || null;
  const km = /params_AbusePreventionHelper\s*=\s*\[(\d+),"([^"]+)"[,}]/.exec(page);
  abuseKey = km?.[1] || null;
  abuseToken = km?.[2] || null;
  requestCount = 0;
  if (!ig || !iid || !abuseKey) throw new Error('Bing session tokens not found');
}

async function bingOnce(text, to) {
  const body = new URLSearchParams({
    fromLang: 'en',
    to,
    text,
    token: abuseToken,
    key: abuseKey,
    tryFetchingGenderDebiasedTranslations: 'true',
  });
  const res = await fetchBing(`https://cn.bing.com/ttranslatev3?isVertical=1&IG=${ig}&IID=${iid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://cn.bing.com/translator' },
    body: body.toString(),
  });
  const raw = await res.text();
  if (!raw) return { error: `empty(status=${res.status})` };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: 'badjson' };
  }
  if (data.statusCode) return { error: `api-${data.statusCode}` };
  const t = Array.isArray(data) ? data[0]?.translations?.[0]?.text : null;
  if (!t) return { error: 'notext' };
  return { text: t };
}

// --- translation with cache -------------------------------------------------
let cache = {};
let cacheHits = 0;
let apiCalls = 0;
let failures = 0;
let sinceSave = 0;

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    /* ignore */
  }
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8');
  sinceSave = 0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateText(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const ck = `${lang}::${text}`;
  if (cache[ck]) {
    cacheHits++;
    return cache[ck];
  }
  if (DRY_RUN) return text;

  const { text: masked, placeholders } = preserve(text);
  // acronym/number-only strings are language-neutral: copy
  if (!/[a-zA-Z]{2,}/.test(masked.replace(/<ph\d+>/g, ''))) return text;

  let bestEffort = null;
  for (let attempt = 0; attempt < PH_FORMATS.length; attempt++) {
    const fmt = PH_FORMATS[attempt];
    const maskedFmt = placeholders.length ? masked.replace(/<ph(\d+)>/g, (_m, i) => fmt.wrap(i)) : masked;
    if (requestCount >= SESSION_REFRESH_EVERY) await refreshSession();
    requestCount++;
    let out;
    try {
      out = await bingOnce(maskedFmt, bingCode(lang));
    } catch (e) {
      out = { error: e.message };
    }
    if (out.text) {
      const normalized = fmt.normalize(out.text);
      const restored = restore(normalized, placeholders).trim();
      if (restored) {
        if (fmt.kept(out.text) >= placeholders.length) {
          cache[ck] = restored;
          apiCalls++;
          if (++sinceSave >= SAVE_EVERY) saveCache();
          await sleep(RATE_MS);
          return restored;
        }
        bestEffort = restored; // MT dropped some placeholders — next format, keep as fallback
      }
    }
    await refreshSession();
    await sleep(1000 * (attempt + 1));
  }
  if (bestEffort) {
    cache[ck] = bestEffort;
    apiCalls++;
    if (++sinceSave >= SAVE_EVERY) saveCache();
    return bestEffort;
  }
  failures++;
  return text; // fall back to English, do not cache
}

// --- content-v2 record translation -------------------------------------------
const TEXT_FIELDS = [
  'title',
  'description',
  'definition',
  'tldr',
  'problem',
  'explanation',
  'solution',
  'recommendation',
];

async function translateRecord(rec, lang) {
  const out = { ...rec };
  for (const f of TEXT_FIELDS) {
    if (typeof rec[f] === 'string' && rec[f].trim()) out[f] = await translateText(rec[f], lang);
  }
  if (Array.isArray(rec.faq) && rec.faq.length) {
    out.faq = [];
    for (const item of rec.faq) {
      out.faq.push({ q: await translateText(item.q, lang), a: await translateText(item.a, lang) });
    }
  }
  return out;
}

function loadBusinessSource() {
  const src = fs.readFileSync(BIZ_EN, 'utf8');
  const stripped = src
    .replace(/^import .*$/gm, '')
    .replace(/export const businessArticles[^=]*=/, 'const businessArticles =');
  fs.mkdirSync(path.dirname(BIZ_TMP), { recursive: true });
  fs.writeFileSync(BIZ_TMP, `${stripped}\nexport { businessArticles };\n`, 'utf8');
  return import(pathToFileURL(BIZ_TMP).href).then((m) => m.businessArticles);
}

function writeBusinessTs(records, lang) {
  const header = `import type { ContentV2Record } from './content-v2';\n\nexport const businessArticles: ContentV2Record[] = `;
  const body = JSON.stringify(records, null, 2);
  fs.writeFileSync(BIZ_OUT(lang), header + body + ';\n', 'utf8');
}

async function main() {
  loadCache();
  console.log(`Cache: ${Object.keys(cache).length} entries`);

  const mainEn = YAML.parse(fs.readFileSync(MAIN_EN, 'utf8'));
  const bizEn = await loadBusinessSource();
  console.log(`Sources: main=${mainEn.length} records, business=${bizEn.length} records`);

  if (!DRY_RUN) {
    await refreshSession();
    console.log(`Bing session ok (ig=${ig.slice(0, 8)}…)`);
  }

  const langs = FILTER_LANG ? LANGS.filter((l) => FILTER_LANG.split(',').includes(l)) : LANGS;
  for (const lang of langs) {
    console.log(`\n--- ${lang} ---`);

    // main guides
    if (fs.existsSync(MAIN_OUT(lang)) && !FORCE) {
      console.log(`  main: exists, skip`);
    } else if (DRY_RUN) {
      console.log(`  main: would translate ${mainEn.length} records`);
    } else {
      try {
        const api0 = apiCalls;
        const cache0 = cacheHits;
        const fail0 = failures;
        const out = [];
        for (const rec of mainEn) out.push(await translateRecord(rec, lang));
        fs.writeFileSync(MAIN_OUT(lang), YAML.stringify(out, { lineWidth: 0, singleQuote: true }), 'utf8');
        saveCache();
        console.log(`  main: done (api=${apiCalls - api0} cache=${cacheHits - cache0} fail=${failures - fail0})`);
      } catch (err) {
        saveCache();
        console.log(`  main: ERROR - ${err.message}`);
        break;
      }
    }

    // business articles
    if (fs.existsSync(BIZ_OUT(lang)) && !FORCE) {
      console.log(`  business: exists, skip`);
    } else if (DRY_RUN) {
      console.log(`  business: would translate ${bizEn.length} records`);
    } else {
      try {
        const api0 = apiCalls;
        const cache0 = cacheHits;
        const fail0 = failures;
        const out = [];
        for (const rec of bizEn) out.push(await translateRecord(rec, lang));
        writeBusinessTs(out, lang);
        saveCache();
        console.log(`  business: done (api=${apiCalls - api0} cache=${cacheHits - cache0} fail=${failures - fail0})`);
      } catch (err) {
        saveCache();
        console.log(`  business: ERROR - ${err.message}`);
        break;
      }
    }
  }

  saveCache();
  console.log(`\n=== Done: apiCalls=${apiCalls} cacheHits=${cacheHits} failures=${failures} ===`);
}

main().catch((e) => {
  saveCache();
  console.error('FATAL:', e.message);
  process.exit(1);
});
