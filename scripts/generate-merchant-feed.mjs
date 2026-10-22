/**
 * Google Merchant Center product feed generator.
 *
 * Emits dist/merchant-feed.xml — an RSS 2.0 feed with the Google Products
 * namespace (g:), one <item> per purchasable SKU.
 *
 * Eligibility gate (per 如何用GoogleMerchantCenter对接商品数据.txt):
 *   ONLY products with a live Stripe checkout entry land in the feed.
 *   The eligibility list is the PRODUCT_CATALOG in functions/api/checkout.ts —
 *   the single place that defines what the site can actually sell online.
 *   OEM / wholesale / inquiry-only pages (hot-tub SPA pages publish FOB
 *   wholesale prices, no sku, no checkout) are excluded by design.
 *
 * Same-source consistency gate (同源, hard CI failure):
 *   MDX frontmatter price × 100 must equal the checkout unitAmount, the
 *   currency must match, the product image must exist in public/, and
 *   inStock must be true (out-of-stock items are emitted as out_of_stock
 *   only when the frontmatter says so).
 *
 * GMC registration (manual, one-time):
 *   Merchant Center → Products → Add product source → From file →
 *   https://inflatablepoolfactory.com/merchant-feed.xml → configure fetch schedule
 *   (default 24 h) → trigger a manual fetch → review item issues.
 *   Account-level shipping & return settings must be configured BEFORE
 *   the first fetch; shipping_label "pool_standard" groups pool items.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BASE = 'https://inflatablepoolfactory.com';

/** Parse PRODUCT_CATALOG from functions/api/checkout.ts (single eligibility source). */
function parseCheckoutCatalog() {
  const src = readFileSync(path.join(ROOT, 'functions/api/checkout.ts'), 'utf8');
  const block = src.slice(src.indexOf('PRODUCT_CATALOG'), src.indexOf('};', src.indexOf('PRODUCT_CATALOG')));
  const entries = {};
  const re =
    /'(IPF-[A-Z0-9-]+)':\s*\{[\s\S]*?name:\s*'([^']+)'[\s\S]*?slug:\s*'([^']+)'[\s\S]*?unitAmount:\s*(\d+)[\s\S]*?currency:\s*'([^']+)'[\s\S]*?image:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(block))) {
    entries[m[1]] = { name: m[2], slug: m[3], unitAmount: Number(m[4]), currency: m[5], image: m[6] };
  }
  if (Object.keys(entries).length === 0) {
    throw new Error('Failed to parse PRODUCT_CATALOG from functions/api/checkout.ts');
  }
  return entries;
}

/** Read selected frontmatter fields from a product MDX file. */
function readMdxFrontmatter(slug) {
  const file = path.join(ROOT, 'src/content/products', `${slug}.mdx`);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, 'utf8');
  const fm = raw.slice(raw.indexOf('---') + 3, raw.indexOf('---', 3));
  const pick = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : undefined;
  };
  const priceBlock = fm.match(/^price:\n([\s\S]*?^\S)/m);
  let amount;
  let currency;
  let note;
  if (priceBlock) {
    amount = (priceBlock[1].match(/amount:\s*'?([^'\n]+)'?/) || [])[1];
    currency = (priceBlock[1].match(/currency:\s*([^ \n]+)/) || [])[1];
    note = (priceBlock[1].match(/note:\s*(.+)/) || [])[1];
  }
  const inStock = pick('inStock');
  return {
    title: pick('title'),
    description: pick('description'),
    summary: pick('summary'),
    image: pick('image'),
    amount,
    currency,
    note: note ? note.trim() : undefined,
    inStock: inStock === undefined ? true : inStock === 'true',
  };
}

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const catalog = parseCheckoutCatalog();
const errors = [];
const warnings = [];
const items = [];

for (const [sku, entry] of Object.entries(catalog)) {
  const mdx = readMdxFrontmatter(entry.slug);
  if (!mdx) {
    errors.push(`${sku}: no MDX at src/content/products/${entry.slug}.mdx`);
    continue;
  }
  if (!mdx.amount || Number(mdx.amount) * 100 !== entry.unitAmount) {
    errors.push(
      `${sku}: price mismatch — MDX frontmatter $${mdx.amount ?? 'none'} vs checkout unitAmount ${entry.unitAmount} (expected MDX×100)`
    );
  }
  if ((mdx.currency || 'USD').toLowerCase() !== entry.currency.toLowerCase()) {
    errors.push(`${sku}: currency mismatch — MDX ${mdx.currency} vs checkout ${entry.currency}`);
  }
  if (!mdx.title) errors.push(`${sku}: MDX title missing`);
  if (!mdx.description && !mdx.summary) errors.push(`${sku}: MDX description/summary missing`);
  const image = mdx.image || entry.image;
  if (!image) {
    errors.push(`${sku}: no image`);
  } else if (!existsSync(path.join(ROOT, 'public', image))) {
    errors.push(`${sku}: image not found in public${image}`);
  }
  if (mdx.title && mdx.title !== entry.name) {
    warnings.push(`${sku}: MDX title "${mdx.title}" differs from checkout name "${entry.name}" (feed uses MDX title)`);
  }

  const price = (entry.unitAmount / 100).toFixed(2);
  const link = `${BASE}/products/${entry.slug}/`;
  const description = mdx.description || mdx.summary || '';
  items.push({
    sku,
    title: mdx.title || entry.name,
    description,
    link,
    image: `${BASE}${image}`,
    price,
    currency: (mdx.currency || 'USD').toUpperCase(),
    inStock: mdx.inStock,
  });
}

if (errors.length > 0) {
  console.error('[merchant-feed] CONSISTENCY GATE FAILED:');
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
for (const w of warnings) console.warn('[merchant-feed] ⚠ ' + w);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Inflatable Pool Factory Products</title>
    <link>${BASE}/</link>
    <description>Inflatable Pool Factory retail product feed — purchasable SKUs only (Stripe checkout enabled).</description>
${items
  .map(
    (i) => `    <item>
      <g:id>${xmlEscape(i.sku)}</g:id>
      <g:title>${xmlEscape(i.title)}</g:title>
      <g:description>${xmlEscape(i.description)}</g:description>
      <g:link>${xmlEscape(i.link)}</g:link>
      <g:image_link>${xmlEscape(i.image)}</g:image_link>
      <g:availability>${i.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${xmlEscape(i.price)} ${xmlEscape(i.currency)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>Inflatable Pool Factory</g:brand>
      <g:shipping_label>pool_standard</g:shipping_label>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;

mkdirSync(DIST, { recursive: true });
writeFileSync(path.join(DIST, 'merchant-feed.xml'), xml, 'utf8');
console.log(
  `[merchant-feed] wrote dist/merchant-feed.xml — ${items.length} item(s): ${items.map((i) => i.sku).join(', ')}`
);
