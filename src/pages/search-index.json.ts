import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import * as yaml from 'js-yaml';
import { toAssetUrl } from '~/utils/images';
import { procurementGuides, GUIDE_CLUSTER_LABELS } from '~/data/procurement-guides';

export const prerender = true;

const SITE = '';

const LANGUAGES = ['en', 'fr', 'de', 'es', 'pt', 'ar', 'it', 'ru', 'pl', 'nl', 'sv', 'no', 'el', 'fi', 'da'];

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(s: string, n = 140): string {
  s = String(s || '').trim();
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trim() + '...';
}

function plainText(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(plainText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(plainText).join(' ');
  return String(value);
}

// English YAML pages
const enPageModules: Record<string, string> = import.meta.glob('/src/data/pages/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Per-language YAML pages — eagerly loaded at build time for all 14 non-English locales.
// Each locale requires a separate static import.meta.glob() call (Vite limitation).
const localePageModules: Record<string, Record<string, string>> = {};
const lpm = (m: Record<string, string>) => m;
localePageModules.fr = lpm(
  import.meta.glob('/src/data/pages/fr/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.de = lpm(
  import.meta.glob('/src/data/pages/de/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.es = lpm(
  import.meta.glob('/src/data/pages/es/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.pt = lpm(
  import.meta.glob('/src/data/pages/pt/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.ar = lpm(
  import.meta.glob('/src/data/pages/ar/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.it = lpm(
  import.meta.glob('/src/data/pages/it/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.ru = lpm(
  import.meta.glob('/src/data/pages/ru/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.pl = lpm(
  import.meta.glob('/src/data/pages/pl/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.nl = lpm(
  import.meta.glob('/src/data/pages/nl/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.sv = lpm(
  import.meta.glob('/src/data/pages/sv/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.no = lpm(
  import.meta.glob('/src/data/pages/no/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.el = lpm(
  import.meta.glob('/src/data/pages/el/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.fi = lpm(
  import.meta.glob('/src/data/pages/fi/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);
localePageModules.da = lpm(
  import.meta.glob('/src/data/pages/da/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
);

export const GET: APIRoute = async () => {
  const items: any[] = [];

  // Blog posts moved to the D1-backed news worker — live news entries are
  // merged in at runtime from /news/search-index.json by the search consumers.

  // Products (English-only — no per-language variants)
  try {
    const products = await getCollection('product');
    for (const product of products) {
      if (product.data.draft) continue;
      const body = product.body || '';
      const fm: any = product.data;
      const price = fm.price || {};
      items.push({
        title: fm.title || 'Untitled',
        url: `${SITE}/products/${product.id.replace(/\.(md|mdx)$/i, '')}`,
        excerpt: excerpt(fm.excerpt || fm.summary || fm.description || stripHtml(body)),
        type: 'product',
        image: toAssetUrl(fm.image) || '',
        price: price.amount || '',
        currency: price.currency || 'USD',
        tags: fm.tags || [fm.category].filter(Boolean),
        lang: 'en',
      });
    }
  } catch {
    /* noop */
  }

  // Per-language page YAML files
  for (const lang of LANGUAGES) {
    const modules = lang === 'en' ? enPageModules : localePageModules[lang];

    for (const [modulePath, raw] of Object.entries(modules)) {
      let data: any = {};
      if (raw) {
        try {
          data = yaml.load(raw) || {};
        } catch {
          continue;
        }
      }

      const slug = modulePath
        .replace(/^\/src\/data\/pages\//, '')
        .replace(/\.yaml$/, '')
        .replace(/^[a-z]{2}\//, '');

      const heroKey = slug === 'home' || slug === 'about' ? 'hero' : slug === 'contact' ? 'hero_text' : 'hero';
      const hero = data[heroKey] || {};
      const sectionTitles: string[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (k === heroKey) continue;
        const t = (v as any)?.title;
        if (typeof t === 'string') sectionTitles.push(t);
      }

      const url =
        slug === 'home'
          ? lang === 'en'
            ? `${SITE}/`
            : `${SITE}/${lang}/`
          : lang === 'en'
            ? `${SITE}/${slug}`
            : `${SITE}/${lang}/${slug}`;

      const title =
        typeof hero?.title === 'string' ? stripHtml(hero.title) : slug.charAt(0).toUpperCase() + slug.slice(1);

      items.push({
        title,
        url,
        excerpt: excerpt(plainText(hero?.subtitle || hero?.content || sectionTitles.join(' '))),
        type: 'page',
        tags: [slug, ...sectionTitles].slice(0, 6),
        lang,
      });
    }
  }

  // Root-only EN pages (no per-language YAML page data) — keep site search complete.
  const staticPages = [
    {
      title: 'Inflatable Pool Manufacturing & Inspection Process',
      url: '/manufacturing',
      excerpt:
        'Five-step drop-stitch pool production in Qingdao — CNC cutting, valve sealing, panel welding, finishing and pressure testing — plus published destructive-test evidence.',
      tags: ['manufacturing', 'factory', 'quality', 'process'],
    },
    {
      title: 'Quality Control & Testing Framework',
      url: '/quality-control',
      excerpt:
        'QC checkpoints across production: pressure and leak testing, valve and seam verification, dimensional control and packing checks, with test criteria confirmed per specification.',
      tags: ['quality-control', 'testing', 'inspection'],
    },
    {
      title: 'How We Break Pools on Purpose: the Destructive Testing SOP',
      url: '/quality-control/destructive-testing',
      excerpt:
        'The controlled QMS destructive-testing procedure WI-QC-DS-2026-001: material peel and puncture tests, 55°C creep, step-up burst, 72-hour water overload, impact and valve destruction, with a 48-hour CAPA loop.',
      tags: ['destructive-testing', 'sop', 'quality-control', 'testing'],
    },
    {
      title: 'Destructive Test Results: 8/8 PASS on the FB-DSP-400 Type Test',
      url: '/quality-control/destructive-testing/results',
      excerpt:
        'Campaign RPT-FB-QC-20261113: 8 of 8 destructive items passed — 136.5–149.4 N/5cm peel, 25.4 PSI burst (3.18× rated pressure), 72-hour overload at 5.6°, 500 impacts with zero leaks — with four signed PDF reports.',
      tags: ['test-results', 'destructive-testing', 'quality-control', 'reports'],
    },
    {
      title: 'OEM / ODM Inflatable Pool Manufacturing',
      url: '/oem-odm',
      excerpt:
        'Custom inflatable pool manufacturing — sizes, colors, logo printing, packaging and first-article qualification for private brands.',
      tags: ['oem', 'odm', 'custom'],
    },
    {
      title: 'Private Label Inflatable Pools',
      url: '/private-label',
      excerpt: 'Launch your own pool brand with proven drop-stitch designs, packaging and documentation.',
      tags: ['private-label', 'branding'],
    },
    {
      title: 'Wholesale Program',
      url: '/wholesale',
      excerpt: 'Factory-direct wholesale reference pricing FOB Qingdao; quantity terms confirmed in the quotation.',
      tags: ['wholesale', 'pricing'],
    },
    {
      title: 'Commercial Pools',
      url: '/commercial-pools',
      excerpt: 'Event-scale and commercial inflatable pool solutions.',
      tags: ['commercial', 'projects'],
    },
    {
      title: 'For Businesses',
      url: '/for-businesses',
      excerpt: 'B2B buying paths for importers, distributors, retailers and hospitality projects.',
      tags: ['b2b', 'business'],
    },
    {
      title: 'Inflatable Pool Sample Request',
      url: '/sample-request',
      excerpt:
        'Request a drop-stitch pool or SPA sample for market evaluation; sample quantity, charges, courier and timing are confirmed in the quotation.',
      tags: ['sample', 'b2b', 'evaluation'],
    },
    {
      title: 'Find Your Pool',
      url: '/find-your-pool',
      excerpt: 'Match a pool size and wall type to your use case.',
      tags: ['finder', 'products'],
    },
    {
      title: 'Pool Specs & FOB Price List',
      url: '/products/specs',
      excerpt:
        'Full SKU specifications, FOB Qingdao prices, pressure guidance and ordering rules, with links to the published destructive-test results.',
      tags: ['specs', 'prices', 'pressure'],
    },
    {
      title: 'Product Comparison',
      url: '/products/compare',
      excerpt: 'Compare drop-stitch pool models side by side.',
      tags: ['compare', 'products'],
    },
  ] as const;

  for (const p of staticPages) {
    const url = `${SITE}${p.url}`;
    if (items.some((i) => i.url === url)) continue;
    items.push({
      title: p.title,
      url,
      excerpt: excerpt(p.excerpt),
      type: 'page',
      tags: [...p.tags],
      lang: 'en',
    });
  }

  // EN-only procurement guides (src/data/procurement-guides.ts) — the YAML scan
  // above never sees these.
  for (const g of procurementGuides) {
    const url = `${SITE}/guides/${g.slug}`;
    if (items.some((i) => i.url === url)) continue;
    items.push({
      title: g.title,
      url,
      excerpt: excerpt(g.description || g.tldr || ''),
      type: 'page',
      tags: ['guides', g.cluster, GUIDE_CLUSTER_LABELS[g.cluster]].slice(0, 4),
      lang: 'en',
    });
  }

  return new Response(JSON.stringify(items), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
