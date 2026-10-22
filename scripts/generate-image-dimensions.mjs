// Generates src/data/site/image-dimensions.json — width/height registry for
// images served from public/images (uploaded to R2 as assets.inflatablepoolfactory.com).
// Image.astro uses it to emit width/height (and aspect-ratio) on remote <img>
// tags that don't pass explicit dimensions, fixing CLS from missing sizes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const OUT = path.join(ROOT, 'src', 'data', 'site', 'image-dimensions.json');

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('[image-dimensions] public/images not found — skipping');
    process.exit(0);
  }

  const EXT = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif']);
  const files = globSync(`${IMAGES_DIR}/**/*`, { nodir: true }).filter((f) => EXT.has(path.extname(f).toLowerCase()));
  const registry = {};
  let withDims = 0;
  let failed = 0;

  for (const file of files) {
    const rel = '/' + path.relative(IMAGES_DIR, file).split(path.sep).join('/');
    // R2 objects are stored with an `images/` prefix (see scripts/fast-upload-r2.mjs),
    // so remote URLs are https://assets.inflatablepoolfactory.com/images/<rel>.
    const key = '/images' + rel;
    try {
      const meta = await sharp(file).metadata();
      if (meta.width && meta.height) {
        registry[key] = { w: meta.width, h: meta.height };
        withDims++;
      }
    } catch {
      failed++;
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  console.log(
    `[image-dimensions] ${withDims} images with dims (${files.length} files, ${failed} failed) -> src/data/site/image-dimensions.json`
  );
}

main().catch((err) => {
  console.error('[image-dimensions] Failed:', err);
  process.exit(1);
});
