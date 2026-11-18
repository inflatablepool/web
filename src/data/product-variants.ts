/**
 * Retail size selection data (R-01, factory confirmation 2026-11).
 *
 * Retail rule: fixed retail prices with online checkout only for small/mid
 * sizes (≤ 4 m) with standard walls. Sizes whose price is pending finance
 * confirmation carry no `priceUsd` — the selector shows them as
 * "Request price" and links to the contact form instead of checkout.
 *
 * Keep priced `item` codes and `priceUsd` in sync with the `variants` map in
 * functions/api/checkout.ts (unitAmount = priceUsd × 100).
 */

export interface RetailSize {
  /** Factory item code posted as `item` to /api/checkout */
  item: string;
  /** Display size, e.g. "Ø 2.0 × 0.5 m" */
  size: string;
  /** Wall description, e.g. "10 cm wall" */
  wall: string;
  /** Firm retail price in USD; omit when the price is pending confirmation */
  priceUsd?: number;
}

export interface ProductRetailSizes {
  /** Stripe checkout SKU (functions/api/checkout.ts PRODUCT_CATALOG key) */
  sku: string;
  sizes: RetailSize[];
}

export const productRetailSizes: Record<string, ProductRetailSizes> = {
  'round-blue-drop-stitch-pool': {
    sku: 'IPF-POOL-RND-BLUE',
    sizes: [
      { item: 'S2005', size: 'Ø 2.0 × 0.5 m', wall: '10 cm wall', priceUsd: 299 },
      // S3010 / S3012 retail prices pending finance confirmation — request only.
      { item: 'S3010', size: 'Ø 3.0 × 1.0 m', wall: '15 cm wall' },
      { item: 'S3012', size: 'Ø 3.0 × 1.2 m', wall: '15 cm wall' },
    ],
  },
};
