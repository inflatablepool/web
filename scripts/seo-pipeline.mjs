import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'output');

const SAMPLE_DATA = [
  {
    query: 'inflatable sup board for beginners',
    page: '/en/guides/beginner-guide',
    impressions: 340,
    clicks: 6,
    ctr: 0.0176,
    position: 11.2,
  },
  {
    query: 'best paddle board for fishing',
    page: '/en/guides/sup-fishing',
    impressions: 280,
    clicks: 4,
    ctr: 0.0143,
    position: 14.5,
  },
  {
    query: 'how to choose a paddle board size',
    page: '/en/guides/choosing-paddle',
    impressions: 510,
    clicks: 11,
    ctr: 0.0216,
    position: 9.8,
  },
  {
    query: 'inflatable vs hard paddle board',
    page: '/en/guides/inflatable-vs-hard',
    impressions: 720,
    clicks: 18,
    ctr: 0.025,
    position: 7.3,
  },
  {
    query: 'sup board maintenance tips',
    page: '/en/guides/sup-maintenance',
    impressions: 190,
    clicks: 3,
    ctr: 0.0158,
    position: 16.1,
  },
  {
    query: 'paddle board yoga poses',
    page: '/en/guides/sup-yoga',
    impressions: 145,
    clicks: 2,
    ctr: 0.0138,
    position: 18.4,
  },
  {
    query: 'beginner sup guide',
    page: '/en/guides/beginner-guide',
    impressions: 890,
    clicks: 31,
    ctr: 0.0348,
    position: 5.2,
  },
  {
    query: 'best paddle board for kids',
    page: '/en/guides/sup-with-kids',
    impressions: 230,
    clicks: 5,
    ctr: 0.0217,
    position: 12.8,
  },
  {
    query: 'kayak paddling techniques',
    page: '/en/guides/kayak-techniques',
    impressions: 410,
    clicks: 9,
    ctr: 0.022,
    position: 10.3,
  },
  {
    query: 'multi day sup trip planning',
    page: '/en/guides/multi-day-trip',
    impressions: 165,
    clicks: 2,
    ctr: 0.0121,
    position: 19.7,
  },
];

function runRules(data) {
  const high = [];
  const medium = [];

  for (const d of data) {
    if (d.impressions > 100 && d.ctr < 0.02) {
      high.push({
        type: 'CTR_FIX',
        page: d.page,
        query: d.query,
        priority: 3,
        reason: `High impressions (${d.impressions}) but low CTR (${(d.ctr * 100).toFixed(1)}%).`,
        action: 'Rewrite title tag and meta description.',
      });
    }
    if (d.position >= 4 && d.position <= 20) {
      high.push({
        type: 'RANK_BOOST',
        page: d.page,
        query: d.query,
        priority: 3,
        reason: `Position ${d.position} is within striking distance of top 3.`,
        action: 'Add internal links and expand content.',
      });
    }
    if (d.impressions < 50 && d.query.split(' ').length >= 3) {
      medium.push({
        type: 'CONTENT_GAP',
        page: d.page,
        query: d.query,
        priority: 2,
        reason: `Low impressions (${d.impressions}) for long-tail query.`,
        action: 'Add dedicated section or FAQ entry.',
      });
    }
    if (d.position <= 3 && d.ctr < 0.05) {
      high.push({
        type: 'PAGE_CTR_FIX',
        page: d.page,
        query: d.query,
        priority: 3,
        reason: `Position ${d.position} but CTR only ${(d.ctr * 100).toFixed(1)}%.`,
        action: 'Update meta title and description.',
      });
    }
  }

  return { high, medium };
}

function generateGeo(data) {
  const pages = [...new Set(data.map((d) => d.page))];
  return pages.map((page) => ({
    page,
    tldr: `Practical guide for ${page.split('/').pop().replace(/-/g, ' ')}.`,
    definition: 'Structured content answering common user questions.',
    steps: ['Assess skill level', 'Research gear', 'Follow safety guidelines', 'Practice regularly'],
    faq: [{ q: 'How do I get started?', a: 'Start with fundamentals and build gradually.' }],
  }));
}

const SOCIAL_HOOKS = [
  'Most surfers get this wrong...',
  'Stop doing this with your board...',
  'The #1 mistake beginners make:',
  'This changes everything about surfing:',
  "I tested every board size so you don't have to:",
];

function generateSocialPosts(pageSlug) {
  const title = pageSlug.replace(/-/g, ' ');
  const url = `/${pageSlug}`;
  const keywords = pageSlug
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
  const hook = SOCIAL_HOOKS[Math.floor(Math.random() * SOCIAL_HOOKS.length)];
  const hashtags = ['#InflatablePoolFactory', '#surfing', '#ocean', ...keywords.slice(0, 3).map((k) => `#${k}`)];

  return [
    {
      platform: 'instagram',
      content: `${hook}\n\nFull guide: inflatablepoolfactory.com${url}\n\n${title}`,
      hashtags,
      cta: 'Link in bio',
    },
    {
      platform: 'tiktok',
      content: `${hook} 馃憜 Full guide at inflatablepoolfactory.com${url}`,
      hashtags: hashtags.slice(0, 3),
      cta: 'Full guide in bio',
    },
    {
      platform: 'twitter',
      content: `${hook}\n\n${title}\n\nRead 鈫?inflatablepoolfactory.com${url}\n\n${hashtags.slice(0, 3).join(' ')}`,
      hashtags,
      cta: 'Read full guide',
    },
    {
      platform: 'pinterest',
      content: `${title} u2014 Complete Guide\n\ninflatablepoolfactory.com${url}`,
      hashtags,
      cta: 'Save for later',
    },
    {
      platform: 'reddit',
      content: `**${title}**\n\nI've been testing different ${keywords.slice(0, 3).join(', ')} in real conditions.\n\n${hook.replace(':', '.')}\n\nFull breakdown: https://inflatablepoolfactory.com${url}`,
      hashtags: [],
      cta: 'Full breakdown',
    },
  ];
}

function socialPostsJson(allSocial) {
  return JSON.stringify({ timestamp: new Date().toISOString(), posts: allSocial }, null, 2);
}

function toMarkdown(tasks) {
  const lines = ['# SEO Tasks\n', `Generated: ${new Date().toISOString()}\n`];
  if (tasks.high?.length) {
    lines.push('## High Priority\n');
    for (const t of tasks.high) lines.push(`- **[${t.type}]** ${t.page} u2014 ${t.action}\n`);
  }
  if (tasks.medium?.length) {
    lines.push('## Medium Priority\n');
    for (const t of tasks.medium) lines.push(`- **[${t.type}]** ${t.page} u2014 ${t.action}\n`);
  }
  return lines.join('\n');
}

function toCsv(tasks) {
  const rows = [['type', 'priority', 'page', 'query', 'reason', 'action']];
  for (const t of [...tasks.high, ...tasks.medium]) {
    rows.push([t.type, String(t.priority), t.page, t.query, t.reason, t.action]);
  }
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

console.log('=== Inflatable Pool Factory SEO Pipeline v3.6 ===\n');

const tasks = runRules(SAMPLE_DATA);
const geo = generateGeo(SAMPLE_DATA);
const pageSlugs = [...new Set(SAMPLE_DATA.map((d) => d.page.split('/').filter(Boolean).pop()))];
const allSocialPosts = pageSlugs.map((slug) => ({ slug, posts: generateSocialPosts(slug) }));

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

writeFileSync(join(OUT, 'tasks.json'), JSON.stringify({ timestamp: new Date().toISOString(), tasks, geo }, null, 2));
writeFileSync(join(OUT, 'tasks.md'), toMarkdown(tasks));
writeFileSync(join(OUT, 'tasks.csv'), toCsv(tasks));
writeFileSync(join(OUT, 'geo.json'), JSON.stringify(geo, null, 2));
writeFileSync(join(OUT, 'social.json'), socialPostsJson(allSocialPosts));

console.log(`Queries: ${SAMPLE_DATA.length}`);
console.log(`High priority tasks: ${tasks.high.length}`);
console.log(`Medium priority tasks: ${tasks.medium.length}`);
console.log(`GEO pages: ${geo.length}`);
console.log(`Social posts: ${allSocialPosts.reduce((s, p) => s + p.posts.length, 0)}`);
console.log('\nOutput written to output/');
console.log('  - output/tasks.json');
console.log('  - output/tasks.md');
console.log('  - output/tasks.csv');
console.log('  - output/geo.json');
console.log('  - output/social.json');
console.log('\n=== Pipeline Complete ===');
