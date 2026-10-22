#!/usr/bin/env node
/**
 * translate-pages-bing.mjs
 *
 * Translate missing per-language page YAMLs (src/data/pages/<lang>/<page>.yaml)
 * using the Bing web translator endpoint (cn.bing.com, direct connection —
 * no proxy needed). Falls back gracefully and shares the page-translate cache
 * with translate-pages.mjs (.cache/page-translate-cache.json).
 *
 * Usage:
 *   node scripts/translate-pages-bing.mjs [--page=X] [--lang=Y] [--force] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// page -> target languages (languages that are missing this page's YAML)
const PLAN = {
  'oem-odm': ['sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt'],
  'quality-control': ['sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt'],
  'why-inflatable-pool-factory': ['sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt'],
  'oem-odm-blueprint': ['sv', 'da', 'el', 'no', 'ru', 'nl', 'fi', 'pl', 'ar', 'pt', 'de', 'fr', 'es', 'it'],
};

const CACHE_FILE = path.join(ROOT, '.cache', 'page-translate-cache.json');
const RATE_MS = 250;
const SESSION_REFRESH_EVERY = 200;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const argOf = (name) => {
  const a = process.argv.find((s) => s.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
};
const FILTER_PAGE = argOf('page');
const FILTER_LANG = argOf('lang');
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

const NON_TEXT_KEYS = new Set([
  'src',
  'href',
  'icon',
  'variant',
  'link',
  'id',
  'source',
  'badge',
  'tag',
  'rating',
  'cta_href',
]);
const SKIP_EXACT = new Set(['primary', 'Best Seller', 'Professional', 'Premium', 'Entrepreneur']);

// --- placeholder protection -----------------------------------------------
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
  /\bB2B\b/g,
  /\bROI\b/g,
  /\+/g,
  /→/g,
  /←/g,
  /±/g,
];

const IRREGULAR_WS = /[\u00A0\u2000-\u200A\u202F\u205F]/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

// site lang code -> Bing/Microsoft translator code
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

function restore(text, placeholders) {
  let result = cleanWs(text);
  if (!placeholders.length) return result;
  // primary: <phN> style (MT engines preserve inline tags well); tolerate
  // full-width brackets (ja: ＜ph0＞/〈ph1〉) and corrupted closers (ar: "<ph0؟")
  result = result.replace(/[<＜〈]ph\s*(\d+)\s*\/?[>＞〉]?/gi, (m, d) => {
    const i = Number(d);
    return i < placeholders.length ? placeholders[i] : m;
  });
  result = result.replace(/[<＜〈]ph\s*(\d+)\s*[？?]/gi, (m, d) => {
    const i = Number(d);
    return i < placeholders.length ? placeholders[i] : m;
  });
  // legacy ⟦N⟧ tokens, just in case
  result = result.replace(/\u27E6(\d+)\u27E7/g, (m, d) => {
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
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateText(text, lang) {
  const ck = `${lang}::${text}`;
  if (cache[ck]) {
    cacheHits++;
    return cache[ck];
  }
  if (DRY_RUN) return text;

  const { text: masked, placeholders } = preserve(text);
  // acronym/number-only strings (ISO 9001:2015, UKCA, 4" — 15 PSI…) are language-neutral: copy
  if (!/[a-zA-Z]{2,}/.test(masked.replace(/<ph\d+>/g, ''))) return text;

  let bestEffort = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (requestCount >= SESSION_REFRESH_EVERY) await refreshSession();
    requestCount++;
    let out;
    try {
      out = await bingOnce(masked, bingCode(lang));
    } catch (e) {
      out = { error: e.message };
    }
    if (out.text) {
      const restored = restore(out.text, placeholders).trim();
      if (restored) {
        const kept = (out.text.match(/[<＜〈]ph\s*\d+/gi) || []).length;
        if (kept >= placeholders.length) {
          cache[ck] = restored;
          apiCalls++;
          await sleep(RATE_MS);
          return restored;
        }
        bestEffort = restored; // MT dropped some placeholders — retry, keep as fallback
      }
    }
    await refreshSession();
    await sleep(1000 * (attempt + 1));
  }
  if (bestEffort) {
    cache[ck] = bestEffort;
    apiCalls++;
    return bestEffort;
  }
  failures++;
  return text; // fall back to English, do not cache
}

function shouldTranslate(key, value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v || v.length < 2) return false;
  if (NON_TEXT_KEYS.has(key)) return false;
  if (key === 'amount') return /[a-zA-Z]{3,}/.test(v); // "Since 2012" yes, "15,000+" no
  if (v.startsWith('http') || v.startsWith('/') || v.startsWith('tabler:')) return false;
  if (SKIP_EXACT.has(v)) return false;
  if (/^\d+[\d,.+%+-]*$/.test(v)) return false;
  if (/^\d{4}$/.test(v)) return false;
  return true;
}

async function translateObj(obj, lang) {
  if (Array.isArray(obj)) {
    const result = [];
    for (const el of obj) {
      if (typeof el === 'string') {
        result.push(shouldTranslate('', el) ? await translateText(el, lang) : el);
      } else if (el && typeof el === 'object') {
        result.push(await translateObj(el, lang));
      } else {
        result.push(el);
      }
    }
    return result;
  }
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      result[k] = shouldTranslate(k, v) ? await translateText(v, lang) : v;
    } else if (v && typeof v === 'object') {
      result[k] = await translateObj(v, lang);
    } else {
      result[k] = v;
    }
  }
  return result;
}

async function main() {
  loadCache();
  console.log(`Cache: ${Object.keys(cache).length} entries`);
  await refreshSession();
  console.log(`Bing session ok (ig=${ig.slice(0, 8)}…)`);

  let done = 0;
  let skipped = 0;

  for (const [page, langs] of Object.entries(PLAN)) {
    if (FILTER_PAGE && page !== FILTER_PAGE) continue;
    const enPath = path.join(ROOT, 'src/data/pages', `${page}.yaml`);
    if (!fs.existsSync(enPath)) {
      console.log(`  SKIP ${page}: EN not found`);
      continue;
    }
    const enDoc = YAML.parse(fs.readFileSync(enPath, 'utf8'));
    console.log(`\n--- ${page} ---`);

    for (const lang of langs) {
      if (FILTER_LANG && lang !== FILTER_LANG) continue;
      const outDir = path.join(ROOT, 'src/data/pages', lang);
      const outPath = path.join(outDir, `${page}.yaml`);

      if (fs.existsSync(outPath) && !FORCE) {
        skipped++;
        continue;
      }
      if (DRY_RUN) {
        console.log(`  ${lang}: would translate ${page}`);
        continue;
      }

      try {
        const api0 = apiCalls;
        const cache0 = cacheHits;
        const fail0 = failures;
        const translated = await translateObj(enDoc, lang);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, YAML.stringify(translated, { lineWidth: 0, singleQuote: true }), 'utf8');
        saveCache();
        done++;
        console.log(`  ${lang}: done (api=${apiCalls - api0} cache=${cacheHits - cache0} fail=${failures - fail0})`);
      } catch (err) {
        saveCache();
        console.log(`  ${lang}: ERROR - ${err.message}`);
        break;
      }
    }
  }

  saveCache();
  console.log(
    `\n=== Done: created=${done} skipped=${skipped} apiCalls=${apiCalls} cacheHits=${cacheHits} failures=${failures} ===`
  );
}

main().catch((e) => {
  saveCache();
  console.error('FATAL:', e.message);
  process.exit(1);
});
