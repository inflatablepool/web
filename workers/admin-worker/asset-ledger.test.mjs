import test from 'node:test';
import assert from 'node:assert/strict';
import { load as yamlLoad } from 'js-yaml';
import { getAssetLedger, saveAssetLedger, sanitizeLedger } from './asset-ledger.ts';

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

const ctx = { token: 'test-token', owner: 'inflatablepool', repo: 'web', api: 'https://api.github.com/repos/inflatablepool/web' };

const ledgerYaml = `version: 1
updated: '2026-11-17'
assets:
  - path: /images/pools/a.webp
    storage: repo
    type: product_photo
    source: Supplier photo
    license: company_owned
    reviewStatus: pending
    legacyBaseline: false
    approvedBy: ''
    approvedAt: ''
    notes: ''
`;

function approved(overrides = {}) {
  return {
    path: '/images/pools/a.webp',
    storage: 'repo',
    type: 'product_photo',
    source: 'Supplier product photo, authorisation on file',
    license: 'supplier_authorized',
    reviewStatus: 'approved',
    legacyBaseline: false,
    approvedBy: 'ops@inflatablepoolfactory.com',
    approvedAt: '2026-11-17',
    notes: '',
    ...overrides,
  };
}

test('getAssetLedger reads the draft ledger and usage map', async () => {
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('asset-ledger.yaml') && target.includes('ref=draft')) return ghFile(ledgerYaml, 'abc');
    if (target.includes('asset-usage.json') && target.includes('ref=draft')) {
      return ghFile(JSON.stringify({ assets: { '/images/pools/a.webp': ['src/pages/x.astro'] } }));
    }
    return new Response('not found', { status: 404 });
  };

  const res = await getAssetLedger(ctx, new Request('https://example.com/api/admin/asset-ledger'));
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.branch, 'draft');
  assert.equal(data.sha, 'abc');
  assert.equal(data.ledger.assets.length, 1);
  assert.deepEqual(data.usage.assets['/images/pools/a.webp'], ['src/pages/x.astro']);
});

test('getAssetLedger falls back to main when draft has no ledger', async () => {
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes('ref=main') && target.includes('asset-ledger.yaml')) return ghFile(ledgerYaml, 'main-sha');
    if (target.includes('ref=main') && target.includes('asset-usage.json')) return ghFile('{"assets":{}}');
    return new Response('not found', { status: 404 });
  };

  const res = await getAssetLedger(ctx, new Request('https://example.com/api/admin/asset-ledger'));
  const data = await res.json();
  assert.equal(data.branch, 'main');
  assert.equal(data.sha, 'main-sha');
  assert.equal(data.ledger.assets.length, 1);
});

test('saveAssetLedger creates the ledger on draft and returns the new sha', async () => {
  let putBody = null;
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    if (init?.method === 'PUT') {
      putBody = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ content: { sha: 'new-sha' } }), { status: 200 });
    }
    if (target.includes('ref=draft')) return new Response('not found', { status: 404 });
    return new Response('not found', { status: 404 });
  };

  const res = await saveAssetLedger(
    ctx,
    new Request('https://example.com/api/admin/asset-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ledger: { assets: [approved()] } }),
    }),
    async () => ({ ok: true })
  );
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.sha, 'new-sha');
  assert.equal(putBody.branch, 'draft');
  const written = yamlLoad(Buffer.from(putBody.content, 'base64').toString('utf8'));
  assert.equal(written.assets[0].reviewStatus, 'approved');
  assert.equal(written.assets[0].license, 'supplier_authorized');
});

test('saveAssetLedger rejects a stale draft sha', async () => {
  globalThis.fetch = async (url, init) => {
    if (init?.method === 'PUT') throw new Error('PUT should not be called');
    return ghFile(ledgerYaml, 'current-sha');
  };

  const res = await saveAssetLedger(
    ctx,
    new Request('https://example.com/api/admin/asset-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ledger: { assets: [approved()] }, sha: 'stale-sha' }),
    }),
    async () => ({ ok: true })
  );
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.match(data.error, /Draft changed/);
});

test('sanitizeLedger keeps a fully approved entry', () => {
  const ledger = sanitizeLedger({ assets: [approved()] });
  assert.equal(ledger.assets.length, 1);
  assert.equal(ledger.assets[0].license, 'supplier_authorized');
  assert.equal(ledger.assets[0].reviewStatus, 'approved');
});

test('approved entry without a concrete licence is rejected', () => {
  assert.throws(() => sanitizeLedger({ assets: [approved({ license: 'unverified' })] }), /concrete license/);
});

test('approved entry without reviewer or date is rejected', () => {
  assert.throws(() => sanitizeLedger({ assets: [approved({ approvedBy: '' })] }), /approvedBy/);
  assert.throws(() => sanitizeLedger({ assets: [approved({ approvedAt: '17/11/2026' })] }), /approvedAt/);
});

test('duplicate and non-image paths are rejected', () => {
  assert.throws(() => sanitizeLedger({ assets: [approved(), approved()] }), /duplicate asset path/);
  assert.throws(() => sanitizeLedger({ assets: [approved({ path: 'images/a.webp' })] }), /invalid asset path/);
});

test('unknown enums are rejected', () => {
  assert.throws(() => sanitizeLedger({ assets: [approved({ type: 'generated' })] }), /invalid type/);
  assert.throws(() => sanitizeLedger({ assets: [approved({ reviewStatus: 'done' })] }), /invalid reviewStatus/);
});

test('R2-only storage is preserved', () => {
  const ledger = sanitizeLedger({ assets: [approved({ storage: 'r2', path: '/images/r2/hero.webp' })] });
  assert.equal(ledger.assets[0].storage, 'r2');
});
