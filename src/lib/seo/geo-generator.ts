import type { ContentV2Record } from '~/data/content-v2';

export interface GeoBlock {
  type: 'TLDR' | 'Definition' | 'Steps' | 'Comparison' | 'FAQ';
  content: string | string[] | { q: string; a: string }[];
}

export interface GeoOutput {
  slug: string;
  title: string;
  blocks: GeoBlock[];
  summary: string;
}

const DEFINITIONS: Record<string, string> = {
  'why-drop-stitch-pools':
    'Drop-stitch construction joins two layers of reinforced PVC fabric with thousands of internal threads, letting an inflatable pool hold a rigid, flat-walled shape at low air pressure. The result is a pool that feels solid like a hard-sided pool yet folds flat for storage.',
  'inflatable-pool-vs-steel-frame':
    'Inflatable drop-stitch pools set up in minutes without tools and store flat in the off-season, while steel-frame pools take longer to assemble, are permanent seasonal fixtures, and require more maintenance of their frame components.',
  'inflatable-pool-water-care-basics':
    'Inflatable pool water care keeps water safe and clear through filtration or circulation, regular sanitizing (chlorine or alternatives), pH balancing (7.2–7.6), debris removal with a net or cover, and periodic full water changes.',
};

const QUESTIONS: Record<string, { q: string; a: string }[]> = {
  'why-drop-stitch-pools': [
    {
      q: 'How rigid is a drop-stitch inflatable pool?',
      a: 'The internal thread structure keeps walls and floor flat and firm under water pressure, so the pool holds its shape like a hard-sided pool.',
    },
    {
      q: 'How long does a drop-stitch pool last?',
      a: 'With proper care — a ground sheet, a cover, and correct storage — a quality drop-stitch pool lasts many summers of regular family use.',
    },
    {
      q: 'How fast can I set up an inflatable pool?',
      a: 'Most Inflatable Pool Factory pools inflate in 10–20 minutes with an electric pump and are ready to fill immediately after.',
    },
  ],
  'inflatable-pool-vs-steel-frame': [
    {
      q: 'Is an inflatable pool easier to set up than a steel-frame pool?',
      a: 'Yes. A drop-stitch inflatable pool needs only inflation, while a steel-frame pool requires assembling poles, liners, and hardware.',
    },
    {
      q: 'Which pool is easier to store for winter?',
      a: 'Inflatable pools drain, dry, and fold into a compact box; steel-frame pools must be disassembled part by part.',
    },
    {
      q: 'Which pool is safer for small children?',
      a: 'Inflatable pools have soft, low walls without exposed metal poles, and all pools should be supervised and fenced per local safety guidance.',
    },
  ],
  'inflatable-pool-water-care-basics': [
    {
      q: 'How often should I change inflatable pool water?',
      a: 'Small pools without filtration should be refreshed every few days; larger treated pools can go weeks with proper sanitizing and pH control.',
    },
    {
      q: 'What pH should pool water be?',
      a: 'Keep pH between 7.2 and 7.6 so sanitizer works effectively and water stays comfortable for skin and eyes.',
    },
    {
      q: 'How do I keep debris out of my pool?',
      a: 'Use a fitted cover whenever the pool is not in use and skim leaves and insects with a net before each swim.',
    },
  ],
};

const STEPS: Record<string, string[]> = {
  'why-drop-stitch-pools': [
    'Choose a pool size that fits your backyard and family',
    'Lay a ground sheet on flat, debris-free ground',
    'Inflate with an electric pump until walls are firm',
    'Fill with water and check that the pool sits level',
    'Cover when not in use to keep water clean',
  ],
  'inflatable-pool-vs-steel-frame': [
    'Compare setup time: minutes for inflatable vs hours for steel frame',
    'Consider storage: inflatables fold flat, frames need full disassembly',
    'Check your ground: both types need firm, level ground',
    'Factor in safety: soft walls vs exposed metal poles',
    'Pick the format that matches how often you will move or store it',
  ],
  'inflatable-pool-water-care-basics': [
    'Test water every 1–2 days with test strips',
    'Keep pH between 7.2 and 7.6',
    'Sanitize with chlorine or an approved alternative',
    'Skim debris daily and use a cover between swims',
    'Drain, clean, and dry the pool before seasonal storage',
  ],
};

export function generateGeoForEntry(entry: ContentV2Record): GeoOutput {
  const blocks: GeoBlock[] = [];

  blocks.push({
    type: 'TLDR',
    content:
      entry.tldr ||
      `This page explains ${entry.slug.replace(/-/g, ' ')} for inflatable swimming pool buyers and families.`,
  });

  blocks.push({
    type: 'Definition',
    content:
      DEFINITIONS[entry.slug] ||
      `${entry.slug.replace(/-/g, ' ')} is a key concept in choosing and caring for an inflatable backyard pool.`,
  });

  const steps = STEPS[entry.slug] || [
    'Understand the core concept',
    'Match the pool to your backyard and family size',
    'Set up on flat, clear ground',
    'Follow a simple water care routine',
    'Store correctly at the end of the season',
  ];
  blocks.push({ type: 'Steps', content: steps });

  if (entry.category === 'comparison') {
    blocks.push({
      type: 'Comparison',
      content: `${entry.title.replace(/\(.*?\)/, '').trim()} — this comparison helps you decide based on your backyard, budget, and storage needs.`,
    });
  }

  const faqs = QUESTIONS[entry.slug] || entry.faq.slice(0, 3);
  if (faqs.length > 0) {
    blocks.push({ type: 'FAQ', content: faqs.slice(0, 3) });
  }

  return {
    slug: entry.slug,
    title: entry.title,
    blocks,
    summary: `${entry.slug.replace(/-/g, ' ')} — complete GEO-ready structured content with TLDR, Definition, Steps, and FAQ.`,
  };
}

export function generateGeoForSlug(slug: string): GeoOutput {
  return {
    slug,
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    blocks: [
      {
        type: 'TLDR',
        content: `This page explains ${slug.replace(/-/g, ' ')} for inflatable swimming pool buyers and families.`,
      },
      {
        type: 'Definition',
        content:
          DEFINITIONS[slug] || `${slug.replace(/-/g, ' ')} is a key topic in inflatable backyard pools and water care.`,
      },
      {
        type: 'Steps',
        content: STEPS[slug] || [
          'Understand the concept',
          'Assess your backyard space',
          'Choose the right pool size',
          'Follow setup and care instructions',
          'Learn more from related guides',
        ],
      },
      {
        type: 'FAQ',
        content: QUESTIONS[slug] || [
          {
            q: 'Why is this important?',
            a: 'Understanding this helps you choose and care for an inflatable pool with confidence.',
          },
        ],
      },
    ],
    summary: `${slug.replace(/-/g, ' ')} — GEO-ready content`,
  };
}

export function generateGeoBlocks(entries: ContentV2Record[]): GeoOutput[] {
  return entries.map(generateGeoForEntry);
}
