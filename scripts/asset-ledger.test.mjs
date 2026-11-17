import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLedger } from './check-asset-ledger.mjs';

function entry(path, overrides = {}) {
  return {
    path,
    storage: 'repo',
    type: 'product_photo',
    source: 'Company product photo',
    license: 'company_owned',
    reviewStatus: 'approved',
    legacyBaseline: false,
    approvedBy: 'ops@inflatablepoolfactory.com',
    approvedAt: '2026-11-17',
    notes: '',
    ...overrides,
  };
}

function usage(map) {
  return new Map(Object.entries(map).map(([key, value]) => [key, new Set(value)]));
}

test('approved repo asset with current usage passes', () => {
  const result = validateLedger(
    { assets: [entry('/images/pools/a.webp')] },
    ['/images/pools/a.webp'],
    usage({ '/images/pools/a.webp': ['src/data/site/about.yaml'] })
  );
  assert.deepEqual(result.errors, []);
});

test('missing ledger entry is an error', () => {
  const result = validateLedger({ assets: [] }, ['/images/pools/a.webp'], usage({}));
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /no ledger entry/);
});

test('new pending asset blocks strict mode but only warns normally', () => {
  const ledger = {
    assets: [
      entry('/images/pools/a.webp', { reviewStatus: 'pending', license: 'unverified', approvedBy: '', approvedAt: '' }),
    ],
  };
  const normal = validateLedger(
    ledger,
    ['/images/pools/a.webp'],
    usage({ '/images/pools/a.webp': ['src/pages/x.astro'] })
  );
  const strict = validateLedger(
    ledger,
    ['/images/pools/a.webp'],
    usage({ '/images/pools/a.webp': ['src/pages/x.astro'] }),
    {
      strict: true,
    }
  );
  assert.deepEqual(normal.errors, []);
  assert.equal(strict.errors.length, 1);
  assert.match(strict.errors[0], /pending review/);
});

test('legacy pending asset warns but does not block strict mode', () => {
  const ledger = {
    assets: [
      entry('/images/pools/a.webp', {
        reviewStatus: 'pending',
        license: 'unverified',
        legacyBaseline: true,
        approvedBy: '',
        approvedAt: '',
      }),
    ],
  };
  const result = validateLedger(
    ledger,
    ['/images/pools/a.webp'],
    usage({ '/images/pools/a.webp': ['src/pages/x.astro'] }),
    {
      strict: true,
    }
  );
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.some((warning) => /legacy baseline asset still pending/.test(warning)));
});

test('rejected asset may not stay referenced', () => {
  const ledger = { assets: [entry('/images/pools/a.webp', { reviewStatus: 'rejected' })] };
  const result = validateLedger(
    ledger,
    ['/images/pools/a.webp'],
    usage({ '/images/pools/a.webp': ['src/pages/x.astro'] })
  );
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /rejected asset is still referenced/);
});

test('approved asset requires a concrete licence and reviewer', () => {
  const ledger = {
    assets: [entry('/images/pools/a.webp', { license: 'unverified', approvedBy: '', approvedAt: '' })],
  };
  const result = validateLedger(ledger, ['/images/pools/a.webp'], usage({}));
  assert.ok(result.errors.some((error) => /concrete license/.test(error)));
  assert.ok(result.errors.some((error) => /approvedBy/.test(error)));
  assert.ok(result.errors.some((error) => /approvedAt/.test(error)));
});

test('R2-only asset referenced by a page is valid', () => {
  const r2 = entry('/images/r2/hero.webp', { storage: 'r2', type: 'unconfirmed' });
  const result = validateLedger(
    { assets: [r2] },
    [],
    usage({ '/images/r2/hero.webp': ['src/pages/[lang]/about.astro'] })
  );
  assert.deepEqual(result.errors, []);
});

test('referenced asset missing from disk and ledger is an error', () => {
  const result = validateLedger({ assets: [] }, [], usage({ '/images/pools/ghost.webp': ['src/pages/x.astro'] }));
  assert.ok(result.errors.some((error) => /missing from public\/images/.test(error)));
});

test('stale usage file is an error', () => {
  const result = validateLedger(
    { assets: [entry('/images/pools/a.webp')] },
    ['/images/pools/a.webp'],
    usage({ '/images/pools/a.webp': ['src/pages/x.astro'] }),
    { usageFileCurrent: false }
  );
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /asset-usage.json is stale/);
});
