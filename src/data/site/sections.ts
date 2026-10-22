export interface SiteSection {
  label: string;
  path: string;
  sitemap?: { entity: string; type: string; priority: string };
}

export const SITE_SECTIONS: SiteSection[] = [
  { label: 'Home', path: '/', sitemap: { entity: 'Inflatable Pool Factory', type: 'brand', priority: '1.0' } },
  { label: 'Products', path: '/products', sitemap: { entity: 'products', type: 'product', priority: '0.9' } },
  { label: 'About', path: '/about', sitemap: { entity: 'about', type: 'brand', priority: '0.6' } },
  { label: 'FAQ', path: '/faq', sitemap: { entity: 'faq', type: 'support', priority: '0.6' } },
  { label: 'Contact', path: '/contact', sitemap: { entity: 'contact', type: 'service', priority: '0.5' } },
];
