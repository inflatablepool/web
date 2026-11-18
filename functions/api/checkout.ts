interface CheckoutEnv {
  STRIPE_SECRET_KEY?: string;
}

interface CatalogVariant {
  /** Human-readable size label, e.g. "Ø 2.0 × 0.5 m" */
  label: string;
  /** Firm retail price for this size (cents). Only finance-confirmed prices. */
  unitAmount: number;
}

interface CatalogEntry {
  name: string;
  slug: string;
  unitAmount: number;
  currency: string;
  image: string;
  /** Factory item code used when no explicit `item` is posted (R-01). */
  defaultItem?: string;
  /** Retail size variants; only firm-priced sizes are checkout-enabled. */
  variants?: Record<string, CatalogVariant>;
}

/**
 * R-01 retail rule (factory confirmation 2026-11): fixed retail prices with
 * online checkout only for small/mid sizes ≤ 4 m with standard walls.
 * S3010/S3012 prices are pending finance confirmation — those sizes are shown
 * on the page as "Request price" and are deliberately absent from `variants`.
 * The rectangular $499 retail entry was taken offline (wholesale RFQ only);
 * ≥ 5 m and 20/50 cm reinforced-wall configurations are quoted projects.
 */
const PRODUCT_CATALOG: Record<string, CatalogEntry> = {
  'IPF-POOL-RND-BLUE': {
    name: 'Round Blue Inflatable Drop Stitch Swimming Pool',
    slug: 'round-blue-drop-stitch-pool',
    unitAmount: 29900,
    currency: 'usd',
    image: '/images/pools/round-blue-pool-1.webp',
    defaultItem: 'S2005',
    variants: {
      S2005: { label: 'Ø 2.0 × 0.5 m', unitAmount: 29900 },
    },
  },
  'IPF-POOL-RND-GREY': {
    name: 'Round Grey Inflatable Drop Stitch Swimming Pool',
    // P1-5: the grey page was merged into the blue product page (colorway);
    // return buyers to the merged page after checkout.
    slug: 'round-blue-drop-stitch-pool',
    unitAmount: 29900,
    currency: 'usd',
    image: '/images/pools/round-grey-pool-1.webp',
    defaultItem: 'S2005',
    variants: {
      S2005: { label: 'Ø 2.0 × 0.5 m', unitAmount: 29900 },
    },
  },
  'IPF-SPA-RND': {
    name: 'Round Inflatable Hot Tub SPA Pool',
    slug: 'hot-tub-round',
    unitAmount: 49900,
    currency: 'usd',
    image: '/images/pools/hot-tub-round.png',
    defaultItem: 'RS2018',
    variants: {
      RS2018: { label: 'Ø 2.0 × 0.8 m', unitAmount: 49900 },
    },
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
  let item = '';
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    sku = String(body.sku || '');
    lang = String(body.lang || 'en');
    item = String(body.item || '');
  } else {
    const form = await request.formData().catch(() => null);
    if (form) {
      sku = String(form.get('sku') || '');
      lang = String(form.get('lang') || 'en');
      item = String(form.get('item') || '');
    }
  }

  const entry = PRODUCT_CATALOG[sku];
  if (!entry) {
    return Response.json({ error: 'Unknown product SKU.' }, { status: 400 });
  }

  // R-01 size variant resolution: an explicit `item` must match a firm-priced
  // variant; postings without `item` fall back to the entry's default size.
  const variantKey = item ? item.toUpperCase() : (entry.defaultItem ?? '');
  const variant = variantKey ? entry.variants?.[variantKey] : undefined;
  if (item && !variant) {
    return Response.json({ error: 'Unknown size variant for this product.' }, { status: 400 });
  }
  const unitAmount = variant ? variant.unitAmount : entry.unitAmount;
  const lineName = variant ? `${entry.name} (${variant.label})` : entry.name;

  if (!SUPPORTED_LANGS.has(lang)) lang = 'en';
  const origin = new URL(request.url).origin;
  const langPrefix = lang !== 'en' ? `/${lang}` : '';
  const productPath = `${langPrefix}/products/${entry.slug}`;

  const params: Array<[string, string]> = [
    ['mode', 'payment'],
    ['success_url', `${origin}${productPath}?checkout=success`],
    ['cancel_url', `${origin}${productPath}?checkout=canceled`],
    ['client_reference_id', variantKey ? `${sku}:${variantKey}` : sku],
    ['line_items[0][quantity]', '1'],
    ['line_items[0][price_data][currency]', entry.currency],
    ['line_items[0][price_data][unit_amount]', String(unitAmount)],
    ['line_items[0][price_data][product_data][name]', lineName],
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
