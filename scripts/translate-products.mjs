#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PRODUCTS_PATH = path.join(ROOT, 'src/data/products.ts');
const TEXTS_PATH = path.join(ROOT, 'src/data/product-texts.ts');
const CACHE_FILE = path.join(ROOT, '.cache', 'product-translate-cache.json');

const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const RATE_MS = 300;

const RIB_IDS = [
  'ap330',
  'ap360',
  'ap390',
  'ap420',
  'ap460',
  'ap520',
  'ap560',
  'ap660',
  'ap700',
  'ap760',
  'ap800',
  'ap900',
  'df420',
  'df460',
  'df500',
  'df540',
  'df540-coaster',
  'df600',
  'df700',
  'df760',
  'df860',
  'ex7',
  'ex9',
  'sw240',
  'sw260',
  'sw290',
  'sw310',
  'sw340',
  'vr260',
  'vr290',
  'vr310',
  'vr340',
  'vr360',
  'vr380',
  'vr400',
  'vr420',
  'vr460',
];

const LEGACY_IDS = [
  'airdeck-360',
  'sup-cheetah-surge',
  'sup-dolphin-wave',
  'sup-explorer-11',
  'sup-flowing-lotus',
  'sup-jungle-mandala',
  'sup-leviathan-wake',
  'sup-medusa-glow',
  'sup-ocean-pulse',
  'sup-ocean-voyager',
  'sup-tropical-breeze',
  'zb-mt350',
];

const TARGET_IDS = [...RIB_IDS, ...LEGACY_IDS];

const LANGUAGES = ['fr', 'de', 'es', 'pt', 'ar', 'it', 'ru', 'pl', 'nl', 'sv', 'no', 'el', 'fi', 'da', 'cs'];

const PRESERVE_TERMS = [
  /\bAP\d+\b/gi,
  /\bDF\d+\b/gi,
  /\bEX\d+\b/gi,
  /\bSW\d+\b/gi,
  /\bVR\d+\b/gi,
  /\bApex Performance\b/gi,
  /\bDefender\b/g,
  /\bExplorer\b/g,
  /\bSwiftlitee\b/g,
  /\bVersa\b/g,
  /\bHypalon\b/gi,
  /\bValmex PVC\b/gi,
  /\bORCA\b/gi,
  /\bEVA\b/g,
  /\b5083 aluminum\b/gi,
  /\bRIB\b/g,
  /\bdeep V\b/gi,
  /\bdeadrise\b/gi,
  /\bkeel guard\b/gi,
  /\bbow locker\b/gi,
  /\btransom\b/gi,
  /\bHP\b/g,
  /\bXL shaft\b/gi,
  /\bLong Shaft\b/gi,
  /\bShort Shaft\b/gi,
  /\bCategory B\b/gi,
  /\bCategory C\b/gi,
  /\bCE\b/g,
  /\bInflatable Pool Factory\b/g,
  /\bSAR\b/g,
  /\bcoast guard\b/gi,
  /\bCoast Guard\b/g,
  /\bSOLAS\b/g,
  /\bFCT\b/g,
  /\bGT\b/g,
  /\bFRP\b/g,
  /\b\d+mm\b/g,
  /\b\d+°\b/g,
  /\b\d+\.?\d*°\b/g,
  /\b\d+HP\b/g,
  /\b\d+L\b/g,
  /\b\d+ kg\b/g,
  /\b\d+ cm\b/g,
  /\b\d+ m\b/g,
  /\b\d+\.?\d* m\b/g,
  /\b\d+ persons\b/gi,
  /\bBeaufort \d+\b/g,
  /\bSUP\b/g,
  /\bCNC\b/g,
  /\bUV\b/g,
  /\bEVA\b/g,
  /\bAQMT\b/g,
  /\bAirDeck\b/g,
  /\bCheetah Surge\b/g,
  /\bDolphin Wave\b/g,
  /\bExplorer 11\b/g,
  /\bFlowing Lotus\b/g,
  /\bJungle Mandala\b/g,
  /\bLeviathan Wake\b/g,
  /\bMedusa Glow\b/g,
  /\bOcean Pulse\b/g,
  /\bOcean Voyager\b/g,
  /\bTropical Breeze\b/g,
  /\bstand-up paddle\b/gi,
  /\bpaddleboard\b/gi,
  /\binflatable kayak\b/gi,
];

const DRY_RUN = process.argv.includes('--dry-run');
const REFINE = process.argv.includes('--refine');
const PRODUCT_FLAG = process.argv.find((a) => a.startsWith('--product='));
const LANG_FLAG = process.argv.find((a) => a.startsWith('--lang='));

const FILTER_PRODUCT = PRODUCT_FLAG ? PRODUCT_FLAG.split('=')[1] : null;
const FILTER_LANG = LANG_FLAG ? LANG_FLAG.split('=')[1] : null;

let cache = {};
let apiCalls = 0;
let cacheHits = 0;
let errorCount = 0;
let googleFailStreak = 0;
let googleDownUntil = 0;
let myFailStreak = 0;

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

function extractProductsFromTs(tsContent) {
  const products = [];
  for (const targetId of TARGET_IDS) {
    const idPattern = new RegExp(`id:\\s*'${targetId.replace('-', '\\-')}'`);
    const match = tsContent.match(idPattern);
    if (!match) {
      console.warn(`  WARNING: Product ID '${targetId}' not found in products.ts`);
      continue;
    }
    const startIdx = match.index;
    let searchStart = startIdx;
    for (let i = startIdx; i >= 0; i--) {
      if (tsContent[i] === '{') {
        searchStart = i;
        break;
      }
    }
    let braceCount = 0;
    let objStart = -1;
    let objEnd = -1;
    for (let i = searchStart; i < tsContent.length; i++) {
      if (tsContent[i] === '{') {
        if (braceCount === 0) objStart = i;
        braceCount++;
      } else if (tsContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          objEnd = i + 1;
          break;
        }
      }
    }
    if (objStart === -1 || objEnd === -1) continue;
    const objStr = tsContent.slice(objStart, objEnd);
    const product = parseProductObject(objStr, targetId);
    if (product) products.push(product);
  }
  return products;
}

function parseProductObject(objStr, id) {
  try {
    const product = { id };
    const strFields = ['name', 'desc', 'definition', 'problem', 'howItWorks', 'audience', 'ai_comparison'];
    for (const field of strFields) {
      const m = objStr.match(new RegExp(`${field}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
      if (m) product[field] = m[1].replace(/\\'/g, "'");
    }
    const useCasesMatch = objStr.match(/ai_use_cases:\s*\[([\s\S]*?)\],\s*\n\s*ai_specs/);
    if (useCasesMatch) {
      const items = useCasesMatch[1].match(/'((?:[^'\\\\]|\\\\.)*)'/g);
      if (items) {
        product.ai_use_cases = items.map((s) => s.slice(1, -1).replace(/\\'/g, "'"));
      }
    }
    const specsMatch = objStr.match(/ai_specs:\s*\{([\s\S]*?)\},\s*\n\s*ai_comparison/);
    if (specsMatch) {
      const specs = {};
      const pairs = specsMatch[1].matchAll(/(\w+):\s*'((?:[^'\\\\]|\\\\.)*)'/g);
      for (const pair of pairs) {
        specs[pair[1]] = pair[2].replace(/\\'/g, "'");
      }
      product.ai_specs = specs;
    }
    const faqMatch = objStr.match(/ai_faq:\s*\[([\s\S]*?)\]\s*,?\s*\n\s*\}/);
    if (faqMatch) {
      const faqItems = [];
      const qaPattern = /\{\s*q:\s*'((?:[^'\\\\]|\\\\.)*)',\s*a:\s*'((?:[^'\\\\]|\\\\.)*)'\s*\}/g;
      let qa;
      while ((qa = qaPattern.exec(faqMatch[1])) !== null) {
        faqItems.push({ q: qa[1].replace(/\\'/g, "'"), a: qa[2].replace(/\\'/g, "'") });
      }
      product.ai_faq = faqItems;
    }
    return product;
  } catch (e) {
    console.error(`  ERROR parsing product ${id}: ${e.message}`);
    return null;
  }
}

function preserveTerms(text) {
  const placeholders = [];
  let result = text;
  for (const pattern of PRESERVE_TERMS) {
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

async function translateText(text, lang, ignoreEnglishCache = false) {
  if (!text || typeof text !== 'string') return text;
  const ck = `${lang}::${text}`;
  // In refine mode a cached value identical to the English source is a stored
  // fallback from a failed run — bypass it so a real translation is fetched.
  if (cache[ck] && !(ignoreEnglishCache && cache[ck] === text)) {
    cacheHits++;
    myFailStreak = 0;
    return cache[ck];
  }
  if (DRY_RUN) return text;
  // OFFLINE=1: cache-only mode, no API calls (rebuild entries from cache after
  // an interrupted run; uncached fields fall back to English like a failed call)
  if (process.env.OFFLINE === '1') {
    errorCount++;
    return text;
  }

  const { text: preservedText, placeholders } = preserveTerms(text);

  // Circuit breaker: when Google is unreachable (e.g. network-level block),
  // skip it for 15 min after 3 consecutive failures instead of burning a
  // 5s timeout on every field.
  if (Date.now() >= googleDownUntil) {
    try {
      const gUrl = `${GOOGLE_URL}?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(preservedText)}`;
      const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(5000) });
      const gData = await gRes.json();
      if (Array.isArray(gData) && gData[0]) {
        let t = gData[0].map((seg) => seg[0]).join('');
        t = t.trim();
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
    const mUrl = `${MYMEMORY_URL}?q=${encodeURIComponent(preservedText)}&langpair=en|${lang}&de=${encodeURIComponent(mmDe)}`;
    const mRes = await fetch(mUrl, { signal: AbortSignal.timeout(10000) });
    if (mRes.status === 429) {
      console.log(`  [quota] MyMemory HTTP 429 (rate limited / quota exhausted), stopping.`);
      console.log(`  [quota] Progress saved. Set MM_DE to a different email or re-run after quota reset.`);
      saveCache();
      process.exit(2);
    }
    const mData = await mRes.json();
    if (mData.responseStatus === 200 && mData.responseData?.translatedText) {
      let t = mData.responseData.translatedText;
      // Quota exhaustion comes back as an all-caps warning inside translatedText
      if (/MYMEMORY WARNING|ALL AVAILABLE FREE TRANSLATIONS/i.test(t)) {
        console.log(`  [quota] MyMemory daily quota exhausted, stopping.`);
        console.log(`  [quota] Progress saved. Re-run later (cached entries are skipped).`);
        saveCache();
        process.exit(2);
      }
      if (t.toUpperCase() === t && preservedText.length > 5 && /[a-z]/.test(preservedText)) t = preservedText;
      t = restoreTerms(t, placeholders);
      cache[ck] = t;
      apiCalls++;
      myFailStreak = 0;
      return t;
    }
    // Non-200 responseStatus: treat as service-level failure
    myFailStreak++;
    if (myFailStreak >= 10) {
      console.log(`  [abort] MyMemory failing repeatedly (responseStatus=${mData.responseStatus}), stopping.`);
      saveCache();
      process.exit(2);
    }
  } catch {
    myFailStreak++;
    if (myFailStreak >= 10) {
      console.log(`  [abort] MyMemory network failures x${myFailStreak}, stopping.`);
      saveCache();
      process.exit(2);
    }
  }

  errorCount++;
  return text;
}

async function sleep(ms) {
  if (process.env.OFFLINE === '1') return; // no rate limit needed in cache-only mode
  return new Promise((r) => setTimeout(r, ms));
}

function escapeSingleQuote(str) {
  return str.replace(/'/g, "\\'");
}

function generateTsEntry(productId, translated) {
  const lines = [];
  lines.push(`    '${productId}': {`);
  if (translated.name) {
    lines.push(`      name: '${escapeSingleQuote(translated.name)}',`);
  }
  for (const field of ['desc', 'definition', 'problem', 'howItWorks', 'audience']) {
    if (translated[field]) {
      lines.push(`      ${field}: '${escapeSingleQuote(translated[field])}',`);
    }
  }
  if (translated.ai_use_cases && translated.ai_use_cases.length > 0) {
    lines.push(`      ai_use_cases: [`);
    for (const uc of translated.ai_use_cases) {
      lines.push(`        '${escapeSingleQuote(uc)}',`);
    }
    lines.push(`      ],`);
  }
  if (translated.ai_specs && Object.keys(translated.ai_specs).length > 0) {
    lines.push(`      ai_specs: {`);
    for (const [key, val] of Object.entries(translated.ai_specs)) {
      lines.push(`        ${key}: '${escapeSingleQuote(val)}',`);
    }
    lines.push(`      },`);
  }
  if (translated.ai_comparison) {
    lines.push(`      ai_comparison: '${escapeSingleQuote(translated.ai_comparison)}',`);
  }
  if (translated.ai_faq && translated.ai_faq.length > 0) {
    lines.push(`      ai_faq: [`);
    for (const faq of translated.ai_faq) {
      lines.push(`        { q: '${escapeSingleQuote(faq.q)}', a: '${escapeSingleQuote(faq.a)}' },`);
    }
    lines.push(`      ],`);
  }
  lines.push(`    },`);
  return lines.join('\n');
}

async function translateProduct(product, lang) {
  const translated = { id: product.id };

  if (product.name) {
    const { text: preservedText, placeholders } = preserveTerms(product.name);
    const t = restoreTerms(preservedText, placeholders);
    translated.name = t;
  }

  for (const field of ['desc', 'definition', 'problem', 'howItWorks', 'audience', 'ai_comparison']) {
    if (product[field]) {
      translated[field] = await translateText(product[field], lang);
      await sleep(RATE_MS);
    }
  }

  if (product.ai_use_cases && product.ai_use_cases.length > 0) {
    translated.ai_use_cases = [];
    for (const uc of product.ai_use_cases) {
      translated.ai_use_cases.push(await translateText(uc, lang));
      await sleep(RATE_MS);
    }
  }

  if (product.ai_specs && Object.keys(product.ai_specs).length > 0) {
    translated.ai_specs = {};
    for (const [key, val] of Object.entries(product.ai_specs)) {
      translated.ai_specs[key] = await translateText(val, lang);
      await sleep(RATE_MS);
    }
  }

  if (product.ai_faq && product.ai_faq.length > 0) {
    translated.ai_faq = [];
    for (const faq of product.ai_faq) {
      const q = await translateText(faq.q, lang);
      await sleep(RATE_MS);
      const a = await translateText(faq.a, lang);
      await sleep(RATE_MS);
      translated.ai_faq.push({ q, a });
    }
  }

  return translated;
}

function findLangBlockEnd(content, langKey) {
  // Must anchor on "\n  lang: {" — a bare "cs: {" would false-match "specs: {"
  // and "es: {" would match inside strings like "Addresses".
  const langStart = content.indexOf(`\n  ${langKey}: {`);
  if (langStart === -1) return -1;
  let braceCount = 0;
  let started = false;
  for (let i = langStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      started = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (started && braceCount === 0) {
        return i;
      }
    }
  }
  return -1;
}

function appendToTextsFile(lang, entries) {
  let content = fs.readFileSync(TEXTS_PATH, 'utf8');
  const langEnd = findLangBlockEnd(content, lang);
  if (langEnd === -1) {
    console.error(`  ERROR: Could not find language block '${lang}' in product-texts.ts`);
    return false;
  }
  const insertPos = langEnd;
  const entryText = '\n' + entries.join('\n') + '\n';
  content = content.slice(0, insertPos) + entryText + content.slice(insertPos);
  fs.writeFileSync(TEXTS_PATH, content, 'utf8');
  return true;
}

function unescapeTsValue(s) {
  return s.replace(/\\'/g, "'");
}

function hasTranslatableContent(text) {
  const { text: preserved } = preserveTerms(text);
  // Placeholders (__PH0__) contain letters; strip them before testing
  return /[a-zA-Z]/.test(preserved.replace(/__PH\d+__/g, ''));
}

const REFINE_STR_FIELDS = ['desc', 'definition', 'problem', 'howItWorks', 'audience', 'ai_comparison'];

// Re-translate fields whose current value in the lang block is identical to the
// English source (i.e. stored fallbacks from a failed translation run).
// Returns the updated entry string, or the original if nothing changed.
async function refineEntry(entryStr, product, lang, stats) {
  const replacements = [];

  const tryRefine = async (current, english) => {
    if (current !== english) return null; // already translated
    if (!hasTranslatableContent(english)) return null; // terms/numbers only
    stats.detected++;
    console.log(`    fallback: ${JSON.stringify(english.slice(0, 70))}`);
    const t = await translateText(english, lang, true);
    if (t === english) return null; // still untranslated
    stats.refined++;
    await sleep(RATE_MS);
    return t;
  };

  // Key-value string fields: desc/definition/.../ai_comparison, ai_specs keys, ai_faq q/a
  const kvRe = /(\w+): '((?:[^'\\]|\\.)*)'/g;
  let qIdx = 0;
  let aIdx = 0;
  let m;
  while ((m = kvRe.exec(entryStr)) !== null) {
    const key = m[1];
    const current = unescapeTsValue(m[2]);
    let english = null;
    if (REFINE_STR_FIELDS.includes(key) && product[key]) {
      english = product[key];
    } else if (product.ai_specs && product.ai_specs[key] !== undefined) {
      english = product.ai_specs[key];
    } else if (key === 'q' && product.ai_faq && product.ai_faq[qIdx]) {
      english = product.ai_faq[qIdx].q;
      qIdx++;
    } else if (key === 'a' && product.ai_faq && product.ai_faq[aIdx]) {
      english = product.ai_faq[aIdx].a;
      aIdx++;
    }
    if (english === null) continue;
    const t = await tryRefine(current, english);
    if (t !== null) {
      const valueStart = m.index + m[0].indexOf("'") + 1;
      const valueEnd = m.index + m[0].length - 1;
      replacements.push([valueStart, valueEnd, escapeSingleQuote(t)]);
    }
  }

  // ai_use_cases: bare strings inside the array
  const ucMatch = entryStr.match(/ai_use_cases: \[([\s\S]*?)\]/);
  if (ucMatch && product.ai_use_cases && product.ai_use_cases.length > 0) {
    const bodyOffset = ucMatch.index + ucMatch[0].indexOf('[') + 1;
    const strRe = /'((?:[^'\\]|\\.)*)'/g;
    let i = 0;
    let um;
    while ((um = strRe.exec(ucMatch[1])) !== null) {
      const english = product.ai_use_cases[i];
      i++;
      if (english === undefined) continue;
      const current = unescapeTsValue(um[1]);
      const t = await tryRefine(current, english);
      if (t !== null) {
        const absStart = bodyOffset + um.index + um[0].indexOf("'") + 1;
        const absEnd = bodyOffset + um.index + um[0].length - 1;
        replacements.push([absStart, absEnd, escapeSingleQuote(t)]);
      }
    }
  }

  if (replacements.length === 0) return entryStr;
  let result = entryStr;
  replacements.sort((a, b) => b[0] - a[0]);
  for (const [start, end, val] of replacements) {
    result = result.slice(0, start) + val + result.slice(end);
  }
  return result;
}

async function refineLang(lang, products) {
  const stats = { detected: 0, refined: 0 };
  let content = fs.readFileSync(TEXTS_PATH, 'utf8');
  const langStart = content.indexOf(`\n  ${lang}: {`);
  const langEnd = findLangBlockEnd(content, lang);
  if (langStart === -1 || langEnd === -1) {
    console.error(`  ERROR: language block '${lang}' not found in product-texts.ts`);
    process.exit(1);
  }
  const updated = [];
  for (const product of products) {
    const key = `'${product.id}': {`;
    const keyIdx = content.indexOf(key, langStart);
    if (keyIdx === -1 || keyIdx >= langEnd) {
      console.log(`  ${product.id}: not present in ${lang} block, skipping`);
      continue;
    }
    const entryEnd = content.indexOf('\n    },', keyIdx);
    if (entryEnd === -1 || entryEnd >= langEnd) {
      console.log(`  ${product.id}: could not locate entry end, skipping`);
      continue;
    }
    const entryLen = '\n    },'.length;
    const entryStr = content.slice(keyIdx, entryEnd + entryLen);
    const before = stats.refined;
    const newEntry = await refineEntry(entryStr, product, lang, stats);
    if (stats.refined > before) {
      updated.push([keyIdx, entryEnd + entryLen, newEntry]);
      console.log(`  ${product.id}: refined ${stats.refined - before} field(s)`);
    } else {
      console.log(`  ${product.id}: no refineable fallback fields`);
    }
  }
  if (stats.refined > 0 && !DRY_RUN) {
    updated.sort((a, b) => b[0] - a[0]);
    for (const [start, end, val] of updated) {
      content = content.slice(0, start) + val + content.slice(end);
    }
    fs.writeFileSync(TEXTS_PATH, content, 'utf8');
    saveCache();
  }
  console.log(`  ${lang}: detected ${stats.detected} fallback field(s), refined ${stats.refined}`);
  return stats;
}

async function main() {
  loadCache();

  const tsContent = fs.readFileSync(PRODUCTS_PATH, 'utf8');
  const allProducts = extractProductsFromTs(tsContent);

  let products = allProducts;
  if (FILTER_PRODUCT) {
    products = allProducts.filter((p) => p.id === FILTER_PRODUCT);
    if (products.length === 0) {
      console.error(
        `ERROR: Product '${FILTER_PRODUCT}' not found. Available: ${allProducts.map((p) => p.id).join(', ')}`
      );
      process.exit(1);
    }
  }

  let languages = LANGUAGES;
  if (FILTER_LANG) {
    if (!LANGUAGES.includes(FILTER_LANG)) {
      console.error(`ERROR: Language '${FILTER_LANG}' not supported. Available: ${LANGUAGES.join(', ')}`);
      process.exit(1);
    }
    languages = [FILTER_LANG];
  }

  console.log(`\n=== Product Translation Script ===`);
  console.log(`Products: ${products.length} | Languages: ${languages.join(', ')}`);
  console.log(`Dry run: ${DRY_RUN}${REFINE ? ' | Refine mode' : ''}`);

  if (REFINE) {
    if (!FILTER_LANG) {
      console.error('ERROR: --refine requires --lang=<lang>');
      process.exit(1);
    }
    console.log(`\n--- refine ${FILTER_LANG} ---`);
    await refineLang(FILTER_LANG, products);
    console.log(`\n=== Done ===`);
    console.log(`Refined: ${apiCalls} API calls, ${cacheHits} cache hits`);
    console.log(`Errors: ${errorCount}`);
    return;
  }

  for (const lang of languages) {
    console.log(`\n--- ${lang} ---`);
    const entries = [];
    let langTranslated = 0;

    for (const product of products) {
      // Skip products that already exist in this language's block — appending
      // would create duplicate keys where the newer (possibly worse) machine
      // translation silently overrides the existing one.
      // NOTE: findLangBlockEnd here returns the END INDEX (number), not an object.
      const textsContent = fs.readFileSync(TEXTS_PATH, 'utf8');
      const langStartIdx = textsContent.indexOf(`\n  ${lang}: {`);
      const langEnd = findLangBlockEnd(textsContent, lang);
      if (langStartIdx !== -1 && langEnd === -1) {
        // Block opening exists but its end cannot be located — the file is
        // structurally broken. Fail instead of blindly appending duplicates.
        console.error(`  FATAL: ${lang} block found but findLangBlockEnd failed — fix product-texts.ts first`);
        process.exit(1);
      }
      if (langStartIdx !== -1) {
        const langBlock = textsContent.slice(langStartIdx, langEnd);
        const slugKey = `'${product.id}': {`;
        if (langBlock.includes(slugKey)) {
          console.log(`  Skipping ${product.id}: already present in ${lang} block`);
          continue;
        }
      }
      console.log(`  Translating: ${product.id}...`);
      const translated = await translateProduct(product, lang);
      const entry = generateTsEntry(product.id, translated);
      entries.push(entry);
      langTranslated++;
      // Persist progress every 5 products so interrupted runs can resume
      // from the cache instead of losing all API work.
      if (langTranslated % 5 === 0) saveCache();
    }

    if (DRY_RUN) {
      console.log(`\n  [DRY RUN] Generated entries for ${langTranslated} products:`);
      console.log(entries.join('\n'));
    } else if (langTranslated > 0) {
      const success = appendToTextsFile(lang, entries);
      if (success) {
        console.log(`  ${lang}: ${langTranslated} products appended to product-texts.ts`);
        saveCache();
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Translated: ${apiCalls} API calls, ${cacheHits} cache hits`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(console.error);
