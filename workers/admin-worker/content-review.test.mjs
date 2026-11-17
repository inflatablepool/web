import test from 'node:test';
import assert from 'node:assert/strict';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import {
  applyPublishState,
  checkContentReviewPublishGuard,
  getContentReview,
  sanitizeContentLedger,
  saveContentReview,
  validatePublishable,
} from './content-review.ts';

const originalFetch = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function b64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function ghFile(content, sha = 'sha1') {
  return new Response(JSON.stringify({ sha, content: b64(content), encoding: 'base64' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const ctx = {
  token: 'test-token',
  owner: 'inflatablepool',
  repo: 'web',
  api: 'https://api.github.com/repos/inflatablepool/web',
};

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
    publishedBy: '',
    publishedAt: '',
    history: [],
    ...overrides,
  };
}

function ledger(reviews, publishers = ['info@inflatablepoolfactory.com']) {
  return { version: 1, updated: '2026-11-17', publishers, reviews };
}

test('sanitizeContentLedger keeps a valid ledger', () => {
  const sanitized = sanitizeContentLedger(
    ledger([review({ status: 'draft', publishedBy: 'forged@example.com', publishedAt: '2026-01-01' })])
  );
  assert.equal(sanitized.reviews.length, 1);
  assert.equal(sanitized.reviews[0].status, 'draft');
  assert.equal(sanitized.reviews[0].publishedBy, '');
  assert.equal(sanitized.reviews[0].publishedAt, '');
  assert.equal(sanitized.publishers[0], 'info@inflatablepoolfactory.com');
});

test('invalid review ids and duplicate ids are rejected', () => {
  assert.throws(() => sanitizeContentLedger(ledger([review({ id: 'bad' })])), /invalid review id/);
  assert.throws(() => sanitizeContentLedger(ledger([review(), review()])), /duplicate review id/);
});

test('invalid content file paths are rejected', () => {
  assert.throws(() => sanitizeContentLedger(ledger([review({ files: ['../etc/passwd'] })])), /invalid content file/);
  assert.throws(() => sanitizeContentLedger(ledger([review({ files: [] })])), /files\[\] is required/);
});

test('verified claims need evidence and approved translations need a reviewer', () => {
  assert.throws(
    () => sanitizeContentLedger(ledger([review({ claims: [{ statement: 'x', evidence: '', status: 'verified' }] })])),
    /verified claims need evidence/
  );
  assert.throws(
    () =>
      sanitizeContentLedger(
        ledger([review({ translations: [{ lang: 'de', status: 'approved', reviewedBy: '', reviewedAt: '' }] })])
      ),
    /needs reviewedBy/
  );
});

test('publishing sets publishedBy, publishedAt and history from the acting admin', () => {
  const result = applyPublishState(ledger([review()]), null, 'info@inflatablepoolfactory.com');
  assert.equal(result.reviews[0].publishedBy, 'info@inflatablepoolfactory.com');
  assert.match(result.reviews[0].publishedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(result.reviews[0].history.length, 1);
  assert.equal(result.reviews[0].history[0].action, 'created');
  assert.equal(result.reviews[0].history[0].by, 'info@inflatablepoolfactory.com');
});

test('a non-publisher cannot publish a review', () => {
  assert.throws(
    () => applyPublishState(ledger([review()]), null, 'other@example.com'),
    /not in the publishers whitelist/
  );
});

test('editing a published review preserves publisher metadata and appends history', () => {
  const prior = ledger([
    review({
      title: 'First title',
      notes: 'first',
      publishedBy: 'info@inflatablepoolfactory.com',
      publishedAt: '2026-11-01',
      history: [{ at: '2026-11-01T10:00:00Z', by: 'info@inflatablepoolfactory.com', action: 'created' }],
    }),
  ]);
  const result = applyPublishState(
    ledger([review({ title: 'Second title', notes: 'second' })]),
    prior,
    'info@inflatablepoolfactory.com'
  );
  assert.equal(result.reviews[0].publishedBy, 'info@inflatablepoolfactory.com');
  assert.equal(result.reviews[0].publishedAt, '2026-11-01');
  assert.equal(result.reviews[0].history.length, 2);
  assert.equal(result.reviews[0].history.at(-1).action, 'edited');
});

test('validatePublishable requires sources, verified claims and translations', () => {
  const complete = applyPublishState(ledger([review()]), null, 'info@inflatablepoolfactory.com').reviews[0];
  assert.doesNotThrow(() => validatePublishable(complete, complete.publishedBy ? ['info@inflatablepoolfactory.com'] : []));

  const noSource = { ...complete, sources: [] };
  assert.throws(() => validatePublishable(noSource, ['info@inflatablepoolfactory.com']), /at least one source/);

  const unverified = { ...complete, claims: [{ statement: 'x', evidence: '', status: 'unverified' }] };
  assert.throws(() => validatePublishable(unverified, ['info@inflatablepoolfactory.com']), /verified with evidence/);

  const multilingual = {
    ...complete,
    files: ['src/data/pages/de/about.yaml'],
    translationReviewStatus: 'approved',
    translations: [],
  };
  assert.throws(
    () => validatePublishable(multilingual, ['info@inflatablepoolfactory.com']),
    /translation de needs an approved human review/
  );
});

test('getContentReview reads the draft ledger and reports publisher permission', async () => {
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('ai-content-reviews.yaml') && target.includes('ref=draft')) {
      return ghFile(yamlDump(ledger([review({ status: 'draft' })])), 'abc');
    }
    return new Response('not found', { status: 404 });
  };

  const allowed = await getContentReview(
    ctx,
    { email: 'info@inflatablepoolfactory.com' },
    new Request('https://example.com/api/admin/content-review')
  );
  const allowedData = await allowed.json();
  assert.equal(allowedData.success, true);
  assert.equal(allowedData.branch, 'draft');
  assert.equal(allowedData.sha, 'abc');
  assert.equal(allowedData.canPublish, true);

  const blocked = await getContentReview(
    ctx,
    { email: 'other@example.com' },
    new Request('https://example.com/api/admin/content-review')
  );
  const blockedData = await blocked.json();
  assert.equal(blockedData.canPublish, false);
});

test('saveContentReview writes published state to draft and returns the new sha', async () => {
  let putBody = null;
  globalThis.fetch = async (url, init) => {
    if (init?.method === 'PUT') {
      putBody = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ content: { sha: 'new-sha' } }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  };

  const res = await saveContentReview(
    ctx,
    new Request('https://example.com/api/admin/content-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ledger: ledger([review()]), sha: '' }),
    }),
    { email: 'info@inflatablepoolfactory.com' },
    async () => ({ ok: true })
  );
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.sha, 'new-sha');
  assert.equal(data.branch, 'draft');
  assert.equal(putBody.branch, 'draft');

  const written = yamlLoad(Buffer.from(putBody.content, 'base64').toString('utf8'));
  assert.equal(written.reviews[0].publishedBy, 'info@inflatablepoolfactory.com');
  assert.ok(written.reviews[0].history.length > 0);
});

test('saveContentReview rejects a stale draft sha', async () => {
  globalThis.fetch = async (url, init) => {
    if (init?.method === 'PUT') throw new Error('PUT should not be called');
    return ghFile(yamlDump(ledger([review({ status: 'draft' })])), 'current-sha');
  };

  const res = await saveContentReview(
    ctx,
    new Request('https://example.com/api/admin/content-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ledger: ledger([review({ status: 'draft' })]), sha: 'stale-sha' }),
    }),
    { email: 'info@inflatablepoolfactory.com' },
    async () => ({ ok: true })
  );
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.match(data.error, /Draft changed/);
});

test('saveContentReview returns 403 when a non-publisher publishes', async () => {
  globalThis.fetch = async (url, init) => {
    if (init?.method === 'PUT') throw new Error('PUT should not be called');
    return new Response('not found', { status: 404 });
  };

  const res = await saveContentReview(
    ctx,
    new Request('https://example.com/api/admin/content-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ledger: ledger([review()]), sha: '' }),
    }),
    { email: 'other@example.com' },
    async () => ({ ok: true })
  );
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /publishers whitelist/);
});

test('publish guard allows a clean draft', async () => {
  const draft = yamlDump(ledger([review({ status: 'draft' })]));
  const main = yamlDump(ledger([]));
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('ai-content-reviews.yaml') && target.includes('ref=draft')) return ghFile(draft);
    if (target.includes('ai-content-reviews.yaml') && target.includes('ref=main')) return ghFile(main);
    return new Response('not found', { status: 404 });
  };

  assert.equal(await checkContentReviewPublishGuard(ctx), null);
});

test('publish guard blocks publisher whitelist edits and unpublished AI files', async () => {
  const main = yamlDump(ledger([]));
  const widened = yamlDump(ledger([], ['info@inflatablepoolfactory.com', 'new@example.com']));
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('ai-content-reviews.yaml') && target.includes('ref=draft')) return ghFile(widened);
    if (target.includes('ai-content-reviews.yaml') && target.includes('ref=main')) return ghFile(main);
    return new Response('not found', { status: 404 });
  };

  const publishersError = await checkContentReviewPublishGuard(ctx);
  assert.match(publishersError, /publisher whitelist/);

  const draft = yamlDump(ledger([review({ status: 'draft' })]));
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('ai-content-reviews.yaml') && target.includes('ref=draft')) return ghFile(draft);
    if (target.includes('ai-content-reviews.yaml') && target.includes('ref=main')) return ghFile(main);
    if (target.includes('about.yaml') && target.includes('ref=draft')) return ghFile('aiGenerated: true');
    return new Response('not found', { status: 404 });
  };

  const contentError = await checkContentReviewPublishGuard(ctx);
  assert.match(contentError, /still draft/);
});
