import type { APIRoute } from 'astro';
import { contentV2Records } from '~/data/content-v2';
import { SITE } from 'astrowind:config';

export const prerender = true;

export async function getStaticPaths() {
  return contentV2Records.map((entry) => ({ params: { slug: entry.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const entry = contentV2Records.find((e) => e.slug === params.slug);
  if (!entry) return new Response('Not found', { status: 404 });

  const lines: string[] = [];

  lines.push(`# ${entry.title}`);
  lines.push('');
  const siteName = SITE?.name || 'Inflatable Pool Factory';
  lines.push(`*${siteName} Knowledge Center*`);
  lines.push('');
  lines.push(entry.description);
  lines.push('');

  if (entry.definition) {
    lines.push('## Definition');
    lines.push('');
    lines.push(entry.definition);
    lines.push('');
  }

  if (entry.tldr) {
    lines.push('## TL;DR');
    lines.push('');
    lines.push(entry.tldr);
    lines.push('');
  }

  if (entry.problem) {
    lines.push('## Problem');
    lines.push('');
    lines.push(entry.problem);
    lines.push('');
  }

  if (entry.explanation) {
    lines.push('## Explanation');
    lines.push('');
    lines.push(entry.explanation);
    lines.push('');
  }

  if (entry.solution) {
    lines.push('## Solution');
    lines.push('');
    lines.push(entry.solution);
    lines.push('');
  }

  if (entry.recommendation) {
    lines.push('## Recommendation');
    lines.push('');
    lines.push(entry.recommendation);
    lines.push('');
  }

  if (entry.faq?.length) {
    lines.push('## FAQ');
    lines.push('');
    for (const f of entry.faq) {
      lines.push(`**Q: ${f.q}**`);
      lines.push('');
      lines.push(f.a);
      lines.push('');
    }
  }

  if (entry.relatedProducts?.length) {
    lines.push('## Related Products');
    lines.push('');
    for (const p of entry.relatedProducts) {
      lines.push(`- [${p}](${SITE?.site || 'https://inflatablepoolfactory.com'}/products/${p})`);
    }
    lines.push('');
  }

  if (entry.relatedGuides?.length) {
    lines.push('## Related Guides');
    lines.push('');
    for (const g of entry.relatedGuides) {
      lines.push(`- [${g}](${SITE?.site || 'https://inflatablepoolfactory.com'}/v2/${g})`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(
    `Difficulty: ${entry.difficulty} | Type: ${entry.type} | Source: ${SITE?.site || 'https://inflatablepoolfactory.com'}/v2/${entry.slug}`
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
