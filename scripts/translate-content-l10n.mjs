import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CONTENT_L10N_PATH = path.join(ROOT, 'src/lib/product-content-l10n.ts');
const CACHE_FILE = path.join(ROOT, '.cache/content-l10n-cache.json');

const MISSING_LANGS = ['ar', 'ru', 'nl', 'sv', 'no', 'el', 'fi', 'da', 'pl', 'pt', 'cs', 'de', 'fr', 'es', 'it'];

const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const RATE_MS = 1000;

const PRESERVE_PATTERNS = [
  /\bRIB\b/g,
  /\bCE\b/g,
  /\bSOLAS\b/g,
  /\bHP\b/g,
  /\bEVA\b/g,
  /\bUV\b/g,
  /\bPVC\b/g,
  /\bCNC\b/g,
  /\bHypalon\b/gi,
  /\bValmex\b/gi,
  /\bORCA\b/gi,
  /\bDrop-Stitch\b/gi,
  /\bdrop-stitch\b/g,
  /\bAirDeck\b/g,
  /\bKaBoat\b/g,
  /\bInflatable Pool Factory\b/g,
  /\bAQHB\b/g,
  /\bAQMT\b/g,
  /\bAQDRB\b/g,
  /\bISO\b/g,
  /\bPSI\b/g,
  /\bFRP\b/g,
  /\b\d+HP\b/g,
  /\b\d+L\b/g,
  /\b\d+ kg\b/g,
  /\b\d+ cm\b/g,
  /\b\d+ m\b/g,
  /\b\d+\.?\d* m\b/g,
  /\b\d+ mm\b/g,
  /\b\d+°\b/g,
  /\b\d+\.?\d*°\b/g,
  /\b\d+ persons\b/gi,
  /\b\d+'\d+"\b/g,
  /\b\d+ft\b/gi,
  /\b\d+ lbs\b/gi,
  /\b\d+ dtex\b/g,
  /\b\d+-\d+ HP\b/g,
];

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

async function translateText(text, lang, forceFetch = false) {
  if (!text || typeof text !== 'string') return text;
  const ck = `${lang}::${text}`;
  // A cached value identical to the English source is a stored fallback from
  // a failed run — bypass it so a real translation is fetched and re-cached.
  // forceFetch (refine mode) also bypasses partial/garbage cached values.
  if (!forceFetch && cache[ck] && cache[ck] !== text) {
    cacheHits++;
    myFailStreak = 0;
    return cache[ck];
  }

  const { text: preservedText, placeholders } = preserveTerms(text);

  // Circuit breaker: skip Google for 15 min after 3 consecutive failures
  // (network-level block) instead of burning a 5s timeout per product.
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
    const mRes = await fetch(mUrl, { signal: AbortSignal.timeout(15000) });
    if (mRes.status === 429) {
      console.log(`  [quota] MyMemory HTTP 429 (rate limited / quota exhausted), stopping.`);
      console.log(`  [quota] Set MM_DE to a different email or re-run after quota reset.`);
      saveCache();
      process.exit(2);
    }
    const mData = await mRes.json();
    if (mData.responseStatus === 200 && mData.responseData?.translatedText) {
      let t = mData.responseData.translatedText;
      // Quota exhaustion comes back as an all-caps warning inside translatedText
      if (/MYMEMORY WARNING|ALL AVAILABLE FREE TRANSLATIONS/i.test(t)) {
        console.log(`  [quota] MyMemory daily quota exhausted, stopping.`);
        console.log(`  [quota] Re-run later — cached entries are skipped on resume.`);
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
  return new Promise((r) => setTimeout(r, ms));
}

function escapeForTs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}

function extractEnContentFromMdx() {
  const mdxDir = path.join(ROOT, 'src/content/products');
  const entries = {};
  const files = fs.readdirSync(mdxDir).filter((f) => f.endsWith('.mdx'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(mdxDir, file), 'utf8');
    const slug = file.replace('.mdx', '');
    const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
    if (bodyMatch && bodyMatch[1].trim()) {
      entries[slug] = bodyMatch[1].trim();
    }
  }
  return entries;
}

// Slugs already present in THIS language's block of product-content-l10n.ts.
// Scoped to the lang block so entries from other languages don't cause skips.
function existingSlugsInLang(lang) {
  const content = fs.readFileSync(CONTENT_L10N_PATH, 'utf8');
  const marker = `\n  ${lang}: {`;
  const start = content.indexOf(marker);
  if (start === -1) return new Set();
  let d = 0;
  let began = false;
  let end = -1;
  for (let i = start + marker.length - 1; i < content.length; i++) {
    if (content[i] === '{') {
      d++;
      began = true;
    } else if (content[i] === '}') {
      d--;
      if (began && d === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return new Set();
  const block = content.slice(start, end);
  const slugs = new Set();
  for (const m of block.matchAll(/'([^']+)':\s*\n/g)) {
    if (!m[1].includes(' ') && m[1].length > 2) slugs.add(m[1]);
  }
  return slugs;
}

// English function-word markers that indicate a partial translation
// (untranslated chunks left by an earlier limited-length translation run)
const EN_RUN = /\b(the|and with|for the|with the|of the|when|your|its|into|from the|that the)\b/gi;

// Locate the string-literal span of an existing entry value inside a lang block.
// block is the sliced language block; returns { valueStart, valueEnd } relative
// to block, or null when the slug is absent.
function findEntryValueSpan(block, slug) {
  const keyIdx = block.indexOf(`'${slug}':`);
  if (keyIdx === -1) return null;
  const nl = block.indexOf('\n', keyIdx);
  if (nl === -1) return null;
  const open = block.indexOf("'", nl);
  if (open === -1) return null;
  let i = open + 1;
  while (i < block.length) {
    if (block[i] === '\\') {
      i += 2;
      continue;
    }
    if (block[i] === "'") return { valueStart: open + 1, valueEnd: i };
    i++;
  }
  return null;
}

// Re-translate existing entries that contain untranslated English runs
// (partial translations from an earlier run). Replacements happen in place;
// a failed re-translation keeps the current value untouched.
async function refineLang(lang, enEntries, slugs) {
  let content = fs.readFileSync(CONTENT_L10N_PATH, 'utf8');
  const marker = `\n  ${lang}: {`;
  const blockStart = content.indexOf(marker);
  if (blockStart === -1) {
    console.error(`  ERROR: language block '${lang}' not found`);
    process.exit(1);
  }
  let d = 0;
  let began = false;
  let blockEnd = -1;
  for (let i = blockStart + marker.length - 1; i < content.length; i++) {
    if (content[i] === '{') {
      d++;
      began = true;
    } else if (content[i] === '}') {
      d--;
      if (began && d === 0) {
        blockEnd = i;
        break;
      }
    }
  }
  if (blockEnd === -1) {
    console.error(`  ERROR: malformed ${lang} block`);
    process.exit(1);
  }
  const block = content.slice(blockStart, blockEnd);

  const replacements = [];
  let refined = 0;
  for (const slug of slugs) {
    const enText = enEntries[slug];
    if (!enText) continue;
    const span = findEntryValueSpan(block, slug);
    if (!span) continue;
    const current = block.slice(span.valueStart, span.valueEnd).replace(/\\n/g, '\n').replace(/\\'/g, "'");
    const enMarkers = (current.match(EN_RUN) || []).length;
    if (enMarkers < 3) continue;
    console.log(`  ${slug}: ${enMarkers} English marker(s), re-translating...`);
    const t = await translateText(enText, lang, true);
    if (t === enText) {
      console.log(`  ${slug}: re-translation unavailable, keeping current value`);
      continue;
    }
    replacements.push([blockStart + span.valueStart, blockStart + span.valueEnd, escapeForTs(t)]);
    refined++;
    await sleep(RATE_MS);
  }

  if (refined > 0) {
    replacements.sort((a, b) => b[0] - a[0]);
    for (const [s, e, v] of replacements) {
      content = content.slice(0, s) + v + content.slice(e);
    }
    fs.writeFileSync(CONTENT_L10N_PATH, content, 'utf8');
    saveCache();
  }
  console.log(`  ${lang}: refined ${refined} entr(ies)`);
}

async function main() {
  loadCache();

  const enEntries = extractEnContentFromMdx();
  const slugs = Object.keys(enEntries).sort();

  console.log(`\n=== Product Content L10N Translation ===`);
  console.log(`Products with MDX content: ${slugs.length}`);
  console.log(`Languages: ${MISSING_LANGS.join(', ')}`);

  const LANG_FLAG = process.argv.find((a) => a.startsWith('--lang='));
  const FILTER_LANG = LANG_FLAG ? LANG_FLAG.split('=')[1] : null;
  const REFINE = process.argv.includes('--refine');
  const langs = FILTER_LANG ? [FILTER_LANG] : MISSING_LANGS;

  if (FILTER_LANG && !MISSING_LANGS.includes(FILTER_LANG)) {
    console.error(`Language '${FILTER_LANG}' not in missing list. Available: ${MISSING_LANGS.join(', ')}`);
    process.exit(1);
  }

  const PRODUCT_FLAG = process.argv.find((a) => a.startsWith('--product='));
  const FILTER_PRODUCT = PRODUCT_FLAG ? PRODUCT_FLAG.split('=')[1] : null;
  const targetSlugs = FILTER_PRODUCT ? slugs.filter((s) => s === FILTER_PRODUCT) : slugs;

  console.log(`Target products: ${targetSlugs.length}${REFINE ? ' | Refine mode' : ''}`);

  if (REFINE) {
    if (!FILTER_LANG) {
      console.error('ERROR: --refine requires --lang=<lang>');
      process.exit(1);
    }
    console.log(`\n--- refine ${FILTER_LANG} ---`);
    await refineLang(FILTER_LANG, enEntries, targetSlugs);
    console.log(`\n=== Done ===`);
    console.log(`API calls: ${apiCalls}, Cache hits: ${cacheHits}`);
    console.log(`Errors: ${errorCount}`);
    return;
  }

  for (const lang of langs) {
    console.log(`\n--- ${lang} ---`);
    const existing = existingSlugsInLang(lang);
    if (existing.size > 0) {
      console.log(`  ${existing.size} slugs already present in ${lang} block (will be skipped)`);
    }
    const entries = [];
    let translated = 0;
    let fallback = 0;
    let skipped = 0;

    for (const slug of targetSlugs) {
      if (existing.has(slug)) {
        skipped++;
        continue;
      }
      const enText = enEntries[slug];
      if (!enText) continue;

      process.stdout.write(`  ${slug}...`);
      const t = await translateText(enText, lang);
      await sleep(RATE_MS);

      if (t !== enText) {
        translated++;
        const escaped = escapeForTs(t);
        entries.push(`    '${slug}':\n      '${escaped}',`);
        process.stdout.write(` OK\n`);
      } else {
        // Fallback (translation unavailable): do NOT append — an English
        // entry would be skipped by future runs (existing-slug check) and
        // lock in the untranslated content. Re-runs will retry it.
        fallback++;
        process.stdout.write(` FALLBACK (skipped, retry on next run)\n`);
      }
    }

    if (entries.length > 0) {
      let content = fs.readFileSync(CONTENT_L10N_PATH, 'utf8');
      const marker = `\n  ${lang}: {`;
      const blockStart = content.indexOf(marker);
      if (blockStart !== -1) {
        // Block already exists (interrupted re-run): insert entries before its closing brace
        let d = 0;
        let began = false;
        let blockEnd = -1;
        for (let i = blockStart + marker.length - 1; i < content.length; i++) {
          if (content[i] === '{') {
            d++;
            began = true;
          } else if (content[i] === '}') {
            d--;
            if (began && d === 0) {
              blockEnd = i;
              break;
            }
          }
        }
        if (blockEnd === -1) {
          console.error(`  ERROR: malformed ${lang} block, skipping append`);
          continue;
        }
        const insert = '\n' + entries.join('\n');
        content = content.slice(0, blockEnd) + insert + content.slice(blockEnd);
        fs.writeFileSync(CONTENT_L10N_PATH, content, 'utf8');
        console.log(
          `  ${lang}: ${entries.length} products (${translated} translated, ${fallback} fallback, ${skipped} skipped) appended to existing block`
        );
        saveCache();
      } else {
        const lastBrace = content.lastIndexOf('};');
        if (lastBrace !== -1) {
          const langBlock = `\n  ${lang}: {\n${entries.join('\n')}\n  },\n`;
          content = content.slice(0, lastBrace) + langBlock + content.slice(lastBrace);
          fs.writeFileSync(CONTENT_L10N_PATH, content, 'utf8');
          console.log(
            `  ${lang}: ${entries.length} products (${translated} translated, ${fallback} fallback) appended`
          );
          saveCache();
        }
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`API calls: ${apiCalls}, Cache hits: ${cacheHits}, Errors: ${errorCount}`);
}

main().catch(console.error);
