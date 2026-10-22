// Scan all non-EN page yamls for untranslated EN prose leaks.
// Usage: node tools/i18n-audit.mjs [base.yaml]
// Writes tools/_work/audit.json + prints per-file/per-lang summary.
// Leak = string leaf whose value is byte-identical to the EN source AND looks like prose.
// Machine-facing keys (icon/href/slug/source/address/company/customer/color/badge/premium/standard/...)
// are excluded by design, as are MACHINE_VALUES (brand names, cert-class codes, product models).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const YAML = require('yaml');
const PAGES = path.join(ROOT, 'src/data/pages');
const OUT_DIR = path.join(ROOT, 'tools', '_work');
const LANGS = [
  'fr',
  'de',
  'es',
  'pt',
  'ar',
  'it',
  'ru',
  'pl',
  'nl',
  'sv',
  'no',
  'el',
  'fi',
  'da',
  'cs',
  'th',
  'hr',
  'tl',
  'hu',
  'ro',
  'sk',
  'bg',
  'sl',
  'sr',
  'tr',
  'id',
  'he',
  'ms',
  'lt',
  'lv',
  'et',
];
const ONLY = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;

const NOISE_KEY =
  /(^|\.)(icon|href|link|url|src|alt|file|image|cta_href|amount|logo|video|photo|email|phone|whatsapp|sku|code|id|source|address|company|customer|color|badge|location|imageAlt|slug|premium|standard)(\[|\.|$)/;
// Values that must stay byte-identical to EN in every language (brand names,
// certification-class codes, product model names living under prose keys).
const MACHINE_VALUES = new Set([
  'Inflatable Pool Factory Custom Lab',
  'USCG Type III / Type V',
  'CE / ISO / USCG Type III/V',
  'RIB 600 Patrol (Twin Engine)',
]);
const isProse = (v) =>
  v.trim().length >= 20 &&
  /[a-z]{3}/.test(v) &&
  !/^https?:/.test(v) &&
  !/\.(pdf|dxf|step|dwg|png|jpg|webp|svg)$/i.test(v) &&
  !/^[\d\s.,:+\-/%$()–—]+$/.test(v);

const walk = (o, p, out) => {
  if (typeof o === 'string') {
    if (!NOISE_KEY.test(p) && !MACHINE_VALUES.has(o) && isProse(o)) out.push({ path: p, v: o });
    return out;
  }
  if (Array.isArray(o)) {
    o.forEach((x, i) => walk(x, `${p}[${i}]`, out));
    return out;
  }
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k, out);
  }
  return out;
};

const enFiles = fs.readdirSync(PAGES).filter((f) => f.endsWith('.yaml') && (!ONLY || f === ONLY));
const report = { perLang: {}, perFile: {} };
let total = 0;

for (const lang of LANGS) {
  const langDir = path.join(PAGES, lang);
  report.perLang[lang] = {};
  for (const f of enFiles) {
    const langFile = path.join(langDir, f);
    if (!fs.existsSync(langFile)) continue; // by-design EN fallback
    const enProse = walk(YAML.parse(fs.readFileSync(path.join(PAGES, f), 'utf8')), '', []);
    const lv = walk(YAML.parse(fs.readFileSync(langFile, 'utf8')), '', []);
    const langVals = new Set(lv.map((x) => x.v));
    const leaks = enProse.filter((x) => langVals.has(x.v));
    if (leaks.length > 0) {
      report.perLang[lang][f] = leaks.map((x) => ({ path: x.path, v: x.v }));
      report.perFile[f] = report.perFile[f] || {};
      report.perFile[f][lang] = leaks.map((x) => ({ path: x.path, v: x.v }));
      total += leaks.length;
    }
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'audit.json'), JSON.stringify(report, null, 1), 'utf8');

console.log('=== REFINED AUDIT (real prose leaks) ===');
console.log(`TOTAL leak strings (lang-file pairs): ${total}`);
console.log(`\n-- per file (leak count summed over langs) --`);
const fileTotals = Object.entries(report.perFile)
  .map(([f, langs]) => [f, Object.values(langs).reduce((s, a) => s + a.length, 0), Object.keys(langs).length])
  .sort((a, b) => b[1] - a[1]);
for (const [f, n, langs] of fileTotals)
  console.log(`${String(n).padStart(4)}  ${String(langs).padStart(2)} langs  ${f}`);
console.log(`\n-- per lang --`);
for (const l of LANGS)
  console.log(
    `${l}: ${Object.values(report.perLang[l]).reduce((s, a) => s + a.length, 0)} leaks in ${Object.keys(report.perLang[l]).length} files`
  );
