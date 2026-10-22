import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: optimize-images-worker.mjs <outDir>');
  process.exit(1);
}

const rules = [
  { pattern: /[\\/]hero[\\/]/, width: 1920, quality: 85 },
  { pattern: /[\\/]categories[\\/]/, width: 800, quality: 80 },
  { pattern: /[\\/]products[\\/]/, width: 800, quality: 80 },
  { pattern: /[\\/]use-cases[\\/]/, width: 800, quality: 80 },
  { pattern: /[\\/]news[\\/]/, width: 800, quality: 80 },
];

function detectRule(filePath) {
  for (const r of rules) {
    if (r.pattern.test(filePath)) return r;
  }
  return { width: 1600, quality: 80 };
}

async function walk(dir) {
  const results = [];
  const errors = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return { results, errors };
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walk(full);
      results.push(...sub.results);
      errors.push(...sub.errors);
    } else if (entry.isFile() && /\.(jpg|jpeg|png)$/i.test(entry.name)) {
      const ext = path.extname(entry.name).toLowerCase();
      const webpPath = full.replace(ext, '.webp');
      if (fs.existsSync(webpPath) && fs.statSync(webpPath).mtimeMs > fs.statSync(full).mtimeMs) {
        continue;
      }
      const rule = detectRule(full);
      try {
        const img = sharp(full);
        const meta = await img.metadata();
        if (meta.width && meta.width > rule.width) img.resize(rule.width);
        await img.webp({ quality: rule.quality }).toFile(webpPath);
        const origKB = (fs.statSync(full).size / 1024).toFixed(0);
        const webpKB = (fs.statSync(webpPath).size / 1024).toFixed(0);
        results.push(`${path.relative(outDir, webpPath)} (${origKB}KB -> ${webpKB}KB)`);
      } catch (err) {
        errors.push(`${path.relative(outDir, full)}: ${err.message}`);
      }
    }
  }
  return { results, errors };
}

const imagesDir = path.join(outDir, 'images', 'Inflatable Pool Factory');
if (!fs.existsSync(imagesDir)) {
  console.log('[image-optimizer] No images directory found');
  process.exit(0);
}

const { results, errors } = await walk(imagesDir);

if (results.length > 0) {
  console.log(`[image-optimizer] Generated ${results.length} WebP:`);
  for (const r of results) console.log(`  \u2713 ${r}`);
}
if (errors.length > 0) {
  console.log(`[image-optimizer] ${errors.length} errors:`);
  for (const e of errors) console.log(`  \u2717 ${e}`);
}
if (results.length === 0 && errors.length === 0) {
  console.log('[image-optimizer] No images to optimize');
}
