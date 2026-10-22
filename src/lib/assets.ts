// Central asset base URL — all /images/* and /files/* references are served
// from the public R2 custom domain (NOT via the Worker / R2 binding) so they
// hit Cloudflare's cache rules. Override per-environment with ASSETS_BASE_URL.
export const ASSETS_BASE: string = (process.env.ASSETS_BASE_URL || 'https://assets.inflatablepoolfactory.com').replace(
  /\/+$/,
  ''
);

export function getAssetBase(): string {
  return ASSETS_BASE;
}

// Convert an image/file path into its public-domain absolute URL.
// Already-absolute URLs and protocol-relative URLs are returned unchanged.
export function assetUrl(input?: string | null): string {
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  if (/^\/\//.test(input)) return input;
  const path = input.startsWith('/') ? input : '/' + input;
  return ASSETS_BASE + path;
}
