#!/usr/bin/env node
/**
 * Domain Migration Script
 * Usage: node scripts/migrate-domain.mjs <new-domain> [new-assets-domain]
 *   --dry-run  Print changes without modifying files
 *
 * Examples:
 *   node scripts/migrate-domain.mjs https://example.com --dry-run
 *   node scripts/migrate-domain.mjs https://example.com https://assets.example.com
 *
 * This script replaces all hardcoded domain references across the project.
 * It does NOT modify wrangler.toml route patterns (must be done manually).
 * It does NOT modify Cloudflare Workers secrets (must be set via wrangler secret put).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative, resolve } from 'path';
import { readdirSync, statSync } from 'fs';

const ROOT = resolve(import.meta.dirname, '..');
const OLD_DOMAIN = 'https://inflatablepoolfactory.com';
const OLD_ASSETS = 'https://assets.inflatablepoolfactory.com';
const OLD_EMAIL = 'info@inflatablepoolfactory.com';
const OLD_WEB_EMAIL = 'web@inflatablepoolfactory.com';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const domainArgs = args.filter((a) => a !== '--dry-run');

const newDomain = domainArgs[0]?.replace(/\/+$/, '');
const newAssets = domainArgs[1]?.replace(/\/+$/, '') || newDomain;

if (!newDomain) {
  console.error('Usage: node scripts/migrate-domain.mjs <new-domain> [new-assets-domain] [--dry-run]');
  console.error('Example: node scripts/migrate-domain.mjs https://example.com https://assets.example.com');
  process.exit(1);
}

if (!newDomain.startsWith('http://') && !newDomain.startsWith('https://')) {
  console.error('Error: Domain must start with http:// or https://');
  process.exit(1);
}

if (newDomain === OLD_DOMAIN) {
  console.error('Error: New domain is the same as the old domain');
  process.exit(1);
}

const SKIP_DIRS = ['.git', 'node_modules', 'dist', '.yarn'];
const SKIP_FILES = ['yarn.lock', 'package-lock.json', '.gitignore', 'migrate-domain.mjs'];

function shouldSkip(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  for (const dir of SKIP_DIRS) {
    if (rel.startsWith(dir + '/') || rel === dir) return true;
  }
  for (const f of SKIP_FILES) {
    if (rel === f || rel.endsWith('/' + f)) return true;
  }
  return false;
}

function collectFiles(dir) {
  const entries = [];
  try {
    const list = readdirSync(dir);
    for (const name of list) {
      const full = join(dir, name);
      if (shouldSkip(full)) continue;
      const stat = existsSync(full) ? statSync(full) : null;
      if (!stat) continue;
      if (stat.isDirectory()) {
        entries.push(...collectFiles(full));
      } else if (stat.isFile() && stat.size > 0 && stat.size < 5 * 1024 * 1024) {
        const ext = name.split('.').pop().toLowerCase();
        if (
          ![
            'png',
            'jpg',
            'jpeg',
            'gif',
            'webp',
            'ico',
            'svg',
            'woff',
            'woff2',
            'ttf',
            'eot',
            'otf',
            'pdf',
            'zip',
            'gz',
          ].includes(ext)
        ) {
          entries.push(full);
        }
      }
    }
  } catch {
    /* skip */
  }
  return entries;
}

console.log(`\n  ${dryRun ? 'DRY RUN: Would migrate' : 'Migrating'} from ${OLD_DOMAIN} → ${newDomain}`);
if (newAssets !== newDomain) {
  console.log(`  Assets: ${OLD_ASSETS} → ${newAssets}`);
}
console.log('');

const files = collectFiles(ROOT);
let changedCount = 0;
let totalReplacements = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf-8');
    const original = content;
    const rel = relative(ROOT, file).replace(/\\/g, '/');

    content = content
      .replace(new RegExp(OLD_ASSETS.replace(/\./g, '\\.'), 'g'), newAssets)
      .replace(new RegExp(OLD_DOMAIN.replace(/\./g, '\\.'), 'g'), newDomain)
      .replace(new RegExp(OLD_WEB_EMAIL.replace(/\./g, '\\.'), 'g'), 'web@' + newDomain.replace(/https?:\/\//, ''))
      .replace(new RegExp(OLD_EMAIL.replace(/\./g, '\\.'), 'g'), 'info@' + newDomain.replace(/https?:\/\//, ''));

    const replaced = content !== original;
    if (replaced) {
      const count =
        (content.match(new RegExp(newDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length +
        (newAssets !== newDomain
          ? (content.match(new RegExp(newAssets.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
          : 0);
      console.log(`  ${rel} (${count} replacements)`);
      changedCount++;
      totalReplacements += count;
      if (!dryRun) {
        writeFileSync(file, content, 'utf-8');
      }
    }
  } catch (err) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    console.error(`  Error: ${rel}: ${err.message}`);
  }
}

console.log(
  `\n  ${dryRun ? 'DRY RUN - no files modified.' : 'Done!'} ${changedCount} files affected, ${totalReplacements} total replacements.`
);
if (!dryRun) {
  console.log(`\n  Remaining manual steps:`);
  console.log(`  1. Update CORS origin in workers/admin-worker/index.ts`);
  console.log(`  2. Fix wrangler.toml route patterns for each Worker`);
  console.log(`  3. Redeploy all Workers: npm run deploy:workers`);
  console.log(`  4. Redeploy Pages: npx wrangler pages deploy dist/`);
  console.log(`  5. Update Cloudflare Workers secrets if needed: wrangler secret put`);
}
