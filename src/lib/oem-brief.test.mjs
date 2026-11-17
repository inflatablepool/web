import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OEM_BRIEF_MAX_FIELD_LENGTH,
  OEM_BRIEF_MAX_LENGTH,
  OEM_CUSTOMIZATION_LEVELS,
  OEM_PRODUCT_TYPES,
  OEM_PROJECT_PATHS,
  buildOemBrief,
  buildRfqPrefillUrl,
} from './oem-brief.ts';

const completeBrief = {
  projectPath: 'ODM',
  productType: 'Rectangular Drop-Stitch Pool',
  targetSize: '4.0 x 2.0 x 0.75 m',
  quantity: '300 pcs',
  customizationLevel: 'Custom Sizes, Colors or Packaging',
  targetMarket: 'Germany',
  targetDelivery: 'Q2 2027',
  requirements: 'Include a matching cover and carry bag.',
};

test('option values stay aligned with the RFQ form', () => {
  assert.deepEqual(OEM_PROJECT_PATHS, ['OEM', 'ODM', 'Not sure yet']);
  assert.deepEqual(OEM_PRODUCT_TYPES, [
    'Rectangular Drop-Stitch Pool',
    'Round Pool (Blue)',
    'Round Pool (Grey)',
    'SPA / Hot Tub',
    'Custom OEM / ODM',
    'Not Sure Yet',
  ]);
  assert.deepEqual(OEM_CUSTOMIZATION_LEVELS, [
    'Standard Product',
    'Logo / Branding Only',
    'Custom Sizes, Colors or Packaging',
    'ODM / Product Development',
    'Not Sure Yet',
  ]);
});

test('builds a complete labelled brief in a stable order', () => {
  assert.equal(
    buildOemBrief(completeBrief),
    [
      'Project path: ODM',
      'Product type: Rectangular Drop-Stitch Pool',
      'Target size: 4.0 x 2.0 x 0.75 m',
      'Estimated quantity: 300 pcs',
      'Customization level: Custom Sizes, Colors or Packaging',
      'Target market: Germany',
      'Target delivery: Q2 2027',
      'Additional requirements: Include a matching cover and carry bag.',
    ].join('\n')
  );
});

test('omits empty fields instead of printing undefined or blank labels', () => {
  const brief = buildOemBrief({
    productType: '  SPA / Hot Tub  ',
    quantity: 'TBD',
    requirements: '   ',
  });

  assert.equal(brief, ['Product type: SPA / Hot Tub', 'Estimated quantity: TBD'].join('\n'));
  assert.doesNotMatch(brief, /undefined|null|: $/m);
});

test('returns an empty brief when no project detail was entered', () => {
  assert.equal(buildOemBrief({}), '');
  assert.equal(
    buildOemBrief({
      projectPath: '   ',
      productType: '',
      requirements: '\n\t',
    }),
    ''
  );
});

test('collapses whitespace so the generated brief stays readable', () => {
  const brief = buildOemBrief({
    productType: 'Round   Pool\n(Blue)',
    requirements: 'First line\n\nSecond   line\twith tabs',
  });

  assert.equal(
    brief,
    ['Product type: Round Pool (Blue)', 'Additional requirements: First line Second line with tabs'].join('\n')
  );
});

test('maps brief fields to the existing RFQ query parameters', () => {
  const url = buildRfqPrefillUrl(completeBrief);
  const parsed = new URL(url, 'https://inflatablepoolfactory.com');

  assert.equal(parsed.pathname, '/request-quotation');
  assert.equal(parsed.searchParams.get('product'), completeBrief.productType);
  assert.equal(parsed.searchParams.get('quantity'), completeBrief.quantity);
  assert.equal(parsed.searchParams.get('customization'), completeBrief.customizationLevel);
  assert.equal(parsed.searchParams.get('country'), completeBrief.targetMarket);
  assert.equal(parsed.searchParams.get('delivery'), completeBrief.targetDelivery);
  assert.equal(parsed.searchParams.get('brief'), buildOemBrief(completeBrief));
  assert.equal(parsed.searchParams.has('projectPath'), false);
  assert.doesNotMatch(url, /undefined/);
});

test('omits empty query parameters and falls back to the RFQ page', () => {
  assert.equal(buildRfqPrefillUrl({}), '/request-quotation');
  assert.equal(buildRfqPrefillUrl({ quantity: '  ' }), '/request-quotation');

  const url = buildRfqPrefillUrl({ quantity: '150 pcs', targetMarket: 'United Arab Emirates' });
  const parsed = new URL(url, 'https://inflatablepoolfactory.com');

  assert.equal(parsed.searchParams.get('quantity'), '150 pcs');
  assert.equal(parsed.searchParams.get('country'), 'United Arab Emirates');
  assert.equal(parsed.searchParams.has('product'), false);
  assert.equal(parsed.searchParams.has('customization'), false);
  assert.equal(parsed.searchParams.has('delivery'), false);
  assert.equal(
    parsed.searchParams.get('brief'),
    ['Estimated quantity: 150 pcs', 'Target market: United Arab Emirates'].join('\n')
  );
});

test('caps field and total brief length', () => {
  const longValue = 'A'.repeat(OEM_BRIEF_MAX_FIELD_LENGTH + 200);
  const brief = buildOemBrief({
    projectPath: 'OEM',
    productType: 'Custom OEM / ODM',
    targetSize: longValue,
    quantity: longValue,
    customizationLevel: 'ODM / Product Development',
    targetMarket: longValue,
    targetDelivery: longValue,
    requirements: longValue,
  });

  assert.ok(brief.length <= OEM_BRIEF_MAX_LENGTH);
  assert.ok(brief.endsWith('...'));
  assert.doesNotMatch(brief, new RegExp(`A{${OEM_BRIEF_MAX_FIELD_LENGTH + 1}}`));
});

test('accepts a custom base path for local previews', () => {
  const url = buildRfqPrefillUrl({ quantity: '1' }, '/en/request-quotation');
  assert.equal(url, '/en/request-quotation?quantity=1&brief=Estimated+quantity%3A+1');
});
