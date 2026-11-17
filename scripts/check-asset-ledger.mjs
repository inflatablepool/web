// Asset provenance + licence ledger gate.
//
// Every file in public/images must have an entry in
// src/data/site/asset-ledger.yaml. The ledger records what the asset is
// (product photo / company photo / AI illustration / reference / brand asset),
// where it came from, its licence, and its review state. Source-file usage is
// derived by scanning /images/... references and written to asset-usage.json
// for the admin review UI.
//
// Modes:
//   (default)          validate, fail on missing/invalid/rejected assets
//   --strict           also fail when a non-baseline asset is not approved
//   --init             add missing public/images entries (first run: baseline)
//   --write-usage      refresh asset-usage.json from the current source tree
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { globSync } from 'glob';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LEDGER_PATH = path.join(ROOT, 'src', 'data', 'site', 'asset-ledger.yaml');
export const USAGE_PATH = path.join(ROOT, 'src', 'data', 'site', 'asset-usage.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

export const ASSET_TYPES = [
  'product_photo',
  'company_photo',
  'brand_asset',
  'ai_illustration',
  'reference',
  'unconfirmed',
];
export const ASSET_LICENSES = [
  'company_owned',
  'supplier_authorized',
  'licensed_stock',
  'ai_generated',
  'public_domain',
  'unverified',
];
export const REVIEW_STATUSES = ['approved', 'pending', 'rejected'];

const SCAN_EXTENSIONS = new Set(['.yaml', '.yml', '.ts', '.astro', '.json']);
const SCAN_EXCLUDES = new Set([
  'src/data/site/image-dimensions.json',
  'src/data/site/asset-usage.json',
  'src/data/site/asset-ledger.yaml',
]);

export function listImageFiles() {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return globSync('**/*', { cwd: IMAGES_DIR, nodir: true })
    .filter((rel) => /\.(webp|png|jpe?g|gif|avif)$/i.test(rel))
    .map((rel) => '/images/' + rel.split(path.sep).join('/'))
    .sort();
}

export function scanUsage() {
  const usage = new Map();
  const files = globSync('src/**/*', { cwd: ROOT, nodir: true });
  for (const rel of files) {
    const normalized = rel.split(path.sep).join('/');
    if (!SCAN_EXTENSIONS.has(path.extname(normalized).toLowerCase())) continue;
    if (SCAN_EXCLUDES.has(normalized)) continue;
    // Build-generated i18n payloads embed site YAML, so they are not real
    // asset references (and would make every ledger entry self-referential).
    if (normalized.startsWith('src/i18n/generated/')) continue;
    // Admin-only pages are not published content; their form defaults are
    // intentionally ignored by the public asset ledger.
    if (normalized.startsWith('src/pages/keystatic/')) continue;
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const re =
      /(?:https:\/\/assets\.inflatablepoolfactory\.com)?(\/images\/[A-Za-z0-9._~\-/]+?\.(?:webp|png|jpe?g|gif|avif))/gi;
    let match;
    while ((match = re.exec(text))) {
      const asset = match[1];
      if (!usage.has(asset)) usage.set(asset, new Set());
      usage.get(asset).add(normalized);
    }
  }
  return usage;
}

export function usageToObject(usage) {
  const assets = {};
  for (const asset of [...usage.keys()].sort()) {
    assets[asset] = [...usage.get(asset)].sort();
  }
  return { assets };
}

export function loadLedger() {
  if (!fs.existsSync(LEDGER_PATH)) return { version: 1, updated: '', assets: [] };
  const parsed = yamlLoad(fs.readFileSync(LEDGER_PATH, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.assets)) {
    return { version: 1, updated: '', assets: [] };
  }
  return parsed;
}

function defaultSource(assetPath) {
  if (assetPath.startsWith('/images/pool-ideas/')) {
    return 'Pool-ideas expansion (commit 635af79, 2026-10-17); original photographer/licence not recorded.';
  }
  if (assetPath.startsWith('/images/pools/')) {
    return 'Initial site import (commit 9d9a9ee, 2026-10-14); supplier/company provenance not recorded.';
  }
  if (
    assetPath === '/images/team-all.webp' ||
    assetPath === '/images/tech-meeting-small.webp' ||
    assetPath === '/images/Helen-contact-480x463.webp'
  ) {
    return 'Initial site import (commit 9d9a9ee, 2026-10-14); company photo provenance not recorded.';
  }
  return 'Pre-ledger asset; original provenance not recorded.';
}

function defaultType(assetPath) {
  if (assetPath.startsWith('/images/pools/')) return 'product_photo';
  if (
    assetPath === '/images/team-all.webp' ||
    assetPath === '/images/tech-meeting-small.webp' ||
    assetPath === '/images/Helen-contact-480x463.webp'
  ) {
    return 'company_photo';
  }
  if (assetPath === '/images/default.webp' || assetPath === '/images/og-default.jpg') return 'brand_asset';
  if (assetPath.startsWith('/images/pool-ideas/')) return 'reference';
  return 'unconfirmed';
}

export function defaultEntry(assetPath, { legacyBaseline = false } = {}) {
  return {
    path: assetPath,
    storage: 'repo',
    type: defaultType(assetPath),
    source: defaultSource(assetPath),
    license: 'unverified',
    reviewStatus: 'pending',
    legacyBaseline,
    approvedBy: '',
    approvedAt: '',
    notes: '',
  };
}

export function writeLedger(ledger) {
  const ordered = {
    version: ledger.version || 1,
    updated: ledger.updated || '',
    assets: [...(ledger.assets || [])].sort((a, b) => String(a.path).localeCompare(String(b.path))),
  };
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.writeFileSync(LEDGER_PATH, yamlDump(ordered, { lineWidth: -1, noRefs: true, sortKeys: false }), 'utf8');
  return ordered;
}

export function writeUsage(usage) {
  fs.mkdirSync(path.dirname(USAGE_PATH), { recursive: true });
  fs.writeFileSync(USAGE_PATH, JSON.stringify(usageToObject(usage), null, 2) + '\n', 'utf8');
}

function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateLedger(ledger, files, usage, { strict = false, usageFileCurrent = true } = {}) {
  const errors = [];
  const warnings = [];
  const fileSet = new Set(files);
  const entries = Array.isArray(ledger.assets) ? ledger.assets : [];
  const byPath = new Map();
  const stats = {
    files: files.length,
    entries: entries.length,
    referenced: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    legacyPending: 0,
    newPending: 0,
    unverified: 0,
  };

  for (const entry of entries) {
    const assetPath = typeof entry?.path === 'string' ? entry.path : '';
    if (!assetPath) {
      errors.push('ledger entry without a path');
      continue;
    }
    if (!assetPath.startsWith('/images/')) {
      errors.push(`${assetPath}: path must start with /images/`);
    }
    if (byPath.has(assetPath)) {
      errors.push(`${assetPath}: duplicate ledger entry`);
      continue;
    }
    byPath.set(assetPath, entry);

    if (!ASSET_TYPES.includes(entry.type)) {
      errors.push(`${assetPath}: invalid type "${entry.type}"`);
    }
    if (!ASSET_LICENSES.includes(entry.license)) {
      errors.push(`${assetPath}: invalid license "${entry.license}"`);
    }
    if (!REVIEW_STATUSES.includes(entry.reviewStatus)) {
      errors.push(`${assetPath}: invalid reviewStatus "${entry.reviewStatus}"`);
    }
    if (entry.storage !== 'repo' && entry.storage !== 'r2') {
      errors.push(`${assetPath}: invalid storage "${entry.storage}"`);
    }
    if (typeof entry.legacyBaseline !== 'boolean') {
      errors.push(`${assetPath}: legacyBaseline must be true or false`);
    }
    if (entry.storage === 'repo' && !fileSet.has(assetPath)) {
      warnings.push(`${assetPath}: ledger entry has no matching file in public/images`);
    }
    if (entry.storage === 'r2' && fileSet.has(assetPath)) {
      warnings.push(`${assetPath}: marked storage=r2 but a local public/images file exists`);
    }

    if (entry.reviewStatus === 'approved') {
      stats.approved += 1;
      if (entry.license === 'unverified') {
        errors.push(`${assetPath}: approved asset must have a concrete license (not "unverified")`);
      }
      if (!String(entry.source || '').trim()) {
        errors.push(`${assetPath}: approved asset must record a source`);
      }
      if (!String(entry.approvedBy || '').trim()) {
        errors.push(`${assetPath}: approved asset must record approvedBy`);
      }
      if (!isDateString(entry.approvedAt)) {
        errors.push(`${assetPath}: approved asset must record approvedAt as YYYY-MM-DD`);
      }
    } else if (entry.reviewStatus === 'pending') {
      stats.pending += 1;
      if (entry.legacyBaseline) {
        stats.legacyPending += 1;
      } else {
        stats.newPending += 1;
        if (strict) {
          errors.push(`${assetPath}: new asset is still pending review (deploy blocked until approved)`);
        }
      }
    } else if (entry.reviewStatus === 'rejected') {
      stats.rejected += 1;
    }
    if (entry.license === 'unverified') stats.unverified += 1;
  }

  for (const file of files) {
    if (!byPath.has(file)) {
      errors.push(
        `${file}: file in public/images has no ledger entry (run: node scripts/check-asset-ledger.mjs --init)`
      );
    }
  }

  for (const [assetPath, refs] of usage.entries()) {
    stats.referenced += 1;
    const entry = byPath.get(assetPath);
    const isR2 = entry?.storage === 'r2';
    if (!fileSet.has(assetPath) && !isR2) {
      errors.push(`${assetPath}: referenced by ${refs.size} source file(s) but missing from public/images`);
      continue;
    }
    if (!entry) {
      errors.push(`${assetPath}: referenced by ${refs.size} source file(s) but missing from the ledger`);
      continue;
    }
    if (entry.reviewStatus === 'rejected') {
      errors.push(`${assetPath}: rejected asset is still referenced by ${[...refs].join(', ')}`);
    }
    if (entry.reviewStatus === 'pending' && !entry.legacyBaseline) {
      warnings.push(`${assetPath}: pending asset is referenced by ${[...refs].join(', ')}`);
    }
    if (entry.reviewStatus === 'pending' && entry.legacyBaseline) {
      warnings.push(`${assetPath}: legacy baseline asset still pending review (${refs.size} reference(s))`);
    }
  }

  for (const file of files) {
    if (!usage.has(file)) {
      warnings.push(`${file}: not referenced by any src file (still uploaded to R2)`);
    }
  }

  if (!usageFileCurrent) {
    errors.push('src/data/site/asset-usage.json is stale (run: node scripts/check-asset-ledger.mjs --write-usage)');
  }

  return { errors, warnings, stats };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const strict = args.has('--strict');
  const init = args.has('--init');
  const writeUsageFlag = args.has('--write-usage');

  const files = listImageFiles();
  if (init) {
    const firstRun = !fs.existsSync(LEDGER_PATH);
    const ledger = loadLedger();
    const existing = new Set((ledger.assets || []).map((entry) => entry.path));
    let added = 0;
    for (const file of files) {
      if (existing.has(file)) continue;
      ledger.assets.push(defaultEntry(file, { legacyBaseline: firstRun }));
      added += 1;
    }
    ledger.version = ledger.version || 1;
    ledger.updated = new Date().toISOString().split('T')[0];
    writeLedger(ledger);
    console.log(`[asset-ledger] init: added ${added} entr${added === 1 ? 'y' : 'ies'} (baseline: ${firstRun})`);
  }

  const ledger = loadLedger();
  const usage = scanUsage();
  let usageFileCurrent = true;
  if (writeUsageFlag) {
    writeUsage(usage);
  } else if (fs.existsSync(USAGE_PATH)) {
    try {
      const committed = JSON.parse(fs.readFileSync(USAGE_PATH, 'utf8'));
      usageFileCurrent = JSON.stringify(committed) === JSON.stringify(usageToObject(usage));
    } catch {
      usageFileCurrent = false;
    }
  } else {
    usageFileCurrent = false;
  }

  const { errors, warnings, stats } = validateLedger(ledger, files, usage, { strict, usageFileCurrent });

  console.log(
    `[asset-ledger] files=${stats.files} entries=${stats.entries} referenced=${stats.referenced} approved=${stats.approved} pending=${stats.pending} rejected=${stats.rejected}`
  );
  if (stats.pending > 0) {
    console.log(
      `[asset-ledger] pending: legacy=${stats.legacyPending} new=${stats.newPending} unverified-license=${stats.unverified}`
    );
  }
  for (const warning of warnings) console.log(`[asset-ledger] WARN ${warning}`);
  for (const error of errors) console.log(`[asset-ledger] ERROR ${error}`);
  console.log(
    `[asset-ledger] RESULT: ${errors.length === 0 ? 'PASS' : 'FAIL'} (${errors.length} error(s), ${warnings.length} warning(s))`
  );
  process.exitCode = errors.length === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
