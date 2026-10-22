#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const RULES = [
  { pattern: /[\\/]hero[\\/]/, width: 1920, quality: 85 },
  { pattern: /[\\/]categories[\\/]/, width: 800, quality: 80 },
  { pattern: /[\\/]products[\\/]/, width: 800, quality: 80 },
  { pattern: /[\\/]use-cases[\\/]/, width: 800, quality: 80 },
  { pattern: /[\\/]news[\\/]/, width: 800, quality: 80 },
];

function detectRule(filePath) {
  for (const r of RULES) {
    if (r.pattern.test(filePath)) return r;
  }
  return { width: 1600, quality: 80 };
}

async function convertFile(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return null;
  if (ext === '.webp') return null;

  const destPath = srcPath.replace(/(\.(?:jpg|jpeg|png))$/i, '.webp');
  if (srcPath === destPath) return null;

  const rule = detectRule(srcPath);

  try {
    const img = sharp(srcPath);
    const meta = await img.metadata();
    const opts = {};
    if (meta.width && meta.width > rule.width) opts.width = rule.width;

    await img
      .resize({ ...opts, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: rule.quality })
      .toFile(destPath);

    const origKB = (fs.statSync(srcPath).size / 1024).toFixed(0);
    const webpKB = (fs.statSync(destPath).size / 1024).toFixed(0);
    const saved = origKB - webpKB;
    return { file: path.relative(process.cwd(), destPath), origKB, webpKB, saved, width: meta.width };
  } catch (err) {
    return { file: path.relative(process.cwd(), srcPath), error: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node scripts/convert-to-webp.mjs <file-or-dir> [file-or-dir ...]

Convert images to WebP with site-appropriate sizing:

  Directory     Width   Quality
  ─────────────────────────────
  hero/         1920px  85
  categories/    800px  80
  products/      800px  80
  use-cases/     800px  80
  news/          800px  80
  other/        1600px  80

Examples:
  node scripts/convert-to-webp.mjs public/images/inflatable-pool-factory/products
  node scripts/convert-to-webp.mjs photo.jpg
  node scripts/convert-to-webp.mjs *.png
`);
    process.exit(0);
  }

  const files = [];
  for (const arg of args) {
    if (fs.existsSync(arg)) {
      if (fs.statSync(arg).isDirectory()) {
        const found = globSync(path.join(arg, '**/*.{jpg,jpeg,png}').replace(/\\/g, '/'), { nocase: true });
        files.push(...found);
      } else {
        files.push(arg);
      }
    } else {
      const found = globSync(arg, { nocase: true });
      if (found.length > 0) files.push(...found);
      else console.error(`Not found: ${arg}`);
    }
  }

  if (files.length === 0) {
    console.log('No image files found.');
    process.exit(0);
  }

  console.log(`Processing ${files.length} file(s)...\n`);

  let ok = 0,
    fail = 0,
    totalSaved = 0;
  for (const f of files) {
    const result = await convertFile(f);
    if (!result) continue;

    if (result.error) {
      console.log(`  \u2717 ${result.file} -> ${result.error}`);
      fail++;
    } else {
      console.log(`  \u2713 ${result.file}  (${result.origKB}KB -> ${result.webpKB}KB, -${result.saved}KB)`);
      ok++;
      totalSaved += result.saved;
    }
  }

  console.log(`\nDone: ${ok} converted, ${fail} failed, ${totalSaved}KB saved`);
}

main().catch(console.error);
