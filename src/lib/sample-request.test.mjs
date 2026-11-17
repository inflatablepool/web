import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_BRIEF_MAX_FIELD_LENGTH,
  SAMPLE_BRIEF_MAX_LENGTH,
  SAMPLE_DEFAULT_QUANTITY,
  SAMPLE_PRODUCTS,
  SAMPLE_TERMS_NOTE,
  buildSampleBrief,
  buildSampleRequestUrl,
  getSampleProduct,
} from './sample-request.ts';

const RFQ_PRODUCT_TYPES = [
  'Rectangular Drop-Stitch Pool',
  'Round Pool (Blue)',
  'Round Pool (Grey)',
  'SPA / Hot Tub',
  'Custom OEM / ODM',
  'Not Sure Yet',
];

const PRODUCT_SLUGS = [
  'rectangular-drop-stitch-pool',
  'round-blue-drop-stitch-pool',
  'round-grey-drop-stitch-pool',
  'hot-tub-round',
  'hot-tub-square-rect',
];

function paramsOf(url) {
  return new URL(url, 'https://inflatablepoolfactory.com').searchParams;
}

test('sample platforms cover the five standard product pages', () => {
  assert.deepEqual(
    SAMPLE_PRODUCTS.map((product) => product.slug),
    PRODUCT_SLUGS
  );
});

test('every sample platform maps to a valid RFQ product type', () => {
  for (const product of SAMPLE_PRODUCTS) {
    assert.ok(
      RFQ_PRODUCT_TYPES.includes(product.rfqProductType),
      `${product.slug} maps to unknown RFQ product type ${product.rfqProductType}`
    );
  }
});

test('sample platforms keep product page slugs and links aligned', () => {
  for (const product of SAMPLE_PRODUCTS) {
    assert.equal(product.productHref, `/products/${product.slug}`);
    assert.ok(product.name.length > 0);
    assert.ok(product.sizeRange.length > 0);
    assert.ok(product.wallThickness.length > 0);
    assert.ok(product.image.startsWith('/images/pools/'));
  }
});

test('lookup only returns known sample platforms', () => {
  assert.equal(getSampleProduct('hot-tub-round')?.name, 'Round Inflatable Hot Tub SPA Pool');
  assert.equal(getSampleProduct('unknown-product'), undefined);
  assert.equal(getSampleProduct(''), undefined);
  assert.equal(getSampleProduct(undefined), undefined);
});

test('brief starts with a sample request and always states quotation-confirmed terms', () => {
  const brief = buildSampleBrief({});
  assert.equal(brief, `Sample request\n${SAMPLE_TERMS_NOTE}`);
});

test('brief includes only the buyer values that were provided', () => {
  const brief = buildSampleBrief({
    productSlug: 'rectangular-drop-stitch-pool',
    quantity: '1 sample',
    intendedUse: 'Retail range evaluation',
    targetMarket: 'Germany',
    targetSize: '4 x 2 x 1.2 m',
    requirements: 'Include a fitted cover and carton artwork.',
  });

  assert.match(brief, /^Sample request\n/);
  assert.match(brief, /Product: Rectangular Inflatable Drop Stitch Swimming Pool\n/);
  assert.match(brief, /Sample quantity: 1 sample\n/);
  assert.match(brief, /Intended use: Retail range evaluation\n/);
  assert.match(brief, /Target market: Germany\n/);
  assert.match(brief, /Size or model: 4 x 2 x 1.2 m\n/);
  assert.match(brief, /Additional requirements: Include a fitted cover and carton artwork\.\n/);
  assert.ok(brief.endsWith(SAMPLE_TERMS_NOTE));
  assert.doesNotMatch(brief, /undefined|null|NaN/);
});

test('brief collapses whitespace and ignores unknown product slugs', () => {
  const brief = buildSampleBrief({
    productSlug: 'not-a-product',
    targetMarket: '  United   States  ',
    requirements: 'Line one\nLine two',
  });

  assert.doesNotMatch(brief, /Product:/);
  assert.match(brief, /Target market: United States\n/);
  assert.match(brief, /Additional requirements: Line one Line two\n/);
});

test('brief truncates long fields and keeps the terms note intact', () => {
  const brief = buildSampleBrief({
    productSlug: 'round-blue-drop-stitch-pool',
    quantity: 'x'.repeat(5000),
    intendedUse: 'x'.repeat(5000),
    targetMarket: 'x'.repeat(5000),
    targetSize: 'x'.repeat(5000),
    requirements: 'x'.repeat(5000),
  });

  assert.ok(brief.length <= SAMPLE_BRIEF_MAX_LENGTH);
  assert.ok(brief.endsWith(SAMPLE_TERMS_NOTE));
  assert.match(brief, /Sample quantity: x{100,}/);
  assert.match(brief, /x{3}\.\.\.\nSample terms: quantity/);
});

test('field values are capped before the brief is assembled', () => {
  const prefix = 'Target market: ';
  const brief = buildSampleBrief({ targetMarket: 'y'.repeat(SAMPLE_BRIEF_MAX_FIELD_LENGTH + 100) });
  const marketLine = brief.split('\n').find((line) => line.startsWith(prefix));

  assert.ok(marketLine);
  assert.ok(marketLine.length <= prefix.length + SAMPLE_BRIEF_MAX_FIELD_LENGTH);
});

test('URL maps the product slug to the exact RFQ select value', () => {
  const url = buildSampleRequestUrl({ productSlug: 'round-grey-drop-stitch-pool' });
  const params = paramsOf(url);

  assert.equal(params.get('product'), 'Round Pool (Grey)');
  assert.equal(params.get('quantity'), SAMPLE_DEFAULT_QUANTITY);
  assert.match(params.get('brief') ?? '', /Product: Round Grey Inflatable Drop Stitch Swimming Pool/);
});

test('URL maps both SPA product pages to the shared SPA / Hot Tub option', () => {
  for (const slug of ['hot-tub-round', 'hot-tub-square-rect']) {
    assert.equal(paramsOf(buildSampleRequestUrl({ productSlug: slug })).get('product'), 'SPA / Hot Tub');
  }
});

test('generic URL omits the product select value but keeps the sample context', () => {
  const params = paramsOf(buildSampleRequestUrl());

  assert.equal(params.get('product'), null);
  assert.equal(params.get('quantity'), SAMPLE_DEFAULT_QUANTITY);
  assert.ok((params.get('brief') ?? '').startsWith('Sample request'));
});

test('URL uses a provided quantity and omits empty optional fields', () => {
  const params = paramsOf(
    buildSampleRequestUrl({
      productSlug: 'rectangular-drop-stitch-pool',
      quantity: '2 samples',
      intendedUse: 'Client approval',
      targetMarket: '',
      targetSize: '   ',
    })
  );

  assert.equal(params.get('quantity'), '2 samples');
  const brief = params.get('brief') ?? '';
  assert.match(brief, /Intended use: Client approval/);
  assert.doesNotMatch(brief, /Target market:/);
  assert.doesNotMatch(brief, /Size or model:/);
});

test('URL round-trips special characters without changing the brief text', () => {
  const input = {
    productSlug: 'hot-tub-square-rect',
    intendedUse: 'Distributor & retail review',
    targetMarket: 'Côte d’Ivoire',
    requirements: 'Quote 100% matching cover; carton says "SPA" & <fragile>.',
  };
  const params = paramsOf(buildSampleRequestUrl(input, '/request-quotation/'));

  assert.equal(params.get('brief'), buildSampleBrief({ ...input, quantity: SAMPLE_DEFAULT_QUANTITY }));
  assert.equal(params.get('quantity'), SAMPLE_DEFAULT_QUANTITY);
});

test('custom base paths are preserved', () => {
  const url = buildSampleRequestUrl({ productSlug: 'hot-tub-round' }, '/custom/base');
  assert.ok(url.startsWith('/custom/base?'));
});
