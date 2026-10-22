import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = 'https://assets.inflatablepoolfactory.com';

// Skip already-absolute URLs and bundled asset aliases (~/assets/images).
const RE = /(?<!https:\/\/assets\.Inflatable Pool Factory\.com)(?<!assets)\/(images|files)\//g;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);
const SKIP_FILES = new Set(['assets.ts']); // the helper itself
const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.astro',
  '.yaml',
  '.yml',
  '.json',
  '.md',
  '.mdx',
  '.html',
  '.css',
  '.scss',
  '.svg',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const srcDir = path.join(ROOT, 'src');
const files = walk(srcDir).filter((f) => {
  if (SKIP_FILES.has(path.basename(f))) return false;
  return TEXT_EXT.has(path.extname(f).toLowerCase());
});

let changed = 0;
for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (!RE.test(text)) continue;
  RE.lastIndex = 0;
  const out = text.replace(RE, `${BASE}/$1/`);
  if (out !== text) {
    fs.writeFileSync(file, out);
    changed++;
  }
}

console.log(`[rewrite-asset-urls] Updated ${changed} files under src/ -> ${BASE}`);
