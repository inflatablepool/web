import { contentV2Records } from '~/data/content-v2';

export interface SocialPlatform {
  name: string;
  key: 'instagram' | 'tiktok' | 'twitter' | 'pinterest' | 'reddit';
  icon: string;
  format: 'video' | 'image' | 'text' | 'infographic';
  maxChars: number;
  hashtags: boolean;
  linkAllowed: boolean;
}

export interface SocialPost {
  platform: SocialPlatform['key'];
  content: string;
  caption?: string;
  hashtags: string[];
  link: string;
  cta: string;
}

export interface ArticleSocialPack {
  slug: string;
  title: string;
  posts: SocialPost[];
}

export const PLATFORMS: SocialPlatform[] = [
  {
    name: 'Instagram',
    key: 'instagram',
    icon: '📷',
    format: 'video',
    maxChars: 2200,
    hashtags: true,
    linkAllowed: false,
  },
  { name: 'TikTok', key: 'tiktok', icon: '🎵', format: 'video', maxChars: 400, hashtags: true, linkAllowed: false },
  {
    name: 'X (Twitter)',
    key: 'twitter',
    icon: '𝕏',
    format: 'text',
    maxChars: 280,
    hashtags: true,
    linkAllowed: true,
  },
  {
    name: 'Pinterest',
    key: 'pinterest',
    icon: '📌',
    format: 'infographic',
    maxChars: 500,
    hashtags: true,
    linkAllowed: true,
  },
  {
    name: 'Reddit',
    key: 'reddit',
    icon: '&#x1f5e8;',
    format: 'text',
    maxChars: 40000,
    hashtags: false,
    linkAllowed: true,
  },
];

const HOOKS = [
  'Most surfers get this wrong...',
  'Stop doing this with your board...',
  'The #1 mistake beginners make:',
  'This changes everything about surfing:',
  "I tested every board size so you don't have to:",
];

function getSlugKeywords(slug: string): string[] {
  return slug
    .split('-')
    .filter(
      (w) =>
        ![
          'a',
          'an',
          'the',
          'for',
          'and',
          'or',
          'vs',
          'to',
          'of',
          'in',
          'is',
          'it',
          'how',
          'what',
          'why',
          'your',
          'not',
          'are',
          'with',
          'you',
        ].includes(w)
    );
}

function pickHooks(slug: string, count: number): string[] {
  const kw = getSlugKeywords(slug);
  return HOOKS.map((h) => {
    const kwMatch = kw.length > 0 ? kw.slice(0, 2).join(' ') : 'surfing';
    return `${h} — ${kwMatch}`;
  }).slice(0, count);
}

export function generateSocialPosts(slug: string, _count = 5): SocialPost[] {
  const record = contentV2Records.find((c) => c.slug === slug);
  const title = record?.title || slug.replace(/-/g, ' ');
  const url = `/guides/${slug}`;
  const hooks = pickHooks(slug, 3);
  const baseHashtags = [
    '#InflatablePoolFactory',
    '#surfing',
    '#ocean',
    ...getSlugKeywords(slug)
      .slice(0, 3)
      .map((k) => `#${k.toLowerCase().replace(/[^a-z0-9]/g, '')}`),
  ];

  const postTemplates: Array<(h: string, i: number) => SocialPost> = [
    (h, _i) => ({
      platform: 'instagram',
      content: `${h}\n\nFull guide: inflatablepoolfactory.com${url}\n\n${title} — everything you need to know.`,
      caption: `${title} — your complete guide. Tap the link in bio to read more.`,
      hashtags: baseHashtags,
      link: url,
      cta: 'Link in bio',
    }),
    (h, _i) => ({
      platform: 'tiktok',
      content: `${h} 🔗 Full guide at inflatablepoolfactory.com${url} #InflatablePoolFactory #surftips #oceansports`,
      hashtags: baseHashtags.slice(0, 3),
      link: url,
      cta: 'Full guide in bio',
    }),
    (h, _i) => ({
      platform: 'twitter',
      content: `${h}\n\n${title}\n\nRead the full guide — inflatablepoolfactory.com${url}\n\n${baseHashtags.slice(0, 3).join(' ')}`,
      hashtags: baseHashtags,
      link: url,
      cta: 'Read full guide',
    }),
    (h, _i) => ({
      platform: 'pinterest',
      content: `${title} — Complete Guide\n\n${h.replace('...', '.')} Pin this for your next surf session.\n\ninflatablepoolfactory.com${url}`,
      hashtags: baseHashtags,
      link: url,
      cta: 'Save for later',
    }),
    (h, _i) => ({
      platform: 'reddit',
      content: `**${title}**\n\nI've been testing different ${getSlugKeywords(slug).slice(0, 3).join(', ')} in real ocean conditions and here's what I found:\n\n${h.replace(':', '.')}\n\nFull breakdown with everything I learned:\n[${title}](https://inflatablepoolfactory.com${url})\n\nHappy to answer questions in the comments.`,
      hashtags: [],
      link: url,
      cta: 'Full breakdown',
    }),
  ];

  return postTemplates.map((tmpl, i) => tmpl(hooks[i % hooks.length], i));
}

export function getArticleSocialPack(slug: string): ArticleSocialPack {
  const record = contentV2Records.find((c) => c.slug === slug);
  return {
    slug,
    title: record?.title || slug,
    posts: generateSocialPosts(slug),
  };
}

export function getAllSocialPacks(): ArticleSocialPack[] {
  return contentV2Records
    .filter((c) => c.type === 'guide' || c.type === 'comparison')
    .map((c) => getArticleSocialPack(c.slug));
}

export function getSocialSummary(): { total: number; byPlatform: Record<string, number> } {
  const all = getAllSocialPacks();
  const byPlatform: Record<string, number> = {};
  for (const pack of all) {
    for (const post of pack.posts) {
      byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;
    }
  }
  return { total: all.reduce((s, p) => s + p.posts.length, 0), byPlatform };
}
