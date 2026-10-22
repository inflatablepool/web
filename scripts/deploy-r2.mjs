import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BUCKET = 'inflatable-pool-factory-assets';

function detectMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = {
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.gif': 'image/gif',
    '.json': 'application/json',
  };
  return mime[ext] || 'application/octet-stream';
}

async function uploadAssets() {
  console.log(`[deploy-r2] Uploading assets to R2 "${BUCKET}"...`);

  const assetDirs = ['images', 'files', 'data'];
  let count = 0;

  for (const dir of assetDirs) {
    const fullDir = path.join(PUBLIC_DIR, dir);
    if (!existsSync(fullDir)) continue;

    const files = globSync(`${fullDir}/**/*`, { nodir: true });
    for (const file of files) {
      const relativePath = path.relative(PUBLIC_DIR, file);
      const r2Key = relativePath.replace(/\\/g, '/');
      const contentType = detectMime(file);

      try {
        execSync(`npx wrangler r2 object put "${BUCKET}/${r2Key}" --file="${file}" --content-type="${contentType}"`, {
          cwd: ROOT,
          stdio: 'pipe',
          timeout: 30000,
        });
        count++;
      } catch (err) {
        console.error(`  [deploy-r2] Failed: ${r2Key} - ${err.message}`);
      }
    }
  }

  console.log(`[deploy-r2] Uploaded ${count} assets`);
}

export { uploadAssets };

// Self-invoke when run directly (e.g. `node scripts/deploy-r2.mjs` or via
// `npm run deploy`) so the public R2 bucket is actually populated.
uploadAssets().catch((err) => {
  console.error('[deploy-r2] Failed:', err);
  process.exit(1);
});
