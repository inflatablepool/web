import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(import.meta.dirname, '..');
// Importable copy of the data, consumed at build time by the page-content /
// i18n modules so prerendered HTML contains content (the Cloudflare prerender
// server runs from a sandboxed temp dir where fs/path lookups fail).
const GENERATED_DIR = path.join(ROOT, 'src', 'i18n', 'generated');

// Record the project root so the build-time content loader (src/i18n/build-data.ts)
// can locate public/data/*.json even when the Cloudflare prerender server runs
// from a temp dir with a different cwd. INIT_CWD (set by npm/yarn) is the primary
// path; this sidecar is a fallback for direct `astro build` invocations.
try {
  fs.writeFileSync(path.join(os.tmpdir(), 'inflatablepoolfactory-project-root'), ROOT);
} catch {
  // ignore
}

const ASSET_BASE = (process.env.ASSETS_BASE_URL || '').replace(/\/+$/, '');

// Prefix image/file paths with the public R2 custom-domain base so the emitted
// data references the public CDN (not the Worker). Already-absolute URLs are
// left untouched. This keeps asset URLs env-overridable at build time.
function prefixAssetUrl(s) {
  if (typeof s !== 'string') return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return s;
  if (!/^\/(images|files)\//.test(s)) return s;
  return ASSET_BASE + s;
}

function prefixAssetUrls(node) {
  if (typeof node === 'string') return prefixAssetUrl(node);
  if (Array.isArray(node)) return node.map(prefixAssetUrls);
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = prefixAssetUrls(node[k]);
    return out;
  }
  return node;
}

function generateI18nConfig() {
  const srcPath = path.join(ROOT, 'src', 'data', 'site', 'i18n-config.json');
  const destDir = path.join(ROOT, 'public', 'data');
  fs.mkdirSync(destDir, { recursive: true });
  const json = prefixAssetUrls(JSON.parse(fs.readFileSync(srcPath, 'utf8')));
  fs.writeFileSync(path.join(destDir, 'i18n-config.json'), JSON.stringify(json));

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.writeFileSync(path.join(GENERATED_DIR, 'i18n-config.json'), JSON.stringify(json));

  console.log('[generate] Wrote public/data/i18n-config.json (asset URLs → ' + ASSET_BASE + ')');
}

function generatePageContent() {
  const pagesDir = path.join(ROOT, 'src', 'data', 'pages');
  const siteDir = path.join(ROOT, 'src', 'data', 'site');
  const langsYamlPath = path.join(siteDir, 'languages.yaml');

  let pageLangs;
  try {
    const langsContent = fs.readFileSync(langsYamlPath, 'utf8');
    const langsData = yaml.load(langsContent);
    pageLangs = langsData.filter((l) => l.enabled !== false).map((l) => l.locale);
  } catch {
    pageLangs = ['en'];
  }

  // Build page content data (per-locale page YAML files)
  let pageNames;
  try {
    const entries = fs.readdirSync(pagesDir);
    pageNames = entries.filter((e) => e.endsWith('.yaml')).map((e) => e.replace(/\.yaml$/, ''));
  } catch {
    pageNames = [];
  }

  const data = {};
  for (const lang of pageLangs) {
    for (const pname of pageNames) {
      const filePath =
        lang === 'en' ? path.resolve(pagesDir, `${pname}.yaml`) : path.resolve(pagesDir, lang, `${pname}.yaml`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        data[`${lang}/${pname}`] = prefixAssetUrls(yaml.load(content));
      } catch {
        // file not found, skip
      }
    }
  }

  // Also include site-level YAML data with per-locale fallback
  // (these are statically imported in [lang]/ pages as English-only)
  const siteExclude = new Set([
    'languages.yaml',
    'navigation.yaml',
    'i18n-config.json',
    'secrets.yaml',
    'contact-form-text.yaml',
  ]);
  let siteFiles;
  try {
    siteFiles = fs.readdirSync(siteDir).filter((f) => f.endsWith('.yaml') && !siteExclude.has(f));
  } catch {
    siteFiles = [];
  }

  for (const sf of siteFiles) {
    const baseName = sf.replace(/\.yaml$/, '');
    if (baseName.startsWith('content-v2')) continue; // loaded directly by src/data/content-v2.ts
    for (const lang of pageLangs) {
      const siteFilePath = lang === 'en' ? path.join(siteDir, sf) : path.join(siteDir, `${baseName}.${lang}.yaml`);
      try {
        const content = fs.readFileSync(siteFilePath, 'utf8');
        data[`${lang}/site-${baseName}`] = prefixAssetUrls(yaml.load(content));
      } catch {
        // Locale file not found; fall back to English
        if (lang !== 'en') {
          try {
            const enContent = fs.readFileSync(path.join(siteDir, sf), 'utf8');
            data[`${lang}/site-${baseName}`] = prefixAssetUrls(yaml.load(enContent));
          } catch {
            // skip
          }
        }
      }
    }
  }

  // Include per-language config metadata (title, description, OG, etc.)
  // so Metadata.astro can render localized OG tags per route.
  const configDir = path.join(ROOT, 'src');
  for (const lang of pageLangs) {
    const cfgPath = lang === 'en' ? path.join(configDir, 'config.yaml') : path.join(configDir, `config.${lang}.yaml`);
    try {
      const cfg = yaml.load(fs.readFileSync(cfgPath, 'utf8'));
      if (cfg?.metadata) {
        data[`${lang}/site-config`] = prefixAssetUrls(cfg.metadata);
      }
    } catch {
      // skip — fall back to English config at runtime
    }
  }

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.writeFileSync(path.join(GENERATED_DIR, 'page-content.json'), JSON.stringify(data));

  console.log('[generate] Wrote src/i18n/generated/page-content.json');
}

function writeSiteDataTs() {
  const pagePath = path.join(GENERATED_DIR, 'page-content.json');
  if (!fs.existsSync(pagePath)) return;
  const pages = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
  const site = {};
  for (const k of Object.keys(pages)) {
    if (k.includes('/site-')) {
      const name = k.split('/site-')[1];
      if (name.startsWith('content-v2')) continue; // loaded directly by src/data/content-v2.ts
      site[k] = pages[k];
    }
  }
  const header =
    '// AUTO-GENERATED by scripts/generate-data-json.mjs — do not edit.\n' +
    '// @ts-nocheck\n' +
    'export const pageContentData: Record<string, any> = ' +
    JSON.stringify(site) +
    ';\n';
  fs.writeFileSync(path.join(GENERATED_DIR, 'site-data.ts'), header);
  console.log('[generate] Wrote src/i18n/generated/site-data.ts (' + Object.keys(site).length + ' site keys)');
}

async function main() {
  generateI18nConfig();
  generatePageContent();
  writeSiteDataTs();
  console.log('[generate-data-json] Done');
}

main().catch((err) => {
  console.error('[generate-data-json] Failed:', err);
  process.exit(1);
});
