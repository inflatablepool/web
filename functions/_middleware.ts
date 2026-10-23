const LANGUAGES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  it: 'Italiano',
  ru: 'Русский',
  pl: 'Polski',
  nl: 'Nederlands',
  sv: 'Svenska',
  no: 'Norsk',
  el: 'Ελληνικά',
  fi: 'Suomi',
  da: 'Dansk',
  cs: 'Čeština',
  th: 'ไทย',
  hr: 'Hrvatski',
  tl: 'Filipino',
  hu: 'Magyar',
  ro: 'Română',
  sk: 'Slovenčina',
  bg: 'Български',
  sl: 'Slovenščina',
  sr: 'Srpski',
  tr: 'Türkçe',
  id: 'Bahasa Indonesia',
  he: 'עברית',
  ms: 'Bahasa Melayu',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  et: 'Eesti',
};

const DEFAULT_LANG = 'en';

const REMOVED_LOCALES = ['zh', 'vi', 'hi', 'ja', 'ko'];

const LOCALE_MAP: Record<string, string> = {
  FR: 'fr',
  DE: 'de',
  ES: 'es',
  PT: 'pt',
  BR: 'pt',
  IT: 'it',
  PL: 'pl',
  RU: 'ru',
  SA: 'ar',
  AE: 'ar',
  EG: 'ar',
  NL: 'nl',
  SE: 'sv',
  NO: 'no',
  GR: 'el',
  FI: 'fi',
  DK: 'da',
  CZ: 'cs',
  TH: 'th',
  HR: 'hr',
  PH: 'tl',
  HU: 'hu',
  RO: 'ro',
  SK: 'sk',
  BG: 'bg',
  SI: 'sl',
  RS: 'sr',
  TR: 'tr',
  ID: 'id',
  IL: 'he',
  MY: 'ms',
  LT: 'lt',
  LV: 'lv',
  EE: 'et',
};

const ACCEPT_LANG_MAP: Record<string, string> = {
  fr: 'fr',
  de: 'de',
  es: 'es',
  pt: 'pt',
  it: 'it',
  pl: 'pl',
  ru: 'ru',
  ar: 'ar',
  nl: 'nl',
  sv: 'sv',
  no: 'no',
  el: 'el',
  fi: 'fi',
  da: 'da',
  cs: 'cs',
  th: 'th',
  hr: 'hr',
  tl: 'tl',
  hu: 'hu',
  ro: 'ro',
  sk: 'sk',
  bg: 'bg',
  sl: 'sl',
  sr: 'sr',
  tr: 'tr',
  id: 'id',
  he: 'he',
  ms: 'ms',
  lt: 'lt',
  lv: 'lv',
  et: 'et',
  fil: 'tl',
  iw: 'he',
  in: 'id',
};

const ASSETS_BASE = 'https://assets.inflatablepoolfactory.com';
const APEX_HOST = 'inflatablepoolfactory.com';
const WWW_HOST = `www.${APEX_HOST}`;
const I18N_EXCLUDED = [
  '/api',
  '/keystatic',
  '/admin',
  '/login',
  '/internal',
  '/images',
  '/assets',
  '/favicon',
  '/llms',
];
const ASSET_PREFIXES = ['/images', '/files'];

function hasExtension(url: string): boolean {
  return /\.[a-z0-9]+(\?.*)?$/i.test(url);
}

function shouldSkipI18n(url: string): boolean {
  if (hasExtension(url)) return true;
  return I18N_EXCLUDED.some((p) => url === p || url.startsWith(p + '/'));
}

function shouldRedirectToR2(url: string): boolean {
  return ASSET_PREFIXES.some((p) => url === p || url.startsWith(p + '/'));
}

function detectLocale(request: Request): string {
  const cookie = request.headers.get('cookie') || '';
  const cookieMatch = cookie.match(/(?:^|;\s*)x-user-locale=([a-z]{2})(?:;|$)/);
  if (cookieMatch && LANGUAGES[cookieMatch[1]]) return cookieMatch[1];

  const country = request.headers.get('cf-ipcountry');
  if (country && LOCALE_MAP[country]) return LOCALE_MAP[country];

  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    const tags = acceptLang.split(',').map((t) => {
      const parts = t.trim().split(';q=');
      return { lang: parts[0].split('-')[0], q: parseFloat(parts[1]) || 1 };
    });
    tags.sort((a, b) => b.q - a.q);
    for (const t of tags) {
      if (ACCEPT_LANG_MAP[t.lang]) return ACCEPT_LANG_MAP[t.lang];
    }
  }

  return DEFAULT_LANG;
}

function setSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const onRequest: (...args: any[]) => any = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Canonical host: keep a single 301 hop and preserve path + query string.
  if (url.hostname === WWW_HOST) {
    return setSecurityHeaders(Response.redirect(`https://${APEX_HOST}${pathname}${url.search}`, 301));
  }

  if (shouldRedirectToR2(pathname)) {
    return setSecurityHeaders(Response.redirect(ASSETS_BASE + pathname, 301));
  }

  if (shouldSkipI18n(pathname)) {
    return setSecurityHeaders(await next());
  }

  const pathLang = pathname.split('/')[1]?.split('?')[0] || '';
  const hasLangPrefix = pathLang in LANGUAGES;

  if (REMOVED_LOCALES.includes(pathLang)) {
    const rest = pathname.slice(pathLang.length + 1);
    const dest = rest === '' || rest === '/' ? '/' : `/${rest.replace(/^\/+/, '')}`;
    return setSecurityHeaders(Response.redirect(url.origin + dest + url.search, 301));
  }

  if (hasLangPrefix && pathLang === DEFAULT_LANG) {
    if (pathname === `/${DEFAULT_LANG}` || pathname === `/${DEFAULT_LANG}/`) {
      return setSecurityHeaders(Response.redirect(url.origin + '/' + url.search, 308));
    }
  }

  if (!hasLangPrefix) {
    const detected = detectLocale(request);
    if (detected !== DEFAULT_LANG) {
      const dest = pathname === '/' || pathname === '' ? `/${detected}/` : `/${detected}${pathname}`;
      return setSecurityHeaders(Response.redirect(url.origin + dest + url.search, 302));
    }
  }

  return setSecurityHeaders(await next());
};
