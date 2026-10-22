#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CONFIG_PATH = path.join(ROOT, 'src/data/site/i18n-config.json');
const CACHE_FILE = path.join(ROOT, '.cache', 'i18n-translate-cache.json');
const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const RATE_MS = 300;
const DRY_RUN = process.argv.includes('--dry-run');

const SKIP_PATTERNS = [
  /^(ISO|CE|OEM|ODM|SUP|RIB|PVC|Hypalon|Drop-Stitch|CSM|UV|RFID|SLA|MOQ|FOB|CIF|BSCI|REACH|UKCA|EVA|PFD|TLDR|FAQ)[\s/]|^(ISO|CE|OEM|ODM|SUP|RIB|PVC|Hypalon|Drop-Stitch|CSM|UV|RFID|SLA|MOQ|FOB|CIF|BSCI|REACH|UKCA|EVA|PFD|TLDR|FAQ)$/,
];

let cache = {};
let apiCalls = 0;
let cacheHits = 0;

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

function shouldTranslate(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v || v.length < 3) return false;
  if (/^\d+[\d,.+-]*$/.test(v)) return false;
  for (const p of SKIP_PATTERNS) {
    if (p.test(v)) return false;
  }
  if (!/[a-zA-Z]{3,}/.test(v)) return false;
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

async function main() {
  loadCache();
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const enKeys = Object.keys(config.en);
  const langs = Object.keys(config).filter((l) => l !== 'en');

  let translated = 0;
  let skipped = 0;

  for (const lang of langs) {
    console.log(`\n--- ${lang} ---`);
    let langTranslated = 0;

    for (const key of enKeys) {
      const enVal = config.en[key];
      const langVal = config[lang][key];

      // Skip if already translated (different from EN)
      if (langVal && langVal !== enVal) continue;

      // Skip if value shouldn't be translated
      if (!shouldTranslate(enVal)) {
        skipped++;
        continue;
      }

      // Translate
      const translated_val = await translateText(enVal, lang);
      await sleep(RATE_MS);

      if (translated_val !== enVal) {
        config[lang][key] = translated_val;
        langTranslated++;
        translated++;
      } else {
        skipped++;
      }
    }
    if (langTranslated > 0) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
      saveCache();
    }
    console.log(`  ${lang}: ${langTranslated} keys translated`);
  }

  console.log(`\n=== Done ===`);
  console.log(`Translated: ${translated}, Skipped: ${skipped}`);
  console.log(`API calls: ${apiCalls}, Cache hits: ${cacheHits}`);
}

main().catch(console.error);
