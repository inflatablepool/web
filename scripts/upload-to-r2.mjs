import { execSync } from 'node:child_process';
import path from 'node:path';
import { globSync } from 'glob';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BUCKET = 'inflatable-pool-factory-assets';

const assetDirs = [
  { dir: 'images', contentType: 'image/webp' },
  { dir: 'files', contentType: 'application/octet-stream' },
  { dir: 'data', contentType: 'application/json' },
];

function detectMime(filePath) {
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  if (filePath.endsWith('.pdf')) return 'application/pdf';
  if (filePath.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

async function upload() {
  console.log(`Uploading assets to R2 bucket "${BUCKET}"...`);

  for (const { dir } of assetDirs) {
    const fullDir = path.join(PUBLIC_DIR, dir);
    const files = globSync(`${fullDir}/**/*`, { nodir: true });

    for (const file of files) {
      const relativePath = path.relative(PUBLIC_DIR, file);
      const contentType = detectMime(file);
      const r2Key = relativePath.replace(/\\/g, '/');

      console.log(`  Uploading: ${r2Key} (${contentType})`);
      try {
        execSync(`npx wrangler r2 object put "${BUCKET}/${r2Key}" --file="${file}" --content-type="${contentType}"`, {
          cwd: ROOT,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err) {
        console.error(`  Failed to upload ${r2Key}: ${err.message}`);
      }
    }
  }

  console.log('Upload complete.');
}

upload().catch(console.error);
