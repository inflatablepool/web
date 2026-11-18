/**
 * Product colorway definitions (P1-5).
 *
 * The round grey pool page was merged into the round blue pool page: both
 * colorways share the same 23-size factory series, dimensions and walls, so
 * they are presented on one page. The grey SKU stays purchasable through the
 * same Stripe checkout.
 *
 * Keep `sku` and `priceUsd` in sync with PRODUCT_CATALOG in
 * functions/api/checkout.ts (unitAmount = priceUsd × 100).
 */

export interface ProductColorwayImage {
  url: string;
  alt: string;
}

export interface ProductColorway {
  /** Stripe checkout SKU (functions/api/checkout.ts PRODUCT_CATALOG key) */
  sku: string;
  /** Full product name shown to buyers */
  name: string;
  /** Short color name, e.g. "Grey" */
  colorName: string;
  /** Retail price in USD, string form as published (matches checkout × 100) */
  priceUsd: string;
  /** Note under the price */
  priceNote: string;
  /** Marketing paragraph describing the colorway */
  note: string;
  images: ProductColorwayImage[];
}

export const productColorways: Record<string, ProductColorway> = {
  'round-blue-drop-stitch-pool': {
    sku: 'IPF-POOL-RND-GREY',
    name: 'Round Grey Inflatable Drop Stitch Swimming Pool',
    colorName: 'Grey',
    priceUsd: '299',
    priceNote:
      'Same price as the blue colorway for the Ø 2.0 × 0.5 m (S2005) size — includes 1000W electric air pump, repair kit, and storage bag. Optional matching fitted cover available.',
    note: 'The same round drop stitch series — the same 23 factory sizes, 10/15 cm walls, and 4–5 PSI rigid inflation — in a modern grey finish for contemporary patios, villas, and boutique settings. An optional matching fitted cover keeps debris out and the water warm between swims.',
    images: [
      {
        url: '/images/pools/round-grey-pool-1.webp',
        alt: 'Round drop stitch grey inflatable swimming pool — grey colorway',
      },
      {
        url: '/images/pools/round-grey-pool-2.webp',
        alt: 'Round drop stitch grey inflatable swimming pool — side view',
      },
      {
        url: '/images/pools/round-grey-pool-cover-1.webp',
        alt: 'Round drop stitch grey inflatable swimming pool with fitted cover',
      },
    ],
  },
};
