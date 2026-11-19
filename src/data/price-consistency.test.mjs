/**
 * P1-8 price-consistency test: every purchasable retail item has exactly one
 * declared retail price — `productRetailSizes` in src/data/product-variants.ts
 * — and it must match the Stripe checkout catalog (functions/api/checkout.ts,
 * unitAmount = priceUsd × 100) and the colorway buy-button data
 * (src/data/product-colorways.ts). A price change in one file without the
 * others fails here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { PRODUCT_CATALOG } from '../../functions/api/checkout.ts';
import { productColorways } from './product-colorways.ts';
import { productRetailSizes } from './product-variants.ts';

test('every priced retail size matches the checkout catalog (price × 100)', () => {
  for (const [slug, entry] of Object.entries(productRetailSizes)) {
    const catalog = PRODUCT_CATALOG[entry.sku];
    assert.ok(catalog, `checkout catalog missing SKU ${entry.sku} (${slug})`);
    for (const size of entry.sizes) {
      if (typeof size.priceUsd !== 'number') continue; // "Request price" size
      const variant = catalog.variants?.[size.item];
      assert.ok(variant, `checkout catalog ${entry.sku} has no variant ${size.item}`);
      assert.equal(
        variant.unitAmount,
        size.priceUsd * 100,
        `${entry.sku} variant ${size.item}: checkout cents != retail price × 100`
      );
      assert.equal(variant.label, size.size, `${entry.sku} variant ${size.item}: label mismatch`);
    }
  }
});

test('every colorway buy button posts a priced checkout item at the shared retail price', () => {
  for (const [slug, colorway] of Object.entries(productColorways)) {
    const catalog = PRODUCT_CATALOG[colorway.sku];
    assert.ok(catalog, `checkout catalog missing colorway SKU ${colorway.sku}`);
    const retailSizes = productRetailSizes[slug];
    assert.ok(retailSizes, `no retail size data for colorway page ${slug}`);
    const buyEntry = retailSizes.sizes.find((s) => s.item === colorway.buyItem && typeof s.priceUsd === 'number');
    assert.ok(
      buyEntry,
      `colorway ${colorway.sku} buy item ${colorway.buyItem} has no firm retail price (${slug})`
    );
    const variant = catalog.variants?.[colorway.buyItem];
    assert.ok(variant, `checkout catalog ${colorway.sku} has no variant ${colorway.buyItem}`);
    assert.equal(
      variant.unitAmount,
      buyEntry.priceUsd * 100,
      `colorway ${colorway.sku} ${colorway.buyItem}: checkout cents != retail price × 100`
    );
    assert.equal(variant.label, colorway.buySize, `colorway ${colorway.sku}: buy size label mismatch`);
  }
});

test('colorway checkout SKU is distinct from the base product SKU', () => {
  for (const [slug, colorway] of Object.entries(productColorways)) {
    const base = productRetailSizes[slug];
    assert.ok(base, `no retail size data for colorway page ${slug}`);
    assert.notEqual(colorway.sku, base.sku, `colorway on ${slug} must use its own checkout SKU`);
  }
});
