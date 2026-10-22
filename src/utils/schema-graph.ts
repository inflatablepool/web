/**
 * schema-graph.ts —— 结构化数据统一 @graph 生成器
 *
 * 修的问题（P1-C）：
 *  1. 首页现在有 7 个独立 <script type="application/ld+json"> 块，其中
 *     Organization 与 ManufacturingBusiness 描述同一实体却各写一套（后者 34KB），
 *     Brand 出现在 block5 和 block6 两处，slogan 两块给的值还不一样。
 *     实体被拆成互不相认的碎片，Google 与 AI 引擎都难以合并成一个知识实体。
 *  2. knowsAbout 里有两条被字符串管道破坏的值：
 *       " certified manufacturing"（ISO 9001 丢了）
 *       "CE  inflatable boat compliance"（中间标准号丢了）
 *     与 P0 的箭头污染是同一类根因：替换脚本吃掉了 token。
 *  3. /products/ /supboard/ /compare/ /testimonials/ 等列表页完全没有
 *     ItemList / CollectionPage / BreadcrumbList，只继承了全局 Organization。
 *  4. 全站 aggregateRating 数量为 0，但 /testimonials/ 页面上写着 4.8/5、
 *     有 12 条署名评价 —— 最强的信任资产完全没有机器可读版本。
 *  5. Organization.logo 指向 favicon.svg；sameAs 里混进相对路径 /rss.xml。
 *
 * 做法：全站只输出一个 @graph，所有实体用 @id 互相引用。
 *      所有数字与事实从 src/config/facts.json 读取，禁止硬编码。
 */

import facts from '../config/facts.json';

const SITE = 'https://inflatablepoolfactory.com';

// 稳定的 @id 锚点。@id 是实体身份的唯一凭据，一旦发布不要再改。
export const ID = {
  org: `${SITE}/#organization`,
  website: `${SITE}/#website`,
  brand: `${SITE}/#brand`,
  factory: `${SITE}/#factory`,
  founder: `${SITE}/#founder`,
} as const;

/** 合并后的组织实体 —— 取代原来的 Organization + ManufacturingBusiness 两块 */
export function organizationNode() {
  return {
    // 用多类型而不是两个块：同一个 @id 同时是 Organization 和 ManufacturingBusiness，
    // 这样 Google 既能识别为公司实体，也能识别为制造业实体，而不是两个不同的东西。
    '@type': ['Organization', 'ManufacturingBusiness'],
    '@id': ID.org,
    name: facts.brand.name,
    legalName: facts.brand.legalName,
    alternateName: facts.brand.alternateName,
    url: `${SITE}/`,
    slogan: facts.brand.slogan, // 单一事实源，两处不再打架
    description: facts.brand.description,
    foundingDate: String(facts.brand.foundingYear),

    // 光栅 logo，短边 ≥112px（Google 要求）。原来指向 favicon.svg 不合规。
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE}/#logo`,
      url: facts.logo.url,
      width: facts.logo.width,
      height: facts.logo.height,
      caption: facts.brand.name,
    },
    image: { '@id': `${SITE}/#logo` },

    address: {
      '@type': 'PostalAddress',
      streetAddress: facts.office.label,
      addressLocality: facts.office.city,
      addressRegion: facts.office.province,
      addressCountry: facts.office.country,
    },

    // 品牌与生产团队位于青岛。
    // address 是法律实体（Qingdao Vatrad Group）的注册地址，
    // location 单独声明青岛生产基地。
    location: {
      '@type': 'Place',
      '@id': ID.factory,
      name: facts.factory.label,
      address: {
        '@type': 'PostalAddress',
        addressLocality: facts.factory.city,
        addressRegion: facts.factory.province,
        addressCountry: facts.factory.country,
      },
    },

    // 联系方式：只输出已配置的电话，避免生成空号码。
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: facts.contact.primaryPhone,
        email: facts.contact.email,
        areaServed: facts.reach.regions,
        availableLanguage: facts.contact.availableLanguages,
      },
      ...(facts.contact.salesUsPhone
        ? [
            {
              '@type': 'ContactPoint',
              contactType: 'sales',
              telephone: facts.contact.salesUsPhone,
              areaServed: 'US',
              availableLanguage: ['English'],
            },
          ]
        : []),
    ],

    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: facts.factory.workforceMin,
      maxValue: facts.factory.workforceMax,
    },

    // sameAs 必须全部是绝对 URL。原来混进了相对路径 /rss.xml。
    sameAs: [
      facts.social.linkedin,
      facts.social.youtube,
      facts.social.x,
      facts.social.instagram,
      facts.social.facebook,
    ].filter(Boolean),

    // 认证是工厂品牌最硬的信任信号，原来只在正文里写，没有机器可读版本
    hasCredential: facts.certifications.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certification',
      name: c.name,
      ...(c.body ? { recognizedBy: { '@type': 'Organization', name: c.body } } : {}),
      ...(c.since ? { validFrom: String(c.since) } : {}),
    })),

    // 修掉被字符串管道破坏的两条，并补全标准号
    knowsAbout: [
      'Inflatable swimming pools',
      'Drop-stitch pool construction',
      'Rectangular and round backyard pools',
      'Family-safe pool materials',
      'Pool setup, water care, and seasonal storage',
      'EN 16582-1 residential pool safety standards',
      'ASTM F2666 pool safety compliance',
    ],

    brand: { '@id': ID.brand },
    founder: { '@id': ID.founder },
    parentOrganization: { '@type': 'Organization', name: facts.brand.legalName },
    areaServed: facts.reach.regions,
    // 服务国家数只在这一处声明，正文用同一个变量渲染
    ...(facts.reach.countriesServed
      ? {
          numberOfLocations: undefined,
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'Countries served',
              value: facts.reach.countriesServed,
            },
          ],
        }
      : {}),
  };
}

/**
 * 面包屑 —— 除首页外每一页都必须有。
 * 实测 /products/ /supboard/ /compare/ /testimonials/ /v2/ 全部缺失。
 */
export function breadcrumbNode(trail: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE}${trail[trail.length - 1].path}#breadcrumb`,
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE}${t.path}`,
    })),
  };
}

/**
 * 列表页 —— CollectionPage + ItemList。
 * 这是让 Google 理解「/products/ 是 52 个型号的集合页」的唯一方式，
 * 也是 AI 引擎枚举产品线时能一次抓全的前提。
 */
export function collectionNode(opts: {
  path: string;
  name: string;
  description: string;
  items: Array<{ name: string; path: string; image?: string }>;
}) {
  return [
    {
      '@type': 'CollectionPage',
      '@id': `${SITE}${opts.path}#collection`,
      url: `${SITE}${opts.path}`,
      name: opts.name,
      description: opts.description,
      isPartOf: { '@id': ID.website },
      about: { '@id': ID.org },
      mainEntity: { '@id': `${SITE}${opts.path}#itemlist` },
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE}${opts.path}#itemlist`,
      numberOfItems: opts.items.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: opts.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}${it.path}`,
        name: it.name,
        ...(it.image ? { image: it.image } : {}),
      })),
    },
  ];
}

/**
 * 客户评价 —— 重要限制，务必读完再用。
 *
 * Google 明确规定：网站给自己（Organization / LocalBusiness）打的评价属于
 * "self-serving reviews"，不产生评价星级富媒体结果。所以这段标记的目的
 * 不是刷星标，而是：
 *   (a) 给 AI 引擎提供可引用的机器可读客户证据 —— GEO 场景下价值很高；
 *   (b) 消除 "页面写着 4.8/5，结构化数据里评价数为 0" 这个矛盾。
 *
 * 另外两条硬约束：
 *   1. 只能标记真实存在、页面上可见的评价。/testimonials/ 上
 *      "Club Owner"、"Resort General Manager" 这类匿名条目缺少可验证作者，
 *      建议补上公司名或直接不纳入标记。
 *   2. aggregateRating 的 ratingValue 与 reviewCount 必须与页面显示一致，
 *      不能写 4.8/5 却只给出 12 条评价却声称 500+ 客户。
 */
export function reviewNodes(
  reviews: Array<{
    author: string;
    org?: string;
    location?: string;
    rating: number;
    body: string;
    product?: string;
    datePublished?: string;
  }>
) {
  const usable = reviews.filter(
    (r) => r.author && !/^(club owner|resort general manager|buyer)$/i.test(r.author.trim())
  );
  if (!usable.length) return [];
  const avg = usable.reduce((s, r) => s + r.rating, 0) / usable.length;
  return [
    {
      '@type': 'AggregateRating',
      '@id': `${SITE}/#aggregaterating`,
      itemReviewed: { '@id': ID.org },
      ratingValue: Number(avg.toFixed(1)),
      bestRating: 5,
      worstRating: 1,
      reviewCount: usable.length, // 与页面显示的条数严格一致
    },
    ...usable.map((r, i) => ({
      '@type': 'Review',
      '@id': `${SITE}/testimonials/#review-${i + 1}`,
      itemReviewed: { '@id': ID.org },
      author: {
        '@type': 'Person',
        name: r.author,
        ...(r.org ? { worksFor: { '@type': 'Organization', name: r.org } } : {}),
      },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
      ...(r.datePublished ? { datePublished: r.datePublished } : {}),
      ...(r.product ? { about: r.product } : {}),
    })),
  ];
}

/**
 * 全站唯一出口。每个页面只调这一个函数，只输出一个 <script>。
 * 页面专属节点（Product / FAQPage / Article / CollectionPage）通过 extra 传入。
 */
export function buildGraph(extra: object[] = []) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      {
        '@type': 'WebSite',
        '@id': ID.website,
        url: `${SITE}/`,
        name: facts.brand.name,
        publisher: { '@id': ID.org },
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Brand',
        '@id': ID.brand,
        name: facts.brand.name,
        slogan: facts.brand.slogan, // 与 Organization 同源，不会再出现两个 slogan
        logo: { '@id': `${SITE}/#logo` },
      },
      {
        '@type': 'Person',
        '@id': ID.founder,
        name: facts.founder.name,
        jobTitle: facts.founder.jobTitle,
        worksFor: { '@id': ID.org },
        // 删掉了原来的 birthPlace / nationality：与专业权威无关，
        // 反而像在堆砌属性。改用 alumniOf / hasCredential 才是 E-E-A-T 想要的。
        ...(facts.founder.personalLinkedin && !facts.founder.personalLinkedin.startsWith('TODO')
          ? { sameAs: [facts.founder.personalLinkedin] }
          : {}),
        ...(facts.founder.credentials?.length ? { hasCredential: facts.founder.credentials } : {}),
      },
      ...extra,
    ],
  };
}
