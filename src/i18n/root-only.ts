export const ROOT_ONLY_ROUTES = [
  '/internal',
  '/login',
  '/ai-context',
  '/factory/tour',
  '/register',
  '/404',
  // EN-only utility pages with no localized variants — hreflang alternates and
  // language-switcher links for them would be dead URLs.
  '/products/specs',
  '/products/compare',
  '/request-quotation',
  '/ai-answer-center',
  // EN-only marketing, B2B and content routes — these have no [lang] variants,
  // so localized hreflang and language-switcher links would 404.
  '/commercial-pools',
  '/find-your-pool',
  '/for-businesses',
  '/guides',
  '/manufacturing',
  '/news',
  '/oem-odm',
  '/pool-ideas',
  '/private-label',
  '/quality-control',
  '/wholesale',
  '/admin',
];

export function isRootOnlyRoute(pathWithoutLang: string): boolean {
  return ROOT_ONLY_ROUTES.some((p) => pathWithoutLang === p || pathWithoutLang.startsWith(p + '/'));
}
