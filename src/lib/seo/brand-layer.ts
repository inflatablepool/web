import { contentV2Records } from '~/data/content-v2';
import { products } from '~/data/products';

export interface BrandCta {
  text: string;
  link: string;
  reason: string;
}

export interface BrandPageEntry {
  slug: string;
  title: string;
  category: 'guide' | 'comparison' | 'beginner' | 'gear' | 'brand';
  cta: BrandCta;
  productSlugs: string[];
  brandKeywords: string[];
}

export interface BrandConversion {
  page: BrandPageEntry;
  recommendedProducts: typeof products;
}

const POOL_PRODUCT_IDS = ['rectangular-drop-stitch-pool', 'round-blue-drop-stitch-pool', 'round-grey-drop-stitch-pool'];

const CTA_RULES: Array<{
  match: (slug: string) => boolean;
  cta: BrandCta;
  products: string[];
  keywords: string[];
}> = [
  {
    match: (s) => s.includes('why-drop-stitch-pools'),
    cta: {
      text: 'Shop drop-stitch pools',
      link: '/products',
      reason: 'Drop-stitch content → product category',
    },
    products: POOL_PRODUCT_IDS,
    keywords: ['drop-stitch', 'inflatable pool', 'rigidity', 'durability'],
  },
  {
    match: (s) => s.includes('inflatable-pool-vs-steel-frame'),
    cta: {
      text: 'Compare our pools',
      link: '/products/compare',
      reason: 'Comparison → product comparison page',
    },
    products: POOL_PRODUCT_IDS,
    keywords: ['inflatable pool', 'steel frame pool', 'comparison', 'backyard'],
  },
  {
    match: (s) => s.includes('inflatable-pool-water-care-basics'),
    cta: {
      text: 'Browse pool products',
      link: '/products',
      reason: 'Care guide → product discovery',
    },
    products: POOL_PRODUCT_IDS,
    keywords: ['pool care', 'water maintenance', 'cleaning', 'filtration'],
  },
];

export function getBrandEntry(slug: string): BrandPageEntry | null {
  const record = contentV2Records.find((c) => c.slug === slug);
  if (!record) return null;

  for (const rule of CTA_RULES) {
    if (rule.match(slug)) {
      return {
        slug,
        title: record.title || slug,
        category: slug.includes('beginner')
          ? 'beginner'
          : slug.includes('vs') || slug.includes('comparison')
            ? 'comparison'
            : slug.includes('guide') || slug.includes('explained')
              ? 'guide'
              : slug.includes('gear')
                ? 'gear'
                : 'brand',
        cta: rule.cta,
        productSlugs: rule.products,
        brandKeywords: rule.keywords,
      };
    }
  }

  return {
    slug,
    title: record.title || slug,
    category: 'guide',
    cta: { text: 'Browse products', link: '/products', reason: 'Generic fallback CTA' },
    productSlugs: POOL_PRODUCT_IDS,
    brandKeywords: ['inflatable swimming pool', 'backyard pool'],
  };
}

export function getConversion(slug: string): BrandConversion | null {
  const entry = getBrandEntry(slug);
  if (!entry) return null;
  return {
    page: entry,
    recommendedProducts: products.filter((p) => entry.productSlugs.includes(p.id)),
  };
}

export function getAllBrandPages(): BrandPageEntry[] {
  return contentV2Records
    .filter((c) => c.type === 'guide' || c.type === 'comparison')
    .map((c) => getBrandEntry(c.slug))
    .filter((e): e is BrandPageEntry => e !== null)
    .sort((a, b) => (a.category === 'beginner' ? 0 : 1) - (b.category === 'beginner' ? 0 : 1));
}

export const BRAND_SUMMARY = {
  name: 'Inflatable Pool Factory',
  tagline: 'Inflatable Swimming Pools for Every Backyard',
  description: 'Durable drop-stitch inflatable pools that set up in minutes and last for summers.',
  foundingYear: 2012,
  categories: ['Rectangular Pools', 'Round Pools', 'Pool Accessories'],
  ethos: ['Drop-stitch construction', 'Family-safe materials', 'Easy setup and storage'],
  cta: { text: 'Find your pool', link: '/products' },
};
