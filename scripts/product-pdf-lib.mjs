/**
 * Build-time PDF generation for product specification sheets and the
 * cross-product comparison chart.
 *
 * Facts come only from:
 *   - src/content/products/*.mdx (title, sku, summary, specs, price note)
 *   - src/config/facts.json    (legal entity and contact details)
 *
 * Output is written to dist/spec-sheets/ by the CLI wrapper, so the files are
 * generated fresh for every build and never tracked in git. No certification,
 * MOQ, capacity, or lead-time claims are invented here.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const PDF_DIR = 'spec-sheets';
export const COMPARISON_PDF_FILENAME = 'product-comparison.pdf';
export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

const A4 = [595.28, 841.89];
const A4_LANDSCAPE = [841.89, 595.28];
const PORTRAIT_MARGIN = 44;
const LANDSCAPE_MARGIN = 36;
const PORTRAIT_BOTTOM = 46;
const LANDSCAPE_BOTTOM = 42;

const CATEGORY_LABELS = {
  pool: 'Inflatable Swimming Pools',
};

const COLORS = {
  ink: rgb(0.11, 0.16, 0.23),
  body: rgb(0.28, 0.33, 0.41),
  muted: rgb(0.45, 0.5, 0.56),
  brand: rgb(0.03, 0.53, 0.75),
  brandDark: rgb(0.02, 0.3, 0.47),
  brandLight: rgb(0.94, 0.97, 0.99),
  rule: rgb(0.84, 0.88, 0.92),
  rowAlt: rgb(0.97, 0.98, 0.99),
  labelBg: rgb(0.95, 0.97, 0.98),
  white: rgb(1, 1, 1),
};

const DISCLAIMER =
  'Reference prices are FOB Qingdao and are confirmed in the quotation. Specifications, quantity basis, lead time, and compliance documentation are confirmed per product and project.';

const COMPARISON_ROWS = [
  { label: 'Category', getValue: (product) => product.categoryLabel },
  { label: 'Shape', spec: 'shape' },
  { label: 'Color', spec: 'color' },
  { label: 'Wall material', spec: 'wall material' },
  { label: 'Recommended pressure', spec: 'recommended pressure' },
  { label: 'Wall thickness', spec: 'wall thickness' },
  { label: 'Size range', spec: 'size range' },
  { label: 'Weight range', spec: 'weight range' },
  { label: 'Inflation time', spec: 'inflation time' },
  { label: 'Included', spec: 'included' },
  {
    label: 'Reference price',
    getValue: (product) => (product.price ? `${formatPrice(product)} (FOB Qingdao)` : '-'),
  },
];

/**
 * Replace characters that the PDF standard Helvetica font (WinAnsi) cannot
 * encode. Product data uses Ø, ×, en/em dashes and curly quotes, so the
 * replacements keep the meaning while producing a portable PDF.
 */
export function sanitizePdfText(value) {
  let text = String(value ?? '');
  const replacements = [
    [/\u00d8/g, 'Diameter '],
    [/\u00f8/g, 'diameter '],
    [/\u00d7/g, 'x'],
    [/[\u2013\u2014\u2212]/g, '-'],
    [/[\u2018\u2019\u02bc]/g, "'"],
    [/[\u201c\u201d]/g, '"'],
    [/\u00b0/g, ' deg'],
    [/\u00b1/g, '+/-'],
    [/\u2264/g, '<='],
    [/\u2265/g, '>='],
    [/\u00a0/g, ' '],
    [/\u2026/g, '...'],
    [/\u00b7/g, '-'],
    [/\u00a9/g, '(c)'],
    [/\u00ae/g, '(R)'],
    [/\u2122/g, '(TM)'],
  ];
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  text = text.normalize('NFKC');
  text = text.replace(/\r\n?/g, '\n');
  text = text.replace(/[^\n\x20-\x7e]/g, ' ');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/ *\n */g, '\n');
  return text.trim();
}

/** Greedy word wrap with character fallback for long unbroken tokens. */
export function wrapText(value, font, size, maxWidth) {
  const text = sanitizePdfText(value);
  if (!text) return [''];
  if (maxWidth <= 0) return [text];

  const lines = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ').filter(Boolean);
    if (words.length === 0) continue;

    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line) {
        lines.push(line);
      }

      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word;
        continue;
      }

      let chunk = '';
      for (const char of word) {
        const next = chunk + char;
        if (font.widthOfTextAtSize(next, size) <= maxWidth) {
          chunk = next;
        } else {
          if (chunk) lines.push(chunk);
          chunk = char;
        }
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }

  return lines.length > 0 ? lines : [''];
}

export function formatPrice(product) {
  const amount = sanitizePdfText(product?.price?.amount ?? '').trim();
  if (!amount) return '-';
  const currency = sanitizePdfText(product?.price?.currency ?? 'USD').trim() || 'USD';
  return `${currency} ${amount}`;
}

export function specValue(product, label) {
  const needle = String(label).toLowerCase();
  const match = (product?.specs ?? []).find((spec) => String(spec.label).toLowerCase().includes(needle));
  return match ? match.value : '-';
}

export function loadCompanyFacts(root = PROJECT_ROOT) {
  const facts = JSON.parse(readFileSync(path.join(root, 'src', 'config', 'facts.json'), 'utf8'));
  return {
    brandName: String(facts.brand?.name ?? 'Inflatable Pool Factory'),
    legalName: String(facts.brand?.legalName ?? ''),
    website: String(facts.brand?.url ?? 'https://inflatablepoolfactory.com').replace(/\/+$/, ''),
    email: String(facts.contact?.email ?? ''),
    phone: String(facts.contact?.primaryPhone ?? ''),
  };
}

export function loadProductSpecs(root = PROJECT_ROOT) {
  const productsDir = path.join(root, 'src', 'content', 'products');
  const products = readdirSync(productsDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const raw = readFileSync(path.join(productsDir, file), 'utf8');
      const { data } = matter(raw);
      const slug = file.replace(/\.mdx$/, '');
      const category = String(data.category ?? '').trim();
      const specs = Array.isArray(data.specs)
        ? data.specs
            .map((spec) => ({
              label: String(spec?.label ?? '').trim(),
              value: String(spec?.value ?? '').trim(),
            }))
            .filter((spec) => spec.label && spec.value)
        : [];
      const price = data.price?.amount
        ? {
            amount: String(data.price.amount).trim(),
            currency: String(data.price.currency ?? 'USD').trim(),
            note: String(data.price.note ?? '').trim(),
          }
        : null;

      return {
        slug,
        title: String(data.title ?? slug).trim(),
        sku: String(data.sku ?? '').trim(),
        summary: String(data.summary ?? data.description ?? '').trim(),
        category,
        categoryLabel: CATEGORY_LABELS[category] ?? 'Inflatable Swimming Pools',
        price,
        specs,
        publishDate:
          data.publishDate instanceof Date
            ? data.publishDate.toISOString().slice(0, 10)
            : String(data.publishDate ?? ''),
      };
    });

  return products.sort((a, b) => b.publishDate.localeCompare(a.publishDate) || a.slug.localeCompare(b.slug));
}

async function createDocument({ title, subject, keywords }) {
  const doc = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  doc.setTitle(sanitizePdfText(title));
  doc.setAuthor('Inflatable Pool Factory');
  doc.setSubject(sanitizePdfText(subject));
  doc.setKeywords(keywords.map((keyword) => sanitizePdfText(keyword)));
  doc.setCreator('Inflatable Pool Factory build pipeline');
  doc.setProducer('Inflatable Pool Factory');
  return { doc, fonts };
}

function drawBrandBand(page, fonts, { width, height, label, website, margin = PORTRAIT_MARGIN }) {
  const bandHeight = 68;
  page.drawRectangle({
    x: 0,
    y: height - bandHeight,
    width,
    height: bandHeight,
    color: COLORS.brandDark,
  });
  page.drawRectangle({
    x: 0,
    y: height - bandHeight - 3,
    width,
    height: 3,
    color: COLORS.brand,
  });
  page.drawText('INFLATABLE POOL FACTORY', {
    x: margin,
    y: height - 30,
    size: 11,
    font: fonts.bold,
    color: COLORS.white,
    characterSpacing: 1.1,
  });
  page.drawText('by Qingdao Vatrad Group', {
    x: margin,
    y: height - 45,
    size: 7.5,
    font: fonts.regular,
    color: rgb(0.8, 0.89, 0.94),
  });

  const labelWidth = fonts.bold.widthOfTextAtSize(label, 8);
  page.drawText(label, {
    x: width - margin - labelWidth,
    y: height - 30,
    size: 8,
    font: fonts.bold,
    color: COLORS.white,
    characterSpacing: 0.7,
  });
  const websiteWidth = fonts.regular.widthOfTextAtSize(website, 7.5);
  page.drawText(website, {
    x: width - margin - websiteWidth,
    y: height - 45,
    size: 7.5,
    font: fonts.regular,
    color: rgb(0.8, 0.89, 0.94),
  });
}

function drawTextLines(page, lines, { x, top, font, size, color, lineHeight }) {
  let baseline = top - size;
  for (const line of lines) {
    page.drawText(line, { x, y: baseline, size, font, color });
    baseline -= lineHeight;
  }
}

function drawCenteredLines(page, lines, { x, width, top, font, size, color, lineHeight }) {
  let baseline = top - size;
  for (const line of lines) {
    const lineWidth = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: x + (width - lineWidth) / 2,
      y: baseline,
      size,
      font,
      color,
    });
    baseline -= lineHeight;
  }
}

function stampFooters(doc, fonts, company) {
  const pages = doc.getPages();
  const footerLeft = [company.brandName, company.legalName, company.email, company.phone, company.website]
    .map((part) => sanitizePdfText(part))
    .filter(Boolean)
    .join('  |  ');

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const margin = width > height ? LANDSCAPE_MARGIN : PORTRAIT_MARGIN;
    page.drawLine({
      start: { x: margin, y: 30 },
      end: { x: width - margin, y: 30 },
      thickness: 0.5,
      color: COLORS.rule,
    });
    page.drawText(footerLeft, {
      x: margin,
      y: 18,
      size: 6.4,
      font: fonts.regular,
      color: COLORS.muted,
    });
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    const pageLabelWidth = fonts.regular.widthOfTextAtSize(pageLabel, 6.4);
    page.drawText(pageLabel, {
      x: width - margin - pageLabelWidth,
      y: 18,
      size: 6.4,
      font: fonts.regular,
      color: COLORS.muted,
    });
  });
}

export async function buildSpecSheetPdf(product, company) {
  const { doc, fonts } = await createDocument({
    title: `${product.title} - Specification Sheet`,
    subject: `Product specification sheet for ${product.title}${product.sku ? ` (${product.sku})` : ''}`,
    keywords: ['inflatable pool', 'product specification', product.sku || product.slug],
  });

  const pageWidth = A4[0];
  const contentWidth = pageWidth - PORTRAIT_MARGIN * 2;

  const newPage = () => {
    const page = doc.addPage(A4);
    const { width, height } = page.getSize();
    drawBrandBand(page, fonts, {
      width,
      height,
      label: 'PRODUCT SPECIFICATION SHEET',
      website: company.website,
    });
    return { page, width, height, y: height - 96 };
  };

  let state = newPage();

  let y = state.y;
  for (const line of wrapText(product.title, fonts.bold, 19, contentWidth)) {
    state.page.drawText(line, { x: PORTRAIT_MARGIN, y, size: 19, font: fonts.bold, color: COLORS.ink });
    y -= 23;
  }
  y += 6;

  const metaParts = [
    product.sku ? `SKU: ${product.sku}` : '',
    product.categoryLabel,
    product.price ? `Reference price: ${formatPrice(product)} FOB Qingdao` : '',
  ].filter(Boolean);
  const metaLines = wrapText(metaParts.join('   |   '), fonts.bold, 8.6, contentWidth);
  drawTextLines(state.page, metaLines, {
    x: PORTRAIT_MARGIN,
    top: y,
    font: fonts.bold,
    size: 8.6,
    color: COLORS.brandDark,
    lineHeight: 11,
  });
  y -= metaLines.length * 11 + 8;

  if (product.summary) {
    const summaryLines = wrapText(product.summary, fonts.regular, 9.5, contentWidth);
    drawTextLines(state.page, summaryLines, {
      x: PORTRAIT_MARGIN,
      top: y,
      font: fonts.regular,
      size: 9.5,
      color: COLORS.body,
      lineHeight: 13.5,
    });
    y -= summaryLines.length * 13.5 + 10;
  }

  if (product.price) {
    const noteLines = product.price.note ? wrapText(product.price.note, fonts.regular, 8, contentWidth - 28) : [];
    const boxHeight = 62 + Math.max(0, noteLines.length - 1) * 10.5;
    const boxBottom = y - boxHeight;
    state.page.drawRectangle({
      x: PORTRAIT_MARGIN,
      y: boxBottom,
      width: contentWidth,
      height: boxHeight,
      color: COLORS.brandLight,
      borderColor: COLORS.rule,
      borderWidth: 0.5,
    });
    state.page.drawRectangle({
      x: PORTRAIT_MARGIN,
      y: boxBottom,
      width: 4,
      height: boxHeight,
      color: COLORS.brand,
    });
    state.page.drawText('REFERENCE PRICE (FOB QINGDAO)', {
      x: PORTRAIT_MARGIN + 14,
      y: y - 16,
      size: 7,
      font: fonts.bold,
      color: COLORS.brandDark,
      characterSpacing: 0.6,
    });
    state.page.drawText(formatPrice(product), {
      x: PORTRAIT_MARGIN + 14,
      y: y - 36,
      size: 15,
      font: fonts.bold,
      color: COLORS.ink,
    });
    drawTextLines(state.page, noteLines, {
      x: PORTRAIT_MARGIN + 14,
      top: y - 42,
      font: fonts.regular,
      size: 8,
      color: COLORS.body,
      lineHeight: 10.5,
    });
    y = boxBottom - 16;
  }

  state.y = y;
  if (state.y - 46 < PORTRAIT_BOTTOM) {
    state = newPage();
  }
  state.page.drawText('Specifications', {
    x: PORTRAIT_MARGIN,
    y: state.y - 14,
    size: 12.5,
    font: fonts.bold,
    color: COLORS.ink,
  });
  state.y -= 30;

  const labelWidth = 154;
  const valueWidth = contentWidth - labelWidth;

  product.specs.forEach((spec, index) => {
    const labelLines = wrapText(spec.label, fonts.bold, 8.4, labelWidth - 20);
    const valueLines = wrapText(spec.value, fonts.regular, 8.8, valueWidth - 20);
    const rowHeight = Math.max(25, Math.max(labelLines.length * 11.4, valueLines.length * 11.4) + 12);

    if (state.y - rowHeight < PORTRAIT_BOTTOM) {
      state = newPage();
      state.page.drawText('Specifications (continued)', {
        x: PORTRAIT_MARGIN,
        y: state.y - 14,
        size: 11.5,
        font: fonts.bold,
        color: COLORS.ink,
      });
      state.y -= 28;
    }

    const rowTop = state.y;
    const rowBottom = rowTop - rowHeight;
    if (index % 2 === 0) {
      state.page.drawRectangle({
        x: PORTRAIT_MARGIN,
        y: rowBottom,
        width: contentWidth,
        height: rowHeight,
        color: COLORS.rowAlt,
      });
    }
    drawTextLines(state.page, labelLines, {
      x: PORTRAIT_MARGIN + 10,
      top: rowTop - 6,
      font: fonts.bold,
      size: 8.4,
      color: COLORS.ink,
      lineHeight: 11.4,
    });
    drawTextLines(state.page, valueLines, {
      x: PORTRAIT_MARGIN + labelWidth + 10,
      top: rowTop - 6,
      font: fonts.regular,
      size: 8.8,
      color: COLORS.body,
      lineHeight: 11.4,
    });
    state.page.drawLine({
      start: { x: PORTRAIT_MARGIN + labelWidth, y: rowBottom },
      end: { x: PORTRAIT_MARGIN + labelWidth, y: rowTop },
      thickness: 0.5,
      color: COLORS.rule,
    });
    state.page.drawLine({
      start: { x: PORTRAIT_MARGIN, y: rowBottom },
      end: { x: PORTRAIT_MARGIN + contentWidth, y: rowBottom },
      thickness: 0.5,
      color: COLORS.rule,
    });
    state.y = rowBottom;
  });

  state.y -= 18;

  const contactItems = [
    `${company.legalName} (${company.brandName})`,
    company.email ? `Email: ${company.email}` : '',
    company.phone ? `Phone / WhatsApp: ${company.phone}` : '',
    `Product page: ${company.website}/products/${product.slug}/`,
    `Request a quotation: ${company.website}/request-quotation/`,
  ].filter(Boolean);
  const contactLines = contactItems.flatMap((item) => wrapText(item, fonts.regular, 7.8, contentWidth - 28));
  const contactHeight = 38 + contactLines.length * 10.5;

  if (state.y - contactHeight < PORTRAIT_BOTTOM) {
    state = newPage();
  }
  const contactTop = state.y;
  const contactBottom = contactTop - contactHeight;
  state.page.drawRectangle({
    x: PORTRAIT_MARGIN,
    y: contactBottom,
    width: contentWidth,
    height: contactHeight,
    color: COLORS.brandLight,
    borderColor: COLORS.rule,
    borderWidth: 0.5,
  });
  state.page.drawText('Ordering & contact', {
    x: PORTRAIT_MARGIN + 14,
    y: contactTop - 16,
    size: 10.5,
    font: fonts.bold,
    color: COLORS.ink,
  });
  drawTextLines(state.page, contactLines, {
    x: PORTRAIT_MARGIN + 14,
    top: contactTop - 26,
    font: fonts.regular,
    size: 7.8,
    color: COLORS.body,
    lineHeight: 10.5,
  });
  state.y = contactBottom - 14;

  const disclaimerLines = wrapText(DISCLAIMER, fonts.regular, 7.1, contentWidth);
  const disclaimerHeight = disclaimerLines.length * 9 + 8;
  if (state.y - disclaimerHeight < PORTRAIT_BOTTOM) {
    state = newPage();
  }
  state.page.drawLine({
    start: { x: PORTRAIT_MARGIN, y: state.y - 2 },
    end: { x: PORTRAIT_MARGIN + contentWidth, y: state.y - 2 },
    thickness: 0.5,
    color: COLORS.rule,
  });
  drawTextLines(state.page, disclaimerLines, {
    x: PORTRAIT_MARGIN,
    top: state.y - 6,
    font: fonts.regular,
    size: 7.1,
    color: COLORS.muted,
    lineHeight: 9,
  });

  stampFooters(doc, fonts, company);
  return doc.save();
}

export async function buildComparisonPdf(products, company) {
  const { doc, fonts } = await createDocument({
    title: 'Inflatable Pool Product Comparison Chart',
    subject: `Side-by-side comparison of ${products.length} inflatable pool products`,
    keywords: ['inflatable pool', 'product comparison', 'drop stitch pool', 'specification chart'],
  });

  const pageWidth = A4_LANDSCAPE[0];
  const pageHeight = A4_LANDSCAPE[1];
  const contentWidth = pageWidth - LANDSCAPE_MARGIN * 2;
  const labelWidth = 96;
  const columnWidth = (contentWidth - labelWidth) / products.length;

  const newPage = (continued) => {
    const page = doc.addPage(A4_LANDSCAPE);
    drawBrandBand(page, fonts, {
      width: pageWidth,
      height: pageHeight,
      label: 'PRODUCT COMPARISON CHART',
      website: company.website,
      margin: LANDSCAPE_MARGIN,
    });

    let y;
    if (!continued) {
      page.drawText('Product Comparison Chart', {
        x: LANDSCAPE_MARGIN,
        y: pageHeight - 98,
        size: 18,
        font: fonts.bold,
        color: COLORS.ink,
      });
      page.drawText(sanitizePdfText(`Inflatable pool models compared side by side: ${products.length} products.`), {
        x: LANDSCAPE_MARGIN,
        y: pageHeight - 115,
        size: 8.6,
        font: fonts.regular,
        color: COLORS.body,
      });
      const disclaimerLines = wrapText(DISCLAIMER, fonts.regular, 6.9, contentWidth);
      drawTextLines(page, disclaimerLines, {
        x: LANDSCAPE_MARGIN,
        top: pageHeight - 126,
        font: fonts.regular,
        size: 6.9,
        color: COLORS.muted,
        lineHeight: 8.6,
      });
      y = pageHeight - 126 - disclaimerLines.length * 8.6 - 14;
    } else {
      page.drawText('Product Comparison Chart (continued)', {
        x: LANDSCAPE_MARGIN,
        y: pageHeight - 96,
        size: 14,
        font: fonts.bold,
        color: COLORS.ink,
      });
      y = pageHeight - 112;
    }

    return { page, y };
  };

  const drawTableHeader = (state) => {
    const titleLines = products.map((product) => wrapText(product.title, fonts.bold, 7.1, columnWidth - 12));
    const maxTitleLines = Math.max(...titleLines.map((lines) => lines.length));
    const hasSku = products.some((product) => product.sku);
    const headerHeight = Math.max(44, 8 + maxTitleLines * 8.8 + (hasSku ? 9 : 0) + 8);
    const top = state.y;
    const bottom = top - headerHeight;

    state.page.drawRectangle({
      x: LANDSCAPE_MARGIN,
      y: bottom,
      width: contentWidth,
      height: headerHeight,
      color: COLORS.brandDark,
    });
    state.page.drawText('Specification', {
      x: LANDSCAPE_MARGIN + 8,
      y: bottom + headerHeight / 2 - 2.5,
      size: 7.5,
      font: fonts.bold,
      color: COLORS.white,
    });

    products.forEach((product, index) => {
      const x = LANDSCAPE_MARGIN + labelWidth + index * columnWidth;
      drawCenteredLines(state.page, titleLines[index], {
        x,
        width: columnWidth,
        top: top - 8,
        font: fonts.bold,
        size: 7.1,
        color: COLORS.white,
        lineHeight: 8.8,
      });
      if (product.sku) {
        const skuBaseline = top - 8 - titleLines[index].length * 8.8 - 6;
        const skuWidth = fonts.regular.widthOfTextAtSize(sanitizePdfText(product.sku), 6.2);
        state.page.drawText(sanitizePdfText(product.sku), {
          x: x + (columnWidth - skuWidth) / 2,
          y: skuBaseline,
          size: 6.2,
          font: fonts.regular,
          color: rgb(0.8, 0.89, 0.94),
        });
      }
    });

    state.y = bottom;
  };

  let state = newPage(false);
  drawTableHeader(state);

  COMPARISON_ROWS.forEach((row, rowIndex) => {
    const labelLines = wrapText(row.label, fonts.bold, 7.3, labelWidth - 14);
    const cellLines = products.map((product) =>
      wrapText(row.spec ? specValue(product, row.spec) : row.getValue(product), fonts.regular, 7.1, columnWidth - 12)
    );
    const maxLines = Math.max(labelLines.length, ...cellLines.map((lines) => lines.length));
    const rowHeight = Math.max(21, maxLines * 8.8 + 10);

    if (state.y - rowHeight < LANDSCAPE_BOTTOM) {
      state = newPage(true);
      drawTableHeader(state);
    }

    const top = state.y;
    const bottom = top - rowHeight;
    state.page.drawRectangle({
      x: LANDSCAPE_MARGIN,
      y: bottom,
      width: labelWidth,
      height: rowHeight,
      color: COLORS.labelBg,
    });
    if (rowIndex % 2 === 1) {
      state.page.drawRectangle({
        x: LANDSCAPE_MARGIN + labelWidth,
        y: bottom,
        width: contentWidth - labelWidth,
        height: rowHeight,
        color: COLORS.rowAlt,
      });
    }

    drawTextLines(state.page, labelLines, {
      x: LANDSCAPE_MARGIN + 8,
      top: top - 5,
      font: fonts.bold,
      size: 7.3,
      color: COLORS.ink,
      lineHeight: 8.8,
    });

    products.forEach((product, index) => {
      const x = LANDSCAPE_MARGIN + labelWidth + index * columnWidth;
      drawCenteredLines(state.page, cellLines[index], {
        x,
        width: columnWidth,
        top: top - 5,
        font: fonts.regular,
        size: 7.1,
        color: COLORS.body,
        lineHeight: 8.8,
      });
      state.page.drawLine({
        start: { x, y: bottom },
        end: { x, y: top },
        thickness: 0.5,
        color: COLORS.rule,
      });
    });

    state.page.drawLine({
      start: { x: LANDSCAPE_MARGIN, y: bottom },
      end: { x: LANDSCAPE_MARGIN + contentWidth, y: bottom },
      thickness: 0.5,
      color: COLORS.rule,
    });
    state.y = bottom;
  });

  const selectionNotes = [
    'Round swimming pools: Diameter 2.0 - 10.0 m, 23 factory sizes, 10-15 cm walls, blue or grey.',
    'Rectangular swimming pool: 2 x 2 x 0.8 m to 6 x 5 x 1.5 m, 15 factory sizes, 15 / 20 / 50 cm walls.',
    'Hot tubs: built-in seats and a 5 mm insulated thermal bottom; round 1.8 / 2.0 / 2.3 m, square/rectangular 1.5 x 1.5 x 0.8 m to 3 x 2 x 1 m.',
    'The square/rectangular hot tub connects to an external heater (not included); recommended pressure is 4-5 PSI for all listed models.',
  ];
  const noteLines = selectionNotes.flatMap((note) => wrapText(note, fonts.regular, 6.9, contentWidth - 10));
  const notesHeight = 22 + noteLines.length * 8.6;
  if (state.y - notesHeight < LANDSCAPE_BOTTOM) {
    state = newPage(true);
  }
  state.y -= 8;
  state.page.drawText('Selection notes', {
    x: LANDSCAPE_MARGIN,
    y: state.y - 12,
    size: 9.5,
    font: fonts.bold,
    color: COLORS.ink,
  });
  drawTextLines(state.page, noteLines, {
    x: LANDSCAPE_MARGIN,
    top: state.y - 18,
    font: fonts.regular,
    size: 6.9,
    color: COLORS.body,
    lineHeight: 8.6,
  });
  state.y -= notesHeight;

  stampFooters(doc, fonts, company);
  return doc.save();
}

export async function generateProductPdfs({ root = PROJECT_ROOT, outDir }) {
  if (!outDir) throw new Error('generateProductPdfs requires an outDir');
  const products = loadProductSpecs(root);
  if (products.length === 0) throw new Error('No product MDX files found');
  const company = loadCompanyFacts(root);

  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(outDir, { recursive: true });

  const files = [];
  for (const product of products) {
    const bytes = await buildSpecSheetPdf(product, company);
    const filename = `${product.slug}.pdf`;
    writeFileSync(path.join(outDir, filename), bytes);
    files.push({ filename, kind: 'spec-sheet', slug: product.slug, bytes: bytes.length });
  }

  const comparisonBytes = await buildComparisonPdf(products, company);
  writeFileSync(path.join(outDir, COMPARISON_PDF_FILENAME), comparisonBytes);
  files.push({
    filename: COMPARISON_PDF_FILENAME,
    kind: 'comparison',
    slug: '',
    bytes: comparisonBytes.length,
  });

  return { outDir, products, files };
}
