import type { APIRoute } from 'astro';
import { SITE } from 'astrowind:config';

export const prerender = true;

export const GET: APIRoute = async () => {
  const siteUrl = String(SITE.site).replace(/\/+$/, '');
  const manifest = {
    name: 'Inflatable Pool Factory',
    short_name: 'Pool Factory',
    description:
      'Premium drop stitch inflatable swimming pools by Inflatable Pool Factory. Rigid walls, fast setup, easy winter storage.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0284c7',
    icons: [
      { src: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
    categories: ['lifestyle', 'shopping', 'sports'],
    lang: 'en',
    scope: '/',
    id: siteUrl,
    prefer_related_applications: false,
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
