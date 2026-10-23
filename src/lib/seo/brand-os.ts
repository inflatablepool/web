import { contentV2Records } from '~/data/content-v2';
import { products } from '~/data/products';

export interface RegionConfig {
  locale: string;
  name: string;
  flag: string;
  keywords: string[];
  sitemapPriority: number;
}

export interface TrustSignal {
  icon: string;
  title: string;
  description: string;
}

export interface Milestone {
  year: number;
  event: string;
  description: string;
}

export interface ProductOntologyEntry {
  category: string;
  description: string;
  items: string[];
}

export interface BrandIdentity {
  name: string;
  tagline: string;
  taglineShort: string;
  description: string;
  foundingYear: number;
  categories: string[];
  ethos: string[];
  colors: { primary: string; accent: string };
  cta: { text: string; link: string };
  regions: RegionConfig[];
  brandStory: string;
  milestones: Milestone[];
  trustSignals: TrustSignal[];
  productOntology: ProductOntologyEntry[];
}

export interface BrandPageEntry {
  slug: string;
  title: string;
  region: string;
  category: 'guide' | 'comparison' | 'beginner' | 'gear' | 'brand' | 'product';
  cta: { text: string; link: string; reason: string };
  productSlugs: string[];
  brandKeywords: string[];
  geoEnabled: boolean;
}

export interface EngineStatus {
  name: string;
  description: string;
  active: boolean;
  pages: number;
  color: string;
}

const POOL_PRODUCT_IDS = ['rectangular-drop-stitch-pool', 'round-blue-drop-stitch-pool', 'round-grey-drop-stitch-pool'];

export const BRAND: BrandIdentity = {
  name: 'Inflatable Pool Factory',
  tagline: 'Inflatable Swimming Pools — Backyard Fun for the Whole Family',
  taglineShort: 'Inflatable Swimming Pools',
  description:
    'Inflatable Pool Factory designs drop-stitch inflatable swimming pools that set up in minutes, store flat in the off-season, and stand up to summers of family use.',
  foundingYear: 2012,
  categories: ['Rectangular Pools', 'Round Pools', 'Pool Accessories'],
  ethos: [
    'Drop-stitch construction — rigid walls at low air pressure',
    'Family-first — tested materials and stable, low-profile designs',
    'Effortless — quick setup, compact storage, no tools required',
  ],
  colors: { primary: '#003355', accent: '#0ea5e9' },
  cta: { text: 'Find your pool', link: '/products' },
  regions: [
    {
      locale: 'en',
      name: 'Global',
      flag: '🌐',
      keywords: ['inflatable swimming pool', 'drop-stitch pool', 'backyard pool'],
      sitemapPriority: 1.0,
    },
    {
      locale: 'fr',
      name: 'France',
      flag: '🇫🇷',
      keywords: ['piscine gonflable', 'piscine autoportante'],
      sitemapPriority: 0.7,
    },
    {
      locale: 'es',
      name: 'Spain',
      flag: '🇪🇸',
      keywords: ['piscina hinchable', 'piscina para jardin'],
      sitemapPriority: 0.7,
    },
  ],
  brandStory:
    'Inflatable Pool Factory began with a simple goal: make a backyard swimming pool that families could actually manage — no steel frames, no all-day setup, no permanent installation. Our drop-stitch inflatable pools combine the rigidity of a hard-sided pool with the convenience of an inflatable, so anyone can be swimming within minutes of unboxing. Every pool is built from reinforced, puncture-resistant material, tested for air retention, and backed by responsive customer support.',
  milestones: [
    {
      year: 2012,
      event: 'Founded',
      description: 'Inflatable Pool Factory established with a focus on outdoor family products.',
    },
    {
      year: 2018,
      event: 'Drop-Stitch Pool Line',
      description:
        'Launched the first drop-stitch inflatable pool, bringing hard-pool rigidity to an inflatable format.',
    },
    {
      year: 2022,
      event: 'Expanded Range',
      description: 'Added rectangular and round pool families covering small patios to large backyards.',
    },
    {
      year: 2024,
      event: 'Growing Community',
      description:
        'Thousands of families across multiple markets cooling off in an Inflatable Pool Factory pool each summer.',
    },
  ],
  trustSignals: [
    {
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Safety Tested',
      description:
        'Residential pool safety standards and design references are reviewed only where confirmed for the specific model and market.',
    },
    {
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Puncture-Resistant Material',
      description: 'Reinforced drop-stitch fabric tested for air retention and repeated seasonal use.',
    },
    {
      icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
      title: 'Fast, Tool-Free Setup',
      description: 'Inflate, fill, and swim — most pools are ready for water in under 30 minutes.',
    },
    {
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      title: 'Compact Off-Season Storage',
      description: 'Drain, dry, fold flat, and store in a closet or garage until next summer.',
    },
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Responsive Support',
      description:
        'Real people answering questions about setup, care, and accessories at info@inflatablepoolfactory.com.',
    },
  ],
  productOntology: [
    {
      category: 'Rectangular Pools',
      description: 'Drop-stitch rectangular inflatable pools with generous swim lanes for families.',
      items: ['Family Rectangular Pools', 'Large Swim Pools', 'Rectangular Pool Covers'],
    },
    {
      category: 'Round Pools',
      description: 'Round drop-stitch pools that fit smaller backyards and patios without sacrificing depth.',
      items: ['Round Family Pools', 'Round Patio Pools', 'Round Pool Covers'],
    },
    {
      category: 'Pool Accessories',
      description: 'Covers, ground sheets, repair kits, and replacement parts for Inflatable Pool Factory pools.',
      items: ['Pool Covers', 'Ground Sheets', 'Repair Kits', 'Air Valves'],
    },
  ],
};

const CTA_RULES: Array<{
  match: (slug: string) => boolean;
  cta: { text: string; link: string; reason: string };
  products: string[];
  keywords: string[];
}> = [
  {
    match: (s) => s.includes('why-drop-stitch-pools'),
    cta: {
      text: 'Shop drop-stitch pools',
      link: '/products',
      reason: 'Drop-stitch content — product category',
    },
    products: POOL_PRODUCT_IDS,
    keywords: ['drop-stitch', 'inflatable pool', 'rigidity'],
  },
  {
    match: (s) => s.includes('inflatable-pool-vs-steel-frame'),
    cta: { text: 'Compare our pools', link: '/products/compare', reason: 'Comparison — product comparison' },
    products: POOL_PRODUCT_IDS,
    keywords: ['inflatable pool', 'steel frame pool', 'comparison'],
  },
  {
    match: (s) => s.includes('inflatable-pool-water-care-basics'),
    cta: { text: 'Browse pool products', link: '/products', reason: 'Care guide — product discovery' },
    products: POOL_PRODUCT_IDS,
    keywords: ['pool care', 'water maintenance', 'cleaning'],
  },
];

export function getBrandEntry(slug: string, region = 'en'): BrandPageEntry | null {
  const record = contentV2Records.find((c) => c.slug === slug);
  if (!record) return null;

  for (const rule of CTA_RULES) {
    if (rule.match(slug)) {
      return {
        slug,
        title: record.title || slug,
        region,
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
        geoEnabled: true,
      };
    }
  }

  return {
    slug,
    title: record.title || slug,
    region,
    category: 'guide',
    cta: { text: 'Browse products', link: '/products', reason: 'Generic fallback CTA' },
    productSlugs: POOL_PRODUCT_IDS,
    brandKeywords: ['inflatable swimming pool', 'backyard pool'],
    geoEnabled: true,
  };
}

export function getConversion(slug: string): { entry: BrandPageEntry; products: typeof products } | null {
  const entry = getBrandEntry(slug);
  if (!entry) return null;
  return { entry, products: products.filter((p) => entry.productSlugs.includes(p.id)) };
}

export function getAllBrandPages(): BrandPageEntry[] {
  return contentV2Records
    .filter((c) => c.type === 'guide' || c.type === 'comparison')
    .map((c) => getBrandEntry(c.slug))
    .filter((e): e is BrandPageEntry => e !== null);
}

export function getEngines(): EngineStatus[] {
  const pages = getAllBrandPages();
  return [
    {
      name: 'SEO Engine',
      description: 'Traffic entry via pool care guides, comparisons, and buying advice across regions',
      active: true,
      pages: pages.filter((p) => p.category !== 'brand').length,
      color: 'sky',
    },
    {
      name: 'GEO Engine',
      description: 'AI-readable structured blocks (TLDR, Definition, Steps, FAQ) for ChatGPT, Perplexity, SGE',
      active: true,
      pages: pages.filter((p) => p.geoEnabled).length,
      color: 'purple',
    },
    {
      name: 'Brand Engine',
      description: 'Guide — Product conversion, brand memory, return search, global identity',
      active: true,
      pages: pages.filter((p) => p.category === 'brand').length + 1,
      color: 'green',
    },
  ];
}
