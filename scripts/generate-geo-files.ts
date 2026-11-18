import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import { products } from '../src/data/products';
import { productTexts } from '../src/data/product-texts';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const LLMS_FULL_TXT = path.join(PUBLIC, 'llms-full.txt');
const LLMS_TXT = path.join(PUBLIC, 'llms.txt');
const PAGES_DIR = path.join(ROOT, 'src', 'data', 'pages');
const WELL_KNOWN_DIR = path.join(PUBLIC, '.well-known');
const ENTITY_JSON = path.join(WELL_KNOWN_DIR, 'entity.json');

const SITE_URL = 'https://inflatablepoolfactory.com';

const LANGUAGES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  it: 'Italiano',
  ru: 'Русский',
  pl: 'Polski',
  nl: 'Nederlands',
  sv: 'Svenska',
  no: 'Norsk',
  el: 'Ελληνικά',
  fi: 'Suomi',
  da: 'Dansk',
  cs: 'Čeština',
  th: 'ไทย',
  hr: 'Hrvatski',
  tl: 'Filipino',
  hu: 'Magyar',
  ro: 'Română',
  sk: 'Slovenčina',
  bg: 'Български',
  sl: 'Slovenščina',
  sr: 'Srpski',
  tr: 'Türkçe',
  id: 'Bahasa Indonesia',
  he: 'עברית',
  ms: 'Bahasa Melayu',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  et: 'Eesti',
  kk: 'Қазақша',
  uz: 'Oʻzbekcha',
  uk: 'Українська',
  az: 'Azərbaycanca',
  fa: 'فارسی',
};

const CATEGORY_LABELS: Record<string, string> = {
  POOL: 'Inflatable Swimming Pools',
};

// Root-only EN pages have no per-language YAML page data (src/data/pages/*.yaml),
// so the Site Pages scan below never sees them. They are listed explicitly so
// llms-full.txt stays a complete map of the site for AI crawlers.
const ROOT_ONLY_PAGES: Array<{ path: string; title: string }> = [
  { path: '/manufacturing/', title: 'Inflatable Pool Manufacturing & Inspection Process' },
  { path: '/quality-control/', title: 'Quality Control & Testing Framework' },
  {
    path: '/quality-control/destructive-testing/',
    title: 'Drop-Stitch Pool Destructive Testing SOP (WI-QC-DS-2026-001)',
  },
  {
    path: '/quality-control/destructive-testing/results/',
    title: 'Published Destructive Test Results (RPT-FB-QC-20261113, 8/8 PASS, signed PDF reports)',
  },
  { path: '/oem-odm/', title: 'OEM / ODM Inflatable Pool Manufacturing' },
  { path: '/private-label/', title: 'Private Label Inflatable Pools' },
  { path: '/wholesale/', title: 'Wholesale Program' },
  { path: '/sample-request/', title: 'Inflatable Pool Sample Request' },
  { path: '/commercial-pools/', title: 'Commercial Pools' },
  { path: '/for-businesses/', title: 'For Businesses' },
  { path: '/guides/', title: 'Procurement & Technical Guides' },
  { path: '/products/specs/', title: 'Pool Specs & FOB Price List' },
  { path: '/products/compare/', title: 'Product Comparison' },
  { path: '/drop-stitch-pool-technology/', title: 'Drop Stitch Pool Technology: Structure, Materials & Testing' },
  { path: '/drop-stitch-pool-materials/', title: 'Drop Stitch Pool Materials: 1000D vs 1500D PVC' },
  { path: '/inflatable-pool-water-capacity/', title: 'Inflatable Pool Water Capacity Calculator' },
  { path: '/find-your-pool/', title: 'Find Your Pool' },
  { path: '/ai-answer-center/', title: 'AI Answer Center' },
  { path: '/request-quotation/', title: 'Request a Quotation' },
];

function getRootOnlyPageLines(existing: string[]): string[] {
  return ROOT_ONLY_PAGES.filter((p) => !existing.some((line) => line.includes(`${SITE_URL}${p.path}`))).map(
    (p) => `- ${SITE_URL}${p.path} — ${p.title}`
  );
}

function readSource(file: string): string | null {
  try {
    return fs.readFileSync(path.join(ROOT, 'src', 'data', 'geo', file), 'utf8');
  } catch {
    return null;
  }
}

function extractPageTitle(content: string): string | null {
  const parsed = yaml.load(content) as Record<string, any>;
  if (!parsed || typeof parsed !== 'object') return null;
  for (const key of Object.keys(parsed)) {
    const val = parsed[key];
    if (val && typeof val === 'object' && val.title) {
      return String(val.title)
        .replace(/<[^>]+>/g, ' ')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return null;
}

function getPageUrls(): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const entries = fs.readdirSync(PAGES_DIR);
  for (const entry of entries) {
    const entryPath = path.join(PAGES_DIR, entry);
    if (fs.statSync(entryPath).isDirectory()) {
      const lang = entry;
      if (!LANGUAGES[lang]) continue;
      const langFiles = fs.readdirSync(entryPath);
      for (const lf of langFiles) {
        if (!lf.endsWith('.yaml')) continue;
        const name = lf.replace(/\.yaml$/, '');
        const url = `${SITE_URL}/${lang}/${name}/`;
        if (seen.has(url)) continue;
        seen.add(url);
        const content = fs.readFileSync(path.join(entryPath, lf), 'utf8');
        const title = extractPageTitle(content);
        urls.push(title ? `- ${url} — ${title}` : `- ${url}`);
      }
    } else if (entry.endsWith('.yaml') && !entry.startsWith('_')) {
      const name = entry.replace(/\.yaml$/, '');
      const url = `${SITE_URL}/${name}/`;
      if (seen.has(url)) continue;
      seen.add(url);
      const content = fs.readFileSync(entryPath, 'utf8');
      const title = extractPageTitle(content);
      urls.push(title ? `- ${url} — ${title}` : `- ${url}`);
    }
  }

  urls.sort();
  return urls;
}

function getProductLines(): string[] {
  const lines: string[] = [];

  const allLangs = Object.keys(LANGUAGES);
  // English first, then alphabetical
  const sortedLangs = ['en', ...allLangs.filter((l) => l !== 'en').sort()];

  for (const lang of sortedLangs) {
    const langName = LANGUAGES[lang];
    const prefix = lang === 'en' ? '' : ` (${lang})`;
    const heading = lang === 'en' ? 'English' : `${langName}${prefix}`;
    lines.push(`\n### ${heading}\n`);

    const categories = ['POOL'];
    for (const cat of categories) {
      const catProducts = products.filter((p) => p.category === cat);
      if (catProducts.length === 0) continue;

      lines.push(`#### ${CATEGORY_LABELS[cat]}\n`);

      for (const p of catProducts) {
        const localizedName = productTexts[lang]?.[p.id]?.name || p.name;
        const url = `${SITE_URL}/products/${p.id}/`;
        lines.push(`- ${url} — ${localizedName}`);
      }
      lines.push('');
    }
  }

  return lines;
}

function main(): void {
  fs.mkdirSync(WELL_KNOWN_DIR, { recursive: true });

  // Ensure llms.txt exists
  if (!fs.existsSync(LLMS_TXT)) {
    fs.writeFileSync(
      LLMS_TXT,
      `# Inflatable Pool Factory\n\nInflatable Pool Factory designs and supplies premium drop stitch inflatable swimming pools.\n`
    );
    console.log('[geo] Created default llms.txt');
  }

  // Build llms-full.txt from scratch (idempotent)
  const baseParts: string[] = [];

  // Static base content — read existing file up to the auto-generated sections
  if (fs.existsSync(LLMS_FULL_TXT)) {
    const existing = fs.readFileSync(LLMS_FULL_TXT, 'utf8');
    // Cut at the first auto-generated section (## Site Pages) so repeated
    // runs stay idempotent; older runs' appended sections are discarded here
    const autoIdx = existing.indexOf('\n## Site Pages');
    if (autoIdx !== -1) {
      baseParts.push(existing.slice(0, autoIdx).trim());
    } else {
      baseParts.push(existing.trim());
    }
  } else {
    // Default base
    baseParts.push(
      `# Inflatable Pool Factory Knowledge Base\n\nInflatable Pool Factory designs and supplies premium drop stitch inflatable swimming pools.`
    );
  }

  // Generate site pages
  console.log('[geo] Gathering site pages...');
  const pageUrls = getPageUrls();
  if (pageUrls.length > 0) {
    baseParts.push('\n\n## Site Pages\n');
    baseParts.push(pageUrls.join('\n'));
  }
  const rootOnlyLines = getRootOnlyPageLines(pageUrls);
  if (rootOnlyLines.length > 0) {
    // Appended to the same Site Pages section; when the YAML scan is empty the
    // heading is still emitted so the file structure stays valid.
    if (pageUrls.length === 0) baseParts.push('\n\n## Site Pages\n');
    baseParts.push('\n' + rootOnlyLines.join('\n'));
  }
  console.log(`[geo]   ${pageUrls.length} pages found (+${rootOnlyLines.length} root-only)`);

  // Generate product catalog — all LANGUAGES, all products
  console.log('[geo] Generating product catalog...');
  const productLines = getProductLines();
  if (productLines.length > 0) {
    baseParts.push('\n\n## Product Catalog\n');
    baseParts.push(productLines.join('\n'));
  }

  const productCount = products.length;
  const langCount = Object.keys(LANGUAGES).length;
  console.log(`[geo]   ${productCount} products x ${langCount} LANGUAGES`);

  const output =
    baseParts
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n';
  fs.writeFileSync(LLMS_FULL_TXT, output);
  console.log('[geo] Wrote llms-full.txt');

  // Generate entity.json
  const entitySource = readSource('entity.json');
  if (entitySource) {
    try {
      JSON.parse(entitySource);
      fs.writeFileSync(ENTITY_JSON, entitySource);
      console.log('[geo] Wrote .well-known/entity.json from source data');
    } catch {
      console.warn('[geo] Invalid entity.json source, keeping existing');
    }
  }

  console.log('[generate-geo-files] Done');
}

main();
