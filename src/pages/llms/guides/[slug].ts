import type { APIRoute } from 'astro';
import { guides } from '~/data/guides';
import { SITE } from 'astrowind:config';

export const prerender = true;

export async function getStaticPaths() {
  return guides.map((g) => ({ params: { slug: g.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) return new Response('Not found', { status: 404 });

  const lines: string[] = [];

  lines.push(`# ${guide.title}`);
  lines.push('');
  lines.push(`Category: ${guide.category} | Difficulty: ${guide.difficulty} | Water: ${guide.waterType.join(', ')}`);
  lines.push('');
  lines.push(guide.description);
  lines.push('');

  if (guide.tldr) {
    lines.push('## TL;DR');
    lines.push('');
    lines.push(guide.tldr);
    lines.push('');
  }

  if (guide.problem) {
    lines.push('## The Problem');
    lines.push('');
    lines.push(guide.problem);
    lines.push('');
  }

  if (guide.solution) {
    lines.push('## The Solution');
    lines.push('');
    lines.push(guide.solution);
    lines.push('');
  }

  if (guide.audience) {
    lines.push('## Who This Is For');
    lines.push('');
    lines.push(guide.audience);
    lines.push('');
  }

  if (guide.steps?.length) {
    lines.push('## Steps');
    lines.push('');
    for (let i = 0; i < guide.steps.length; i++) {
      lines.push(`${i + 1}. ${guide.steps[i]}`);
    }
    lines.push('');
  }

  if (guide.faq?.length) {
    lines.push('## FAQ');
    lines.push('');
    for (const f of guide.faq) {
      lines.push(`**Q: ${f.q}**`);
      lines.push('');
      lines.push(f.a);
      lines.push('');
    }
  }

  if (guide.relatedProducts?.length) {
    lines.push('## Related Products');
    lines.push('');
    for (const p of guide.relatedProducts) {
      lines.push(`- [${p}](${SITE?.site || 'https://inflatablepoolfactory.com'}/products/${p})`);
    }
    lines.push('');
  }

  if (guide.relatedGuides?.length) {
    lines.push('## Related Guides');
    lines.push('');
    for (const g of guide.relatedGuides) {
      lines.push(`- [${g}](${SITE?.site || 'https://inflatablepoolfactory.com'}/guides/${g})`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`Source: ${SITE?.site || 'https://inflatablepoolfactory.com'}/guides/${guide.slug}`);

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
