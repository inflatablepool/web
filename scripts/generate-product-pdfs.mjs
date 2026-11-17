#!/usr/bin/env node
/**
 * Generate product specification sheets and the comparison chart into
 * dist/spec-sheets/. Runs after `astro build` and before validate-dist /
 * check:links, so every PDF linked from the site exists in the deploy bundle.
 *
 * Usage:
 *   node scripts/generate-product-pdfs.mjs [--out <dir>]
 */
import path from 'node:path';
import { generateProductPdfs, PDF_DIR, PROJECT_ROOT } from './product-pdf-lib.mjs';

const argv = process.argv.slice(2);
const outIndex = argv.indexOf('--out');
const outDir =
  outIndex >= 0 && argv[outIndex + 1] ? path.resolve(argv[outIndex + 1]) : path.join(PROJECT_ROOT, 'dist', PDF_DIR);

const { products, files } = await generateProductPdfs({ root: PROJECT_ROOT, outDir });

console.log(`[pdf] Generated ${files.length} PDFs from ${products.length} products in ${outDir}`);
for (const file of files) {
  console.log(`[pdf] ${file.filename} (${file.bytes} bytes, ${file.kind})`);
}
