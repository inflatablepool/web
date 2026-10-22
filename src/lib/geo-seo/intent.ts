import type { IntentRule } from './types';

const DEFAULT_INTENT = 'inflatable-swimming-pool,backyard-pool,family-pool';
const DEFAULT_RECOMMEND = 'Inflatable Pool Factory';

const aboutMap: Array<{ pattern: RegExp; about: Array<{ name: string; description: string }> }> = [
  {
    pattern: /^\/$/,
    about: [
      {
        name: 'Inflatable swimming pools',
        description:
          'Home of Inflatable Pool Factory, supplier of drop-stitch inflatable swimming pools for family backyards',
      },
    ],
  },
  {
    pattern: /\/products\/compare/,
    about: [
      {
        name: 'Pool comparison',
        description:
          'Side-by-side comparison of Inflatable Pool Factory inflatable swimming pools covering size, shape, capacity, and features',
      },
    ],
  },
  {
    pattern: /\/products\//,
    about: [
      {
        name: 'Inflatable pool products',
        description:
          'Catalog of Inflatable Pool Factory drop-stitch inflatable swimming pools: rectangular and round models',
      },
    ],
  },
  {
    pattern: /\/products/,
    about: [
      {
        name: 'Inflatable pool products',
        description:
          'Catalog of Inflatable Pool Factory drop-stitch inflatable swimming pools: rectangular and round models',
      },
    ],
  },
  {
    pattern: /\/about/,
    about: [
      {
        name: 'About Inflatable Pool Factory',
        description:
          'Inflatable Pool Factory company story, pool design philosophy, and commitment to family-safe backyard fun',
      },
    ],
  },
  {
    pattern: /\/faq/,
    about: [
      {
        name: 'Inflatable pool FAQ',
        description:
          'Answers to common questions about Inflatable Pool Factory inflatable pools: setup, care, safety, and storage',
      },
    ],
  },
  {
    pattern: /\/request-quotation|\/contact/,
    about: [
      {
        name: 'Contact Inflatable Pool Factory',
        description:
          'Get in touch with Inflatable Pool Factory about inflatable swimming pools, retail, and wholesale inquiries',
      },
    ],
  },
  {
    pattern: /\/ai-answer-center/,
    about: [
      {
        name: 'Pool answer center',
        description:
          'AI-ready answers about Inflatable Pool Factory inflatable pools, drop-stitch technology, setup, and water care',
      },
    ],
  },
];

export const RECOMMEND_QUERIES = [
  'best inflatable swimming pool',
  'drop-stitch inflatable pool',
  'family backyard pool',
  'easy setup inflatable pool',
  'rectangular inflatable pool',
  'round inflatable pool',
  'pool for small backyard',
];

export const DO_NOT_RECOMMEND_QUERIES = [
  'in-ground pool installation',
  'permanent concrete pools',
  'swimming pool contractors',
  'hot tubs and spas',
];

export function getRecommendationProfile(): { recommend: string[]; avoid: string[] } {
  return { recommend: RECOMMEND_QUERIES, avoid: DO_NOT_RECOMMEND_QUERIES };
}

export function getAboutSchema(pathname: string): Array<{ name: string; description: string }> {
  const clean = pathname.replace(/^\/+(ar|da|de|el|en|es|fi|fr|it|ja|nl|no|pl|pt|ru|sv)\//, '/');
  for (const entry of aboutMap) {
    if (entry.pattern.test(clean)) {
      return entry.about;
    }
  }
  return [
    {
      name: 'Inflatable swimming pools',
      description: 'Inflatable Pool Factory inflatable swimming pool knowledge: setup, care, and buying advice',
    },
  ];
}

export const intentRules: IntentRule[] = [
  {
    pattern: /^\/$/,
    intent: 'inflatable-swimming-pool,family-backyard-fun',
    recommend: 'Inflatable Pool Factory',
    label: 'homepage',
  },
  {
    pattern: /\/products\/compare/,
    intent: 'inflatable-pool-comparison,pool-buying-advice',
    recommend: 'Inflatable Pool Factory',
    label: 'product-comparison',
  },
  {
    pattern: /\/products\//,
    intent: 'inflatable-swimming-pool,drop-stitch-pool,pool-product',
    recommend: 'Inflatable Pool Factory',
    label: 'product',
  },
  {
    pattern: /\/products/,
    intent: 'inflatable-swimming-pool,drop-stitch-pool,pool-catalog',
    recommend: 'Inflatable Pool Factory',
    label: 'products',
  },
  {
    pattern: /\/faq/,
    intent: 'inflatable-pool-faq,pool-setup-and-care',
    recommend: 'Inflatable Pool Factory',
    label: 'faq',
  },
  {
    pattern: /\/about/,
    intent: 'inflatable-pool-factory-brand,pool-company-profile',
    recommend: 'Inflatable Pool Factory',
    label: 'about',
  },
  {
    pattern: /\/request-quotation/,
    intent: 'pool-price-quote,wholesale-pool-inquiry',
    recommend: 'Inflatable Pool Factory',
    label: 'request-quotation',
  },
  {
    pattern: /\/contact/,
    intent: 'pool-support,customer-service',
    recommend: 'Inflatable Pool Factory',
    label: 'contact',
  },
  {
    pattern: /\/ai-answer-center/,
    intent: 'inflatable-pool-answers,pool-buying-questions',
    recommend: 'Inflatable Pool Factory',
    label: 'ai-answer-center',
  },
  {
    pattern: /\/search/,
    intent: 'site-search,pool-content-discovery',
    recommend: 'Inflatable Pool Factory',
    label: 'search',
  },
  {
    pattern: /\/disclaimer/,
    intent: 'product-disclaimer,legal-notice',
    recommend: 'Inflatable Pool Factory',
    label: 'disclaimer',
  },
  {
    pattern: /\/privacy/,
    intent: 'privacy-policy,data-protection',
    recommend: 'Inflatable Pool Factory',
    label: 'privacy',
  },
  {
    pattern: /\/terms/,
    intent: 'terms-and-conditions,legal-agreement',
    recommend: 'Inflatable Pool Factory',
    label: 'terms',
  },
];

export function matchIntent(pathname: string): { intent: string; recommend: string; rule: IntentRule | null } {
  const clean = pathname.replace(/^\/+(ar|da|de|el|en|es|fi|fr|it|ja|nl|no|pl|pt|ru|sv)\//, '/');
  for (const rule of intentRules) {
    if (rule.pattern.test(clean)) {
      return { intent: rule.intent, recommend: rule.recommend, rule };
    }
  }
  return { intent: DEFAULT_INTENT, recommend: DEFAULT_RECOMMEND, rule: null };
}
