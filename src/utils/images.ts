import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { MetaDataOpenGraph } from '~/types';
import imageDimensions from '~/data/site/image-dimensions.json';

// Lazy-loaded glob of local images. The glob runs once and is cached.
let _localImages: Record<string, () => Promise<unknown>> | undefined;

const loadLocalImages = () => {
  if (_localImages) return _localImages;
  try {
    _localImages = import.meta.glob(
      '~/assets/images/**/*.{jpeg,jpg,png,tiff,webp,gif,svg,JPEG,JPG,PNG,TIFF,WEBP,GIF,SVG}'
    );
  } catch {
    _localImages = {};
  }
  return _localImages;
};

/**
 * Resolve an image reference to either ImageMetadata (local) or a string URL (remote/public).
 * Accepts:
 *   - `null` / `undefined`         → returned as-is
 *   - `ImageMetadata`              → returned as-is (already imported)
 *   - `"http(s)://…"` or `"/path"` → returned as-is (external or public/)
 *   - `"~/assets/images/…"`        → resolved to its ImageMetadata via the glob
 */
export const findImage = async (
  imagePath?: string | ImageMetadata | null
): Promise<string | ImageMetadata | undefined | null> => {
  if (typeof imagePath !== 'string') return imagePath;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/'))
    return imagePath;
  if (!imagePath.startsWith('~/assets/images')) return imagePath;

  const images = loadLocalImages();
  const key = imagePath.replace('~/', '/src/');
  const loader = images[key];

  if (typeof loader !== 'function') return null;
  return ((await loader()) as { default: ImageMetadata }).default;
};

const isRemoteUrl = (src: unknown): src is string =>
  typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'));

const OG_WIDTH = 1200;
const OG_HEIGHT = 626;
export const ASSET_BASE = 'https://assets.inflatablepoolfactory.com';

const ASSET_URL_PREFIXES = ['/images/', '/files/'];

/**
 * Rewrite an asset path to its served location. Public-folder files are
 * uploaded to the R2 bucket in CI and served from the assets host; linking
 * there directly avoids the apex 301 hop on first visit.
 */
export const toAssetUrl = (src?: string | null): string | undefined => {
  if (!src) return src ?? undefined;
  if (!ASSET_URL_PREFIXES.some((p) => src === p || src.startsWith(p))) return src;
  return `${ASSET_BASE}${src}`;
};

/**
 * Adapt OpenGraph images to absolute, optimized URLs.
 * Used by Metadata.astro to produce social-card-ready URLs.
 */
export const adaptOpenGraphImages = async (
  openGraph: MetaDataOpenGraph = {},
  astroSite: URL | undefined = new URL('')
): Promise<MetaDataOpenGraph> => {
  if (!openGraph?.images?.length) return openGraph;

  const adaptedImages = await Promise.all(
    openGraph.images.map(async (image) => {
      if (!image?.url) return { url: '' };

      const resolved = await findImage(image.url);
      if (!resolved) return { url: '' };

      // Public assets (`/images/...`) are served from the R2 asset host and
      // cannot be transformed by astro:assets. Link them directly and report
      // their real dimensions from the build-time registry.
      if (typeof resolved === 'string' && resolved.startsWith('/')) {
        const dims = (imageDimensions as Record<string, { w: number; h: number }>)[resolved];
        return {
          url: toAssetUrl(resolved) ?? resolved,
          width: dims?.w || image.width || OG_WIDTH,
          height: dims?.h || image.height || OG_HEIGHT,
        };
      }

      // For remote URLs, use as-is. For local images, generate optimized JPG.
      if (isRemoteUrl(resolved)) {
        return {
          url: String(new URL(resolved, astroSite)),
          width: OG_WIDTH,
          height: OG_HEIGHT,
        };
      }

      const optimized = await getImage({
        src: resolved,
        width: OG_WIDTH,
        height: OG_HEIGHT,
        format: 'jpg',
      });

      return {
        url: String(new URL(optimized.src, astroSite)),
        width: Number(optimized.attributes.width) || OG_WIDTH,
        height: Number(optimized.attributes.height) || OG_HEIGHT,
      };
    })
  );

  return { ...openGraph, images: adaptedImages };
};
