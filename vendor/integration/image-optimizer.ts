import type { AstroIntegration } from 'astro';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function imageOptimizer(): AstroIntegration {
  let outDir: string;

  return {
    name: 'image-optimizer',
    hooks: {
      'astro:config:done': ({ config }) => {
        const raw = config.outDir?.pathname || '/dist/';
        const platformPath = raw.startsWith('/') && process.platform === 'win32' ? raw.slice(1) : raw;
        // Worker mode emits under dist/client; Pages/static mode emits at dist root.
        const base = config.output === 'server' ? path.resolve(platformPath, 'client') : path.resolve(platformPath);
        outDir = base;
      },
      'astro:build:done': async () => {
        const imagesDir = path.join(outDir, 'images', 'Inflatable Pool Factory');
        if (!fs.existsSync(imagesDir)) {
          return;
        }

        const rootDir = path.resolve(__dirname, '../..');
        const scriptPath = path.join(rootDir, 'scripts', 'optimize-images-worker.mjs');
        try {
          const output = execSync(`node "${scriptPath}" "${outDir}"`, { encoding: 'utf-8', timeout: 60000 });
          console.log(output.trim());
        } catch (err: any) {
          console.error(`[image-optimizer] Failed: ${err.message}`);
          if (err.stdout) console.log(err.stdout);
          if (err.stderr) console.error(err.stderr);
        }
      },
    },
  };
}
