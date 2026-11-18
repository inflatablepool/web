import { SITE } from 'astrowind:config';

const siteUrl = String(SITE.site).replace(/\/+$/, '');

export interface BusinessEntity {
  id: string;
  type: 'BusinessAudience' | 'Service' | 'Product';
  name: string;
  description: string;
  url: string;
  sameAs?: string[];
  audience?: string[];
  offers?: string[];
}

export const businessEntities: BusinessEntity[] = [
  {
    id: `${siteUrl}/#families`,
    type: 'BusinessAudience',
    name: 'Families & Homeowners',
    description:
      'Families and homeowners who want a durable, easy-to-store inflatable swimming pool for backyard summer fun.',
    url: `${siteUrl}/products`,
    sameAs: [],
    audience: ['Parents', 'Homeowners'],
    offers: ['Inflatable Swimming Pools', 'Pool Covers', 'Accessories'],
  },
  {
    id: `${siteUrl}/#businesses`,
    type: 'BusinessAudience',
    name: 'Retailers & Pool Businesses',
    description:
      'Retailers, pool dealers, and e-commerce sellers who need factory-direct inflatable pool supply with OEM support.',
    url: `${siteUrl}/contact`,
    sameAs: [],
    audience: ['Pool Retailers', 'E-commerce Sellers', 'Distributors'],
    offers: ['Wholesale Pricing', 'OEM / ODM', 'Custom Branding', 'Bulk Orders'],
  },
  {
    id: `${siteUrl}/#oem-partners`,
    type: 'Service',
    name: 'OEM / ODM Pool Manufacturing',
    description:
      'Custom inflatable pool manufacturing: custom sizes, colors, covers, logos, and packaging from our own factory.',
    url: `${siteUrl}/contact`,
    audience: ['Brand Owners', 'Importers'],
    offers: ['Custom Sizes', 'Custom Colors', 'Private Label', 'Custom Packaging'],
  },
];

export const productToBusinessMap: Record<string, string[]> = {
  'rectangular-drop-stitch-pool': [`${siteUrl}/#families`, `${siteUrl}/#businesses`],
  'round-blue-drop-stitch-pool': [`${siteUrl}/#families`, `${siteUrl}/#businesses`],
};

export function getBusinessEntityJsonLd(entityId: string): Record<string, unknown> | null {
  const entity = businessEntities.find((e) => e.id === entityId);
  if (!entity) return null;
  return {
    '@type': entity.type === 'BusinessAudience' ? 'Audience' : 'Service',
    '@id': entity.id,
    name: entity.name,
    description: entity.description,
    url: entity.url,
    ...(entity.audience?.length ? { audience: entity.audience } : {}),
    ...(entity.offers?.length ? { offers: entity.offers } : {}),
  };
}

export function getProductMentionsJsonLd(productId: string): Record<string, unknown>[] {
  const entityIds = productToBusinessMap[productId];
  if (!entityIds) return [];
  return entityIds.map((id) => getBusinessEntityJsonLd(id)).filter(Boolean) as Record<string, unknown>[];
}

export function getHomepageEntityGraphJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: SITE.name,
        url: siteUrl,
        makesOffer: businessEntities.map((e) => ({
          '@type': 'Offer',
          itemOffered: { '@id': e.id },
        })),
      },
      ...businessEntities.map((e) => getBusinessEntityJsonLd(e.id)).filter(Boolean),
    ],
  };
}
