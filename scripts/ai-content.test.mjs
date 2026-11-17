import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  extractRiskTokens,
  findUncoveredRiskTokens,
  languageFor,
  scanContentFiles,
  validateContentReviews,
} from './check-ai-content.mjs';

function entry(path, { markers = [], aiGenerated = false, text = '' } = {}) {
  return { path, text, markers: new Set(markers), aiGenerated, lang: languageFor(path) };
}

function review(overrides = {}) {
  return {
    id: 'ai-2026-11-17-example',
    title: 'Example AI draft',
    status: 'published',
    model: 'gpt-4.1',
    generatedBy: 'automation-worker',
    generatedAt: '2026-11-17',
    files: ['src/data/pages/about.yaml'],
    sources: [{ label: 'Company fact sheet', url: 'https://example.com/facts', accessedAt: '2026-11-17' }],
    claims: [{ statement: 'Wall thickness is 0.9 mm', evidence: 'Internal spec sheet Q3-2026', status: 'verified' }],
    factCheckStatus: 'approved',
    humanReviewStatus: 'approved',
    translationReviewStatus: 'not_required',
    translations: [],
    notes: '',
    publishedBy: 'info@inflatablepoolfactory.com',
    publishedAt: '2026-11-17',
    history: [{ at: '2026-11-17T10:00:00Z', by: 'info@inflatablepoolfactory.com', action: 'created' }],
    ...overrides,
  };
}

function ledger(reviews, publishers = ['info@inflatablepoolfactory.com']) {
  return { version: 1, updated: '2026-11-17', publishers, reviews };
}

test('empty ledger with no AI markers passes', () => {
  const result = validateContentReviews(ledger([]), [], { strict: true });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('complete published review with a matching marker passes', () => {
  const files = [
    entry('src/data/pages/about.yaml', { markers: ['ai-2026-11-17-example'], text: 'Wall thickness is 0.9 mm.' }),
  ];
  const result = validateContentReviews(ledger([review()]), files, { strict: true });
  assert.deepEqual(result.errors, []);
});

test('aiGenerated without an aiReview marker is an error', () => {
  const files = [entry('src/data/pages/about.yaml', { aiGenerated: true })];
  const result = validateContentReviews(ledger([]), files);
  assert.ok(result.errors.some((error) => /aiGenerated: true requires an aiReview marker/.test(error)));
});

test('unknown aiReview id is an error', () => {
  const files = [entry('src/data/pages/about.yaml', { markers: ['ai-missing'] })];
  const result = validateContentReviews(ledger([]), files);
  assert.ok(result.errors.some((error) => /unknown review "ai-missing"/.test(error)));
});

test('draft AI content warns normally and fails strict deploy', () => {
  const files = [entry('src/data/pages/about.yaml', { markers: ['ai-2026-11-17-example'] })];
  const draft = ledger([review({ status: 'draft', factCheckStatus: 'pending', humanReviewStatus: 'pending' })]);
  const normal = validateContentReviews(draft, files);
  const strict = validateContentReviews(draft, files, { strict: true });
  assert.deepEqual(normal.errors, []);
  assert.ok(normal.warnings.some((warning) => /draft AI content is present in the tree/.test(warning)));
  assert.ok(strict.errors.some((error) => /draft AI content is present in the tree/.test(error)));
});

test('published content requires approved fact check and human review', () => {
  const files = [entry('src/data/pages/about.yaml', { markers: ['ai-2026-11-17-example'] })];
  const result = validateContentReviews(
    ledger([review({ factCheckStatus: 'pending', humanReviewStatus: 'rejected' })]),
    files
  );
  assert.ok(result.errors.some((error) => /factCheckStatus: approved/.test(error)));
  assert.ok(result.errors.some((error) => /humanReviewStatus: approved/.test(error)));
});

test('published content rejects unverified claims', () => {
  const files = [entry('src/data/pages/about.yaml', { markers: ['ai-2026-11-17-example'] })];
  const result = validateContentReviews(
    ledger([review({ claims: [{ statement: 'Wall thickness is 0.9 mm', evidence: '', status: 'unverified' }] })]),
    files
  );
  assert.ok(
    result.errors.some(
      (error) => /every claim .*verified with evidence/.test(error) || /verified claim needs evidence/.test(error)
    )
  );
});

test('publishedBy must be in the publisher whitelist', () => {
  const files = [entry('src/data/pages/about.yaml', { markers: ['ai-2026-11-17-example'] })];
  const result = validateContentReviews(ledger([review({ publishedBy: 'eve@example.com' })]), files);
  assert.ok(result.errors.some((error) => /publishedBy must be a publisher/.test(error)));
});

test('publishers[] must contain a valid email', () => {
  const result = validateContentReviews(ledger([], []), []);
  assert.ok(result.errors.some((error) => /publishers\[\] must list/.test(error)));
  const invalid = validateContentReviews(ledger([], ['not-an-email']), []);
  assert.ok(invalid.errors.some((error) => /invalid email/.test(error)));
});

test('published multilingual content needs an approved translation review', () => {
  const files = [
    entry('src/data/pages/de/about.yaml', { markers: ['ai-2026-11-17-example'], text: 'Wall thickness is 0.9 mm.' }),
  ];
  const missing = validateContentReviews(
    ledger([review({ files: ['src/data/pages/de/about.yaml'], translationReviewStatus: 'approved' })]),
    files
  );
  assert.ok(missing.errors.some((error) => /missing approved translation review for "de"/.test(error)));

  const approved = validateContentReviews(
    ledger([
      review({
        files: ['src/data/pages/de/about.yaml'],
        translationReviewStatus: 'approved',
        translations: [
          { lang: 'de', status: 'approved', reviewedBy: 'reviewer@example.com', reviewedAt: '2026-11-17' },
        ],
      }),
    ]),
    files
  );
  assert.deepEqual(approved.errors, []);
});

test('published non-English content may not mark translation as not_required', () => {
  const files = [entry('src/data/pages/ar/about.yaml', { markers: ['ai-2026-11-17-example'] })];
  const result = validateContentReviews(
    ledger([review({ files: ['src/data/pages/ar/about.yaml'], translationReviewStatus: 'not_required' })]),
    files
  );
  assert.ok(result.errors.some((error) => /requires translationReviewStatus: approved/.test(error)));
});

test('uncovered certification tokens block published AI content', () => {
  const files = [
    entry('src/data/pages/about.yaml', {
      markers: ['ai-2026-11-17-example'],
      text: 'Our factory is ISO 9001:2015 certified and produces 12,000 pcs/month.',
    }),
  ];
  const result = validateContentReviews(ledger([review()]), files);
  assert.ok(result.errors.some((error) => /not covered by verified claims/.test(error)));
  assert.ok(result.errors.some((error) => /ISO 9001:2015/.test(error)));
});

test('verified claims can cover certification and capacity tokens', () => {
  const files = [
    entry('src/data/pages/about.yaml', {
      markers: ['ai-2026-11-17-example'],
      text: 'Our factory is ISO 9001:2015 certified and produces 12,000 pcs/month.',
    }),
  ];
  const claims = [
    { statement: 'ISO 9001:2015 certificate held', evidence: 'Certificate CN-2026-001', status: 'verified' },
    { statement: 'Capacity is 12,000 pcs/month', evidence: 'Production plan 2026', status: 'verified' },
  ];
  const result = validateContentReviews(ledger([review({ claims })]), files);
  assert.deepEqual(result.errors, []);
});

test('record file must declare the same aiReview marker', () => {
  const files = [entry('src/data/pages/other.yaml', { markers: ['ai-2026-11-17-example'] })];
  const result = validateContentReviews(ledger([review()]), files);
  assert.ok(result.errors.some((error) => /src\/data\/pages\/about\.yaml does not declare/.test(error)));
});

test('published content needs sources, history and a publish date', () => {
  const files = [
    entry('src/data/pages/about.yaml', { markers: ['ai-2026-11-17-example'], text: 'Wall thickness is 0.9 mm.' }),
  ];
  const result = validateContentReviews(ledger([review({ sources: [], history: [], publishedAt: '' })]), files);
  assert.ok(result.errors.some((error) => /at least one source/.test(error)));
  assert.ok(result.errors.some((error) => /history\[\]/.test(error)));
  assert.ok(result.errors.some((error) => /publishedAt must be YYYY-MM-DD/.test(error)));
});

test('duplicate review ids are rejected', () => {
  const result = validateContentReviews(ledger([review(), review()]), []);
  assert.ok(result.errors.some((error) => /duplicate review id/.test(error)));
});

test('risk token extraction ignores code fences and URLs', () => {
  const tokens = extractRiskTokens('See https://example.com/ISO9001 and `ISO 9001`.\n```\n40 mm\n```\nWall: 12 mm');
  assert.deepEqual(tokens, ['12 mm']);
});

test('risk token matching normalizes spacing and thousands separators', () => {
  const tokens = ['1,000 pcs/month', 'ISO 9001:2015'];
  const claims = [
    { statement: 'Capacity 1000 pcs/month', evidence: 'plan', status: 'verified' },
    { statement: 'ISO9001:2015 certified', evidence: 'cert', status: 'verified' },
  ];
  assert.deepEqual(findUncoveredRiskTokens(tokens, claims), []);
});

test('an unparseable file that mentions AI markers fails instead of being skipped', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-content-'));
  try {
    fs.mkdirSync(path.join(root, 'src', 'data', 'pages'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'src', 'data', 'pages', 'broken.yaml'),
      'aiReview: [unclosed\n  bad: yaml: -\n',
      'utf8'
    );
    const entries = scanContentFiles(root);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].parseError, true);
    const result = validateContentReviews(ledger([]), entries);
    assert.ok(result.errors.some((error) => /cannot parse a content file that declares AI provenance/.test(error)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
