import type { AstroIntegration } from 'astro';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TAG_RE = /<img\b[^>]*>/g;
const SRC_RE = /\bsrc\s*=\s*"([^"]+)"/i;

/**
 * Post-build pass that injects width/height into <img> tags whose src is a
 * known public/images/ asset (registry built by scripts/generate-image-dimensions.mjs).
 * Remote images (assets.inflatablepoolfactory.com) and /images/... URLs that callers emit
 * without explicit dimensions otherwise render without intrinsic size, causing
 * CLS. The registry gives us exact pixel dimensions with zero network cost.
 */
export default function imgDimensions(): AstroIntegration {
  let outDir: string;

  return {
    name: 'img-dimensions',
    hooks: {
      'astro:config:done': ({ config }) => {
        const raw = config.outDir?.pathname || '/dist/';
        const platformPath = raw.startsWith('/') && process.platform === 'win32' ? raw.slice(1) : raw;
        outDir = path.resolve(platformPath);
      },
      'astro:build:done': async () => {
        const registryPath = path.resolve(__dirname, '../../src/data/site/image-dimensions.json');
        if (!fs.existsSync(registryPath)) {
          console.log('[img-dimensions] registry missing — skipping');
          return;
        }
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as Record<string, { w: number; h: number }>;

        const files = fs.existsSync(outDir) ? listHtmlFiles(outDir) : [];
        let injected = 0;
        let touchedFiles = 0;

        for (const file of files) {
          let html = fs.readFileSync(file, 'utf8');
          let changed = false;
          html = html.replace(TAG_RE, (tag) => {
            if (/\bwidth\s*=/i.test(tag)) return tag;
            const src = SRC_RE.exec(tag)?.[1];
            if (!src) return tag;
            let key = src;
            if (/^https?:\/\//i.test(key)) {
              try {
                key = new URL(key).pathname;
              } catch {
                return tag;
              }
            }
            const dim = registry[key];
            if (!dim) return tag;
            changed = true;
            injected++;
            const attrs = ` width="${dim.w}" height="${dim.h}"`;
            if (tag.endsWith('/>')) return tag.slice(0, -2) + attrs + '/>';
            return tag.slice(0, -1) + attrs + '>';
          });
          if (changed) {
            fs.writeFileSync(file, html, 'utf8');
            touchedFiles++;
          }
        }

        console.log(`[img-dimensions] injected width/height into ${injected} <img> tags across ${touchedFiles} pages`);
      },
    },
  };
}

function listHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}
