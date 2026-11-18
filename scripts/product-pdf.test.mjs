import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import {
  COMPARISON_PDF_FILENAME,
  PROJECT_ROOT,
  generateProductPdfs,
  loadProductSpecs,
  sanitizePdfText,
  specValue,
  wrapText,
} from './product-pdf-lib.mjs';

const EXPECTED_SLUGS = [
  'hot-tub-round',
  'hot-tub-square-rect',
  'rectangular-drop-stitch-pool',
  'round-blue-drop-stitch-pool',
];

test('product PDF text is WinAnsi-safe', () => {
  const cleaned = sanitizePdfText('Ø 2.0 × 10.0 m — 4–5 PSI “quoted” 20 °C');
  assert.equal(cleaned, 'Diameter 2.0 x 10.0 m - 4-5 PSI "quoted" 20 degC');
  assert.match(cleaned, /^[\x20-\x7e]+$/);
  assert.equal(sanitizePdfText('A\uFFFD B'), 'A B');
});

test('wrapText keeps words and respects the available width', async () => {
  const { PDFDocument: Doc, StandardFonts } = await import('pdf-lib');
  const doc = await Doc.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = wrapText(
    'Double-layer PVC drop stitch fabric with reinforced seams and a fitted thermal cover',
    font,
    9,
    120
  );
  assert.ok(lines.length > 1);
  for (const line of lines) {
    assert.ok(font.widthOfTextAtSize(line, 9) <= 120);
    assert.match(line, /^[\x20-\x7e]+$/);
  }
  assert.equal(lines.join(' '), 'Double-layer PVC drop stitch fabric with reinforced seams and a fitted thermal cover');
});

test('loadProductSpecs reads the four published MDX products', () => {
  const products = loadProductSpecs();
  assert.equal(products.length, EXPECTED_SLUGS.length);
  assert.deepEqual(products.map((product) => product.slug).sort(), [...EXPECTED_SLUGS].sort());
  for (const product of products) {
    assert.ok(product.title.length > 0, `${product.slug} title`);
    assert.ok(product.summary.length > 0, `${product.slug} summary`);
    assert.ok(product.specs.length >= 8, `${product.slug} specs`);
    assert.ok(product.price?.amount, `${product.slug} price`);
  }
  assert.equal(specValue(products[0], 'shape').toLowerCase(), 'round');
});

test('generates four A4 spec sheets plus one landscape comparison PDF', async () => {
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'ipf-product-pdf-'));
  try {
    const result = await generateProductPdfs({ root: PROJECT_ROOT, outDir });
    assert.equal(result.files.length, EXPECTED_SLUGS.length + 1);

    const filenames = readdirSync(outDir).sort();
    assert.deepEqual(filenames, [...EXPECTED_SLUGS.map((slug) => `${slug}.pdf`), COMPARISON_PDF_FILENAME].sort());

    for (const product of result.products) {
      const file = path.join(outDir, `${product.slug}.pdf`);
      const bytes = readFileSync(file);
      assert.ok(bytes.length > 2_000, `${product.slug} PDF is not empty`);
      assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');

      const pdf = await PDFDocument.load(bytes);
      assert.equal(pdf.getTitle(), `${product.title} - Specification Sheet`);
      assert.equal(pdf.getAuthor(), 'Inflatable Pool Factory');
      const pages = pdf.getPages();
      assert.equal(pages.length, 1, `${product.slug} should fit one page`);
      assert.ok(Math.abs(pages[0].getWidth() - 595.28) < 1);
      assert.ok(Math.abs(pages[0].getHeight() - 841.89) < 1);
    }

    const comparisonBytes = readFileSync(path.join(outDir, COMPARISON_PDF_FILENAME));
    assert.equal(comparisonBytes.subarray(0, 5).toString('ascii'), '%PDF-');
    const comparison = await PDFDocument.load(comparisonBytes);
    assert.equal(comparison.getTitle(), 'Inflatable Pool Product Comparison Chart');
    const pages = comparison.getPages();
    assert.equal(pages.length, 1, 'comparison should fit one landscape page');
    assert.ok(pages[0].getWidth() > pages[0].getHeight());
    assert.ok(Math.abs(pages[0].getWidth() - 841.89) < 1);
    assert.ok(Math.abs(pages[0].getHeight() - 595.28) < 1);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
