interface CheckoutEnv {
  STRIPE_SECRET_KEY?: string;
}

interface CatalogEntry {
  name: string;
  slug: string;
  unitAmount: number;
  currency: string;
  image: string;
}

const PRODUCT_CATALOG: Record<string, CatalogEntry> = {
  'IPF-POOL-RND-BLUE': {
    name: 'Round Blue Inflatable Drop Stitch Swimming Pool',
    slug: 'round-blue-drop-stitch-pool',
    unitAmount: 29900,
    currency: 'usd',
    image: '/images/pools/round-blue-pool-1.webp',
  },
  'IPF-POOL-RND-GREY': {
    name: 'Round Grey Inflatable Drop Stitch Swimming Pool',
    slug: 'round-grey-drop-stitch-pool',
    unitAmount: 39900,
    currency: 'usd',
    image: '/images/pools/round-grey-pool-1.webp',
  },
  'IPF-POOL-RECT': {
    name: 'Rectangular Inflatable Drop Stitch Swimming Pool',
    slug: 'rectangular-drop-stitch-pool',
    unitAmount: 49900,
    currency: 'usd',
    image: '/images/pools/rectangular-pool-2.webp',
  },
};

const SUPPORTED_LANGS = new Set([
  'en',
  'fr',
  'de',
  'es',
  'pt',
  'ar',
  'it',
  'ru',
  'pl',
  'nl',
  'sv',
  'no',
  'el',
  'fi',
  'da',
  'cs',
  'th',
  'hr',
  'tl',
  'hu',
  'ro',
  'sk',
  'bg',
  'sl',
  'sr',
  'tr',
  'id',
  'he',
  'ms',
  'lt',
  'lv',
  'et',
]);

export const onRequestPost: (...args: any[]) => any = async (context: any) => {
  const { request, env } = context;
  const secret = (env as CheckoutEnv).STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' }, { status: 500 });
  }

  let sku = '';
  let lang = 'en';
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    sku = String(body.sku || '');
    lang = String(body.lang || 'en');
  } else {
    const form = await request.formData().catch(() => null);
    if (form) {
      sku = String(form.get('sku') || '');
      lang = String(form.get('lang') || 'en');
    }
  }

  const entry = PRODUCT_CATALOG[sku];
  if (!entry) {
    return Response.json({ error: 'Unknown product SKU.' }, { status: 400 });
  }

  if (!SUPPORTED_LANGS.has(lang)) lang = 'en';
  const origin = new URL(request.url).origin;
  const langPrefix = lang !== 'en' ? `/${lang}` : '';
  const productPath = `${langPrefix}/products/${entry.slug}`;

  const params: Array<[string, string]> = [
    ['mode', 'payment'],
    ['success_url', `${origin}${productPath}?checkout=success`],
    ['cancel_url', `${origin}${productPath}?checkout=canceled`],
    ['client_reference_id', sku],
    ['line_items[0][quantity]', '1'],
    ['line_items[0][price_data][currency]', entry.currency],
    ['line_items[0][price_data][unit_amount]', String(entry.unitAmount)],
    ['line_items[0][price_data][product_data][name]', entry.name],
    ['line_items[0][price_data][product_data][images][0]', `${origin}${entry.image}`],
  ];
  const body = new URLSearchParams(params).toString();

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const stripeJson = (await stripeRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (!stripeRes.ok || !stripeJson.url) {
    return Response.json(
      { error: 'Failed to create Stripe checkout session.', detail: stripeJson.error ?? null },
      { status: 502 }
    );
  }

  return new Response(null, {
    status: 303,
    headers: { Location: String(stripeJson.url) },
  });
};

export const onRequest: (...args: any[]) => any = async (context: any) => {
  const { request } = context;
  return Response.json({ error: `Method ${request.method} not allowed. Use POST.` }, { status: 405 });
};
