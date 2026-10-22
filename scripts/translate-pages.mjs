#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PAGES = ['ce-compliance', 'technical-drawings', 'oem-odm-rib-boats', 'factory-audit'];

const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'pl', 'ar', 'nl', 'sv', 'no', 'el', 'fi', 'da', 'zh'];

const CACHE_FILE = path.join(ROOT, '.cache', 'page-translate-cache.json');
const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const RATE_MS = 100;
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
  'amount',
  'rating',
  'cta_href',
  'cta_text',
]);

const SKIP_EXACT = new Set(['primary', 'Best Seller', 'Professional', 'Premium', 'Entrepreneur']);

let cache = {};
let cacheHits = 0;
let apiCalls = 0;

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

function shouldTranslate(key, value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v || v.length < 2) return false;
  if (NON_TEXT_KEYS.has(key)) return false;
  if (v.startsWith('http') || v.startsWith('/') || v.startsWith('tabler:')) return false;
  if (SKIP_EXACT.has(v)) return false;
  if (/^\d+[\d,.+-]*$/.test(v)) return false;
  if (/^\d{4}$/.test(v)) return false;
  return true;
}

async function translateText(text, lang) {
  const ck = `${lang}::${text}`;
  if (cache[ck]) {
    cacheHits++;
    return cache[ck];
  }
  if (DRY_RUN) return text;

  try {
    const gUrl = `${GOOGLE_URL}?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
    const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(10000) });
    const gData = await gRes.json();
    if (Array.isArray(gData) && gData[0]) {
      let t = gData[0].map((seg) => seg[0]).join('');
      t = t.trim();
      if (t && t !== text) {
        cache[ck] = t;
        apiCalls++;
        return t;
      }
    }
  } catch {
    /* fall through to MyMemory */
  }

  try {
    const mUrl = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=en|${lang}&de=translate@inflatablepoolfactory.com`;
    const mRes = await fetch(mUrl, { signal: AbortSignal.timeout(10000) });
    const mData = await mRes.json();
    if (mData.responseStatus === 200 && mData.responseData?.translatedText) {
      let t = mData.responseData.translatedText;
      if (t.toUpperCase() === t && text.length > 5 && /[a-z]/.test(text)) t = text;
      cache[ck] = t;
      apiCalls++;
      return t;
    }
  } catch {
    /* ignore */
  }
  return text;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateObj(obj, lang) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    const result = [];
    for (let i = 0; i < obj.length; i++) {
      result.push(await translateObj(obj[i], lang));
    }
    return result;
  }
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      if (shouldTranslate(k, v)) {
        result[k] = await translateText(v, lang);
        await sleep(RATE_MS);
      } else {
        result[k] = v;
      }
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

  let done = 0,
    skipped = 0;

  for (const page of PAGES) {
    const enPath = path.join(ROOT, 'src/data/pages', `${page}.yaml`);
    if (!fs.existsSync(enPath)) {
      console.log(`  SKIP ${page}: EN not found`);
      continue;
    }
    const enDoc = YAML.parse(fs.readFileSync(enPath, 'utf8'));
    console.log(`\n--- ${page} ---`);

    for (const lang of LANGS) {
      const outDir = path.join(ROOT, 'src/data/pages', lang);
      const outPath = path.join(outDir, `${page}.yaml`);

      if (fs.existsSync(outPath) && !FORCE) {
        const existingDoc = YAML.parse(fs.readFileSync(outPath, 'utf8'));
        const enJson = JSON.stringify(enDoc);
        const existingJson = JSON.stringify(existingDoc);
        if (enJson !== existingJson) {
          skipped++;
          continue;
        }
      }

      if (DRY_RUN) {
        console.log(`  ${lang}: would translate ${page}`);
        continue;
      }

      try {
        const translated = await translateObj(enDoc, lang);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, YAML.stringify(translated, { lineWidth: 0, singleQuote: true }), 'utf8');
        saveCache();
        done++;
        console.log(`  ${lang}: done (api=${apiCalls})`);
      } catch (err) {
        saveCache();
        console.log(`  ${lang}: ERROR - ${err.message}`);
      }
    }
  }

  saveCache();
  console.log(`\n=== Done: created=${done} skipped=${skipped} apiCalls=${apiCalls} cacheHits=${cacheHits} ===`);
}

main().catch(console.error);
