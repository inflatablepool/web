export interface SampleProduct {
  slug: string;
  name: string;
  rfqProductType: string;
  sizeRange: string;
  wallThickness: string;
  bestFor: string;
  image: string;
  imageAlt: string;
  imageFit: 'cover' | 'contain';
  productHref: string;
}

/**
 * The five standard platforms available for sample review. `rfqProductType`
 * must match the value of the productType option in the RFQ form exactly;
 * the sample request page pre-fills that select through the query string.
 */
export const SAMPLE_PRODUCTS = [
  {
    slug: 'rectangular-drop-stitch-pool',
    name: 'Rectangular Inflatable Drop Stitch Swimming Pool',
    rfqProductType: 'Rectangular Drop-Stitch Pool',
    sizeRange: '2 x 2 x 0.8 m to 6 x 5 x 1.5 m',
    wallThickness: '15 / 20 / 50 cm walls',
    bestFor: 'Retail ranges and projects that need a defined swim lane.',
    image: '/images/pools/rectangular-pool-2.webp',
    imageAlt: 'Rectangular drop stitch inflatable swimming pool',
    imageFit: 'cover',
    productHref: '/products/rectangular-drop-stitch-pool',
  },
  {
    slug: 'round-blue-drop-stitch-pool',
    name: 'Round Blue Inflatable Drop Stitch Swimming Pool',
    rfqProductType: 'Round Pool (Blue)',
    sizeRange: 'Diameter 2.0 m to 10.0 m',
    wallThickness: '10 / 15 cm walls',
    bestFor: 'Family pools and a classic blue retail assortment.',
    image: '/images/pools/round-blue-pool-1.webp',
    imageAlt: 'Round blue drop stitch inflatable swimming pool',
    imageFit: 'cover',
    productHref: '/products/round-blue-drop-stitch-pool',
  },
  {
    slug: 'round-grey-drop-stitch-pool',
    name: 'Round Grey Inflatable Drop Stitch Swimming Pool',
    rfqProductType: 'Round Pool (Grey)',
    sizeRange: 'Diameter 2.0 m to 10.0 m',
    wallThickness: '10 / 15 cm walls',
    bestFor: 'Premium retail ranges and modern outdoor settings.',
    image: '/images/pools/round-grey-pool-1.webp',
    imageAlt: 'Round grey drop stitch inflatable swimming pool',
    imageFit: 'cover',
    // P1-5: grey is a colorway sold on the merged round pool page.
    productHref: '/products/round-blue-drop-stitch-pool',
  },
  {
    slug: 'hot-tub-round',
    name: 'Round Inflatable Hot Tub SPA Pool',
    rfqProductType: 'SPA / Hot Tub',
    sizeRange: 'Diameter 1.8 m / 2.0 m / 2.3 m',
    wallThickness: '8 / 10 / 15 cm walls',
    bestFor: 'Compact SPA, wellness and hospitality assortments.',
    image: '/images/pools/hot-tub-round.png',
    imageAlt: 'Round inflatable hot tub SPA pool with built-in seats',
    imageFit: 'contain',
    productHref: '/products/hot-tub-round',
  },
  {
    slug: 'hot-tub-square-rect',
    name: 'Square and Rectangular Inflatable Hot Tub SPA Pool',
    rfqProductType: 'SPA / Hot Tub',
    sizeRange: '1.5 x 1.5 x 0.8 m to 3 x 2 x 1 m',
    wallThickness: '15 / 20 cm walls',
    bestFor: 'Larger SPA layouts and commercial hospitality projects.',
    image: '/images/pools/hot-tub-square.webp',
    imageAlt: 'Square inflatable hot tub SPA pool with built-in seats',
    imageFit: 'contain',
    productHref: '/products/hot-tub-square-rect',
  },
] as const;

export type SampleProductSlug = (typeof SAMPLE_PRODUCTS)[number]['slug'];

export const SAMPLE_DEFAULT_QUANTITY = '1 sample';
export const SAMPLE_BRIEF_MAX_FIELD_LENGTH = 500;
export const SAMPLE_BRIEF_MAX_LENGTH = 2000;
export const SAMPLE_TERMS_NOTE =
  'Sample terms: quantity, charges, courier arrangement and timing are confirmed in the quotation.';

export interface SampleRequestInput {
  productSlug?: string;
  quantity?: string;
  intendedUse?: string;
  targetMarket?: string;
  targetSize?: string;
  requirements?: string;
}

const BRIEF_FIELDS: Array<[keyof SampleRequestInput, string]> = [
  ['quantity', 'Sample quantity'],
  ['intendedUse', 'Intended use'],
  ['targetMarket', 'Target market'],
  ['targetSize', 'Size or model'],
  ['requirements', 'Additional requirements'],
];

function cleanValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, SAMPLE_BRIEF_MAX_FIELD_LENGTH).trim();
}

/**
 * Looks up a standard sample platform by product page slug. Unknown or empty
 * slugs are ignored so a crafted URL cannot inject arbitrary product text.
 */
export function getSampleProduct(slug: string | undefined | null): SampleProduct | undefined {
  if (!slug) return undefined;
  return SAMPLE_PRODUCTS.find((product) => product.slug === slug);
}

/**
 * Builds the plain-text sample brief passed to the existing RFQ form. Only
 * buyer-entered values are included, followed by the standard statement that
 * sample terms are confirmed in the quotation.
 */
export function buildSampleBrief(input: SampleRequestInput): string {
  const lines: string[] = ['Sample request'];

  const product = getSampleProduct(input.productSlug);
  if (product) lines.push(`Product: ${product.name}`);

  for (const [key, label] of BRIEF_FIELDS) {
    const value = cleanValue(input[key]);
    if (value) lines.push(`${label}: ${value}`);
  }

  const body = lines.join('\n');
  const terms = `${SAMPLE_TERMS_NOTE}`;
  const maxBodyLength = SAMPLE_BRIEF_MAX_LENGTH - terms.length - 1;
  const trimmedBody = body.length <= maxBodyLength ? body : `${body.slice(0, maxBodyLength - 3).trimEnd()}...`;

  return `${trimmedBody}\n${terms}`;
}

/**
 * Maps a sample request to the existing RFQ form query parameters. The form
 * only reads these values client-side; this helper never submits anything.
 */
export function buildSampleRequestUrl(input: SampleRequestInput = {}, basePath = '/request-quotation'): string {
  const params = new URLSearchParams();

  const product = getSampleProduct(input.productSlug);
  if (product) params.set('product', product.rfqProductType);

  const quantity = cleanValue(input.quantity) || SAMPLE_DEFAULT_QUANTITY;
  params.set('quantity', quantity);
  params.set('brief', buildSampleBrief({ ...input, quantity }));

  return `${basePath}?${params.toString()}`;
}
