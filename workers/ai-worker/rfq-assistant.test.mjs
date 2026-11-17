import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectBuyerType,
  detectCountry,
  detectCustomizationLevel,
  detectProductType,
  detectQuantity,
  detectTargetDelivery,
  extractRfqFieldsRules,
  extractRfqRequirements,
  mergeAiFields,
  parseAiFields,
  redactContactDetails,
  sanitizeRfqMessage,
} from './rfq-assistant.ts';

test('rich brief extracts every core RFQ field without inventing data', () => {
  const text =
    'We are a distributor in Germany planning a private-label program. We need 800 pcs of rectangular drop-stitch pools with custom colours and packaging for Q2 2027. Please include a cover.';
  const { fields, missing } = extractRfqFieldsRules(text);
  assert.equal(fields.buyerType, 'Importer / Distributor');
  assert.equal(fields.productType, 'Rectangular Drop-Stitch Pool');
  assert.equal(fields.quantity, '800 pcs');
  assert.equal(fields.customizationLevel, 'Custom Sizes, Colors or Packaging');
  assert.equal(fields.country, 'Germany');
  assert.equal(fields.targetDelivery, 'Q2 2027');
  assert.match(fields.message, /private-label program/);
  assert.deepEqual(missing, []);
});

test('a vague brief leaves unknown fields empty instead of guessing', () => {
  const { fields, missing, summary } = extractRfqFieldsRules('We need some pools.');
  assert.equal(fields.buyerType, '');
  assert.equal(fields.productType, '');
  assert.equal(fields.quantity, '');
  assert.equal(fields.customizationLevel, '');
  assert.equal(fields.country, '');
  assert.equal(fields.targetDelivery, '');
  assert.deepEqual(missing, ['buyer type', 'product type', 'estimated quantity', 'customization level', 'target market']);
  assert.match(summary, /No structured fields detected yet/);
});

test('sample and hotel briefs are classified without adding specifications', () => {
  const { fields, missing } = extractRfqFieldsRules(
    'We would like a sample order of your round grey pool for a hotel in the UAE.'
  );
  assert.equal(fields.buyerType, 'Hotel / Resort / Hospitality');
  assert.equal(fields.productType, 'Round Pool (Grey)');
  assert.equal(fields.quantity, 'Sample order');
  assert.equal(fields.country, 'United Arab Emirates');
  assert.deepEqual(missing, ['customization level']);
  assert.doesNotMatch(JSON.stringify(fields), /ISO|CE|mm|PSI|pcs\/month/i);
});

test('OEM, container quantity, country and delivery are extracted', () => {
  const { fields, missing } = extractRfqFieldsRules(
    'OEM project, custom size and logo, 1 x 40ft container to Spain, ASAP'
  );
  assert.equal(fields.buyerType, '');
  assert.equal(fields.productType, 'Custom OEM / ODM');
  assert.equal(fields.quantity, '1 x 40ft container');
  assert.equal(fields.customizationLevel, 'Custom Sizes, Colors or Packaging');
  assert.equal(fields.country, 'Spain');
  assert.equal(fields.targetDelivery, 'ASAP');
  assert.deepEqual(missing, ['buyer type']);
});

test('contact details are redacted before any AI call', () => {
  const input =
    'We are a hotel in Dubai. Email sales@example.com or WhatsApp +86 133 0532 4192. Need 200 pcs round pools.';
  const { text, redacted } = redactContactDetails(input);
  assert.equal(redacted, true);
  assert.doesNotMatch(text, /sales@example\.com/);
  assert.doesNotMatch(text, /133 0532 4192/);
  assert.match(text, /200 pcs round pools/);

  const { fields } = extractRfqFieldsRules(text);
  assert.equal(fields.buyerType, 'Hotel / Resort / Hospitality');
  assert.equal(fields.productType, 'Round Pool (Blue)');
  assert.equal(fields.quantity, '200 pcs');
  assert.equal(fields.country, 'United Arab Emirates');
  assert.doesNotMatch(fields.message, /sales@example\.com|133 0532 4192/);
});

test('quantities, ranges, MOQs and samples are recognized', () => {
  assert.equal(detectQuantity('800 pcs'), '800 pcs');
  assert.equal(detectQuantity('200-300 pieces'), '200-300 pieces');
  assert.equal(detectQuantity('1 x 40ft container'), '1 x 40ft container');
  assert.equal(detectQuantity('MOQ of 500'), '500 (MOQ)');
  assert.equal(detectQuantity('a sample order'), 'Sample order');
  assert.equal(detectQuantity('trial order'), 'Trial order');
  assert.equal(detectQuantity('we need pools'), '');
});

test('target delivery only returns stated timeframes', () => {
  assert.equal(detectTargetDelivery('for Q2 2027'), 'Q2 2027');
  assert.equal(detectTargetDelivery('delivery March 2027'), 'March 2027');
  assert.equal(detectTargetDelivery('within 6 weeks'), 'Within 6 weeks');
  assert.equal(detectTargetDelivery('as soon as possible'), 'ASAP');
  assert.equal(detectTargetDelivery('by 2027'), '2027');
  assert.equal(detectTargetDelivery('as soon as you can'), '');
});

test('buyer, product and customization detectors map to form options', () => {
  assert.equal(detectBuyerType('we are a distributor with a private-label program'), 'Importer / Distributor');
  assert.equal(detectBuyerType('our own brand for Amazon'), 'Brand Owner / Private Label');
  assert.equal(detectBuyerType('a hotel and resort group'), 'Hotel / Resort / Hospitality');
  assert.equal(detectBuyerType('a commercial project for a school'), 'Commercial Project');
  assert.equal(detectBuyerType('no idea yet'), '');

  assert.equal(detectProductType('round blue pool'), 'Round Pool (Blue)');
  assert.equal(detectProductType('rectangular pool'), 'Rectangular Drop-Stitch Pool');
  assert.equal(detectProductType('spa / hot tub'), 'SPA / Hot Tub');
  assert.equal(detectProductType('not sure yet'), 'Not Sure Yet');

  assert.equal(detectCustomizationLevel('logo only'), 'Logo / Branding Only');
  assert.equal(detectCustomizationLevel('custom sizes and packaging'), 'Custom Sizes, Colors or Packaging');
  assert.equal(detectCustomizationLevel('ODM product development'), 'ODM / Product Development');
  assert.equal(detectCustomizationLevel('standard stock pool'), 'Standard Product');
  assert.equal(detectCustomizationLevel('unsure'), 'Not Sure Yet');
});

test('country aliases resolve to one canonical market', () => {
  assert.equal(detectCountry('shipping to the UAE'), 'United Arab Emirates');
  assert.equal(detectCountry('market: USA'), 'United States');
  assert.equal(detectCountry('for Germany and France'), 'Germany');
  assert.equal(detectCountry('no destination stated'), '');
});

test('AI JSON is parsed, fenced output is accepted and unknown options are dropped', () => {
  const parsed = parseAiFields({
    response:
      '```json\n{"buyerType":"importer / distributor","productType":"Round Pool (Blue)","quantity":"500 pcs","customizationLevel":"Logo / Branding Only","country":"Germany","targetDelivery":"Q3 2027"}\n```',
  });
  assert.deepEqual(parsed, {
    buyerType: 'Importer / Distributor',
    productType: 'Round Pool (Blue)',
    quantity: '500 pcs',
    customizationLevel: 'Logo / Branding Only',
    country: 'Germany',
    targetDelivery: 'Q3 2027',
  });

  assert.deepEqual(parseAiFields('{"buyerType":"Wholesale Wizard","productType":"Unicorn Pool"}'), {});
  assert.deepEqual(parseAiFields('not json at all'), {});
});

test('AI values are grounded in the buyer text before merging', () => {
  const rules = extractRfqFieldsRules('We need 500 pcs round pools in Germany.').fields;
  const merged = mergeAiFields(
    rules,
    {
      buyerType: 'Importer / Distributor',
      quantity: '1,000 pcs',
      country: 'France',
      targetDelivery: 'Q4 2030',
    },
    'We need 500 pcs round pools in Germany.'
  );
  assert.equal(merged.buyerType, 'Importer / Distributor');
  assert.equal(merged.quantity, '500 pcs');
  assert.equal(merged.country, 'Germany');
  assert.equal(merged.targetDelivery, '');
});

test('deterministic rule matches win over AI reclassification', () => {
  const text = 'We are a distributor in Germany and need 800 pcs rectangular drop-stitch pools with our logo.';
  const rules = extractRfqFieldsRules(text).fields;
  assert.equal(rules.buyerType, 'Importer / Distributor');
  const merged = mergeAiFields(
    rules,
    {
      buyerType: 'Retailer / E-commerce',
      productType: 'Not Sure Yet',
      customizationLevel: 'Standard Product',
      quantity: '2,000 pcs',
      country: 'France',
      targetDelivery: 'Q4 2030',
    },
    text
  );
  assert.equal(merged.buyerType, 'Importer / Distributor');
  assert.equal(merged.productType, 'Rectangular Drop-Stitch Pool');
  assert.equal(merged.customizationLevel, 'Logo / Branding Only');
  assert.equal(merged.quantity, '800 pcs');
  assert.equal(merged.country, 'Germany');
  assert.equal(merged.targetDelivery, '');
});

test('AI fills only the fields the rules leave empty', () => {
  const text =
    'Our buying office sources seasonal outdoor leisure products for hypermarkets in Poland. We plan a first order of 500 units and need our own branding.';
  const rules = extractRfqFieldsRules(text).fields;
  assert.equal(rules.buyerType, '');
  assert.equal(rules.productType, '');
  const merged = mergeAiFields(rules, { buyerType: 'Retailer / E-commerce', productType: 'Not Sure Yet' }, text);
  assert.equal(merged.buyerType, 'Retailer / E-commerce');
  assert.equal(merged.productType, 'Not Sure Yet');
  assert.equal(merged.quantity, '500 units');
  assert.equal(merged.customizationLevel, 'Logo / Branding Only');
  assert.equal(merged.country, 'Poland');
});

test('AI mode merges a valid extraction and keeps the buyer message verbatim', async () => {
  const env = {
    AI: {
      async run() {
        return {
          response: JSON.stringify({
            buyerType: 'Importer / Distributor',
            productType: 'Round Pool (Blue)',
            quantity: '500 pcs',
            country: 'Germany',
          }),
        };
      },
    },
  };
  const result = await extractRfqRequirements('We need 500 pcs round pools in Germany.', env, 'test-model');
  assert.equal(result.mode, 'ai');
  assert.equal(result.fields.buyerType, 'Importer / Distributor');
  assert.equal(result.fields.productType, 'Round Pool (Blue)');
  assert.equal(result.fields.quantity, '500 pcs');
  assert.equal(result.fields.country, 'Germany');
  assert.match(result.fields.message, /500 pcs round pools/);
});

test('AI failure falls back to the deterministic extractor', async () => {
  const env = {
    AI: {
      async run() {
        throw new Error('model unavailable');
      },
    },
  };
  const result = await extractRfqRequirements('Need 500 pcs round pools in Germany.', env, 'test-model');
  assert.equal(result.mode, 'rules');
  assert.equal(result.fields.productType, 'Round Pool (Blue)');
  assert.equal(result.fields.quantity, '500 pcs');
  assert.equal(result.fields.country, 'Germany');
});

test('AI output that is not JSON falls back without fabricating fields', async () => {
  const env = {
    AI: {
      async run() {
        return { response: 'I think you should buy our best pool.' };
      },
    },
  };
  const result = await extractRfqRequirements('Need 500 pcs round pools in Germany.', env, 'test-model');
  assert.equal(result.mode, 'rules');
  assert.equal(result.fields.quantity, '500 pcs');
  assert.equal(result.fields.country, 'Germany');
  assert.equal(result.fields.customizationLevel, '');
});

test('malformed but recoverable AI output is parsed', () => {
  const trailing = parseAiFields({
    response:
      '{"buyerType":"Importer / Distributor","productType":"Round Pool (Blue)","quantity":"1,000 pcs","country":"Germany",}',
  });
  assert.equal(trailing.buyerType, 'Importer / Distributor');
  assert.equal(trailing.productType, 'Round Pool (Blue)');
  assert.equal(trailing.quantity, '1,000 pcs');
  assert.equal(trailing.country, 'Germany');

  const labeled = parseAiFields({
    response:
      'buyerType: Importer / Distributor\nproductType: Round Pool (Blue)\nquantity: 500 pcs\ncustomizationLevel: Logo / Branding Only\ncountry: Germany\ntargetDelivery: Q3 2027',
  });
  assert.deepEqual(labeled, {
    buyerType: 'Importer / Distributor',
    productType: 'Round Pool (Blue)',
    quantity: '500 pcs',
    customizationLevel: 'Logo / Branding Only',
    country: 'Germany',
    targetDelivery: 'Q3 2027',
  });

  const direct = parseAiFields({ buyerType: 'Retailer / E-commerce', country: 'Poland' });
  assert.deepEqual(direct, { buyerType: 'Retailer / E-commerce', country: 'Poland' });

  const smartQuotes = parseAiFields(
    '{"buyerType":"Importer / Distributor","country":"Germany",}'.replace(/"/g, '\u201c')
  );
  assert.deepEqual(smartQuotes, { buyerType: 'Importer / Distributor', country: 'Germany' });
});

test('an all-empty AI object does not fabricate fields', () => {
  assert.deepEqual(
    parseAiFields({
      response:
        '{"buyerType":"","productType":"","quantity":"","customizationLevel":"","country":"","targetDelivery":""}',
    }),
    {}
  );
});

test('sanitizeRfqMessage rejects empty and contact-only briefs and caps length', () => {
  assert.equal(sanitizeRfqMessage('').tooShort, true);
  assert.equal(sanitizeRfqMessage('sales@example.com').tooShort, true);
  const long = sanitizeRfqMessage('p'.repeat(2500));
  assert.equal(long.tooLong, true);
  assert.equal(long.text.length, 2000);
});
