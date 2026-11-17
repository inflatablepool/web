#!/usr/bin/env node
/**
 * Validate the SEO route matrix (src/data/seo/route-matrix.yaml).
 *
 * Enforces one unique primary keyword per route, unique URLs, a call to action
 * for every route, resolvable evidence links, and no orphaned core page.
 *
 * Usage:
 *   node scripts/validate-route-matrix.mjs [--dist ./dist] [--matrix path]
 *                                          [--json report.json] [--no-dist]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = path.resolve(import.meta.dirname, '..');

const args = {
  dist: path.join(ROOT, 'dist'),
  matrix: path.join(ROOT, 'src/data/seo/route-matrix.yaml'),
  json: '',
  checkDist: true,
};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--dist') args.dist = path.resolve(argv[++i]);
  else if (arg === '--matrix') args.matrix = path.resolve(argv[++i]);
  else if (arg === '--json') args.json = path.resolve(argv[++i]);
  else if (arg === '--no-dist') args.checkDist = false;
  else {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

const REQUIRED_FIELDS = ['url', 'primary_keyword', 'intent', 'page_type', 'cta'];
const errors = [];
const warnings = [];

function error(message) {
  errors.push(message);
}
function warn(message) {
  warnings.push(message);
}

function normalizeUrl(value) {
  const clean = String(value || '')
    .trim()
    .split('?')[0]
    .split('#')[0];
  const trimmed = '/' + clean.replace(/^\/+|\/+$/g, '');
  return trimmed === '/' ? '/' : trimmed + '/';
}

function normalizeKeyword(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

if (!existsSync(args.matrix)) {
  console.error(`Route matrix not found: ${args.matrix}`);
  process.exit(1);
}

let matrix;
try {
  matrix = YAML.parse(readFileSync(args.matrix, 'utf8'));
} catch (e) {
  console.error(`Could not parse ${args.matrix}: ${e.message}`);
  process.exit(1);
}

const routes = Array.isArray(matrix?.routes) ? matrix.routes : [];
if (routes.length === 0) error('route matrix contains no routes');

const urls = new Map();
const keywords = new Map();

routes.forEach((route, index) => {
  const label = route?.url || `routes[${index}]`;
  for (const field of REQUIRED_FIELDS) {
    if (!route?.[field] || String(route[field]).trim() === '') error(`${label}: missing required field "${field}"`);
  }
  if (!route?.url) return;

  const url = normalizeUrl(route.url);
  if (urls.has(url)) error(`${label}: duplicate URL (also used by ${urls.get(url)})`);
  else urls.set(url, label);

  const keyword = normalizeKeyword(route.primary_keyword);
  if (keyword) {
    if (keywords.has(keyword))
      error(`${label}: duplicate primary keyword "${keyword}" (also used by ${keywords.get(keyword)})`);
    else keywords.set(keyword, label);
  }

  if (!Array.isArray(route.secondary_keywords) || route.secondary_keywords.length === 0) {
    warn(`${label}: no secondary_keywords listed`);
  } else {
    for (const secondary of route.secondary_keywords) {
      if (normalizeKeyword(secondary) === keyword) error(`${label}: secondary keyword repeats the primary keyword`);
    }
  }

  if (!Array.isArray(route.evidence) || route.evidence.length === 0) {
    error(`${label}: no evidence links listed`);
  }
});

// Every internal CTA/evidence target must be part of the matrix or exist in dist.
const distAvailable = args.checkDist && existsSync(path.join(args.dist, 'index.html'));
if (args.checkDist && !distAvailable) warn(`dist not found at ${args.dist}; skipping file-existence checks`);

function distHas(urlPath) {
  if (!distAvailable) return true;
  const rel = urlPath.replace(/^\//, '');
  return existsSync(path.join(args.dist, rel, 'index.html')) || existsSync(path.join(args.dist, rel));
}

for (const route of routes) {
  if (!route?.url) continue;
  const targets = [route.cta, ...(Array.isArray(route.evidence) ? route.evidence : [])].filter(Boolean);
  for (const target of targets) {
    if (/^https?:\/\//i.test(target) || String(target).startsWith('mailto:')) continue;
    const targetUrl = normalizeUrl(target);
    if (!urls.has(targetUrl) && !distHas(targetUrl)) {
      error(`${route.url}: target ${target} is neither a matrix route nor a built page in dist/`);
    }
  }
  if (distAvailable && route.indexable !== false && !distHas(normalizeUrl(route.url))) {
    error(`${route.url}: indexable route is missing from dist/`);
  }
}

// Orphan check: core root landing pages must be represented in the matrix.
const CORE_PAGE_FILES = [
  'index.astro',
  'about.astro',
  'commercial-pools.astro',
  'contact.astro',
  'faq.astro',
  'find-your-pool.astro',
  'for-businesses.astro',
  'manufacturing.astro',
  'oem-odm.astro',
  'private-label.astro',
  'quality-control.astro',
  'request-quotation.astro',
  'wholesale.astro',
  'products/index.astro',
  'products/specs.astro',
  'products/compare.astro',
  'guides/index.astro',
  'pool-ideas/index.astro',
];

function fileToUrl(file) {
  const noExt = file.replace(/\.astro$/, '');
  const noIndex = noExt.replace(/(^|\/)index$/, '');
  const clean = noIndex.replace(/^\/+|\/+$/g, '');
  return clean ? `/${clean}/` : '/';
}

for (const file of CORE_PAGE_FILES) {
  const full = path.join(ROOT, 'src/pages', file);
  if (!existsSync(full)) {
    warn(`core page source is missing: src/pages/${file}`);
    continue;
  }
  const url = fileToUrl(file);
  if (!urls.has(url)) error(`${url}: core landing page has no route-matrix entry (orphan)`);
}

if (args.json) {
  writeFileSync(
    args.json,
    JSON.stringify({ matrix: args.matrix, dist: args.dist, routes: routes.length, errors, warnings }, null, 2)
  );
}

for (const warning of warnings) console.log(`WARN   ${warning}`);
for (const message of errors) console.log(`ERROR  ${message}`);
console.log(`\nRoute matrix: ${routes.length} routes, ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length > 0) {
  console.log('Route matrix validation FAILED.');
  process.exit(1);
}
console.log('Route matrix validation passed.');
