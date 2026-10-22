import type { APIRoute } from 'astro';
import { procurementGuides, GUIDE_CLUSTER_LABELS } from '~/data/procurement-guides';
import { SITE } from 'astrowind:config';

export const prerender = true;

export async function getStaticPaths() {
  return procurementGuides.map((g) => ({ params: { slug: g.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const guide = procurementGuides.find((g) => g.slug === params.slug);
  if (!guide) return new Response('Not found', { status: 404 });

  const site = SITE?.site || 'https://inflatablepoolfactory.com';
  const lines: string[] = [];

  lines.push(`# ${guide.title}`);
  lines.push('');
  lines.push(
    `Cluster: ${GUIDE_CLUSTER_LABELS[guide.cluster]} | Published: ${guide.publishDate} | Updated: ${guide.updateDate} | Read time: ${guide.readMinutes} min`
  );
  lines.push('');
  lines.push(guide.description);
  lines.push('');

  lines.push('## TL;DR');
  lines.push('');
  lines.push(guide.tldr);
  lines.push('');

  if (guide.audience) {
    lines.push('## Who This Is For');
    lines.push('');
    lines.push(guide.audience);
    lines.push('');
  }

  for (const section of guide.sections) {
    lines.push(`## ${section.heading}`);
    lines.push('');
    for (const p of section.paragraphs) {
      lines.push(p);
      lines.push('');
    }
    if (section.bullets?.length) {
      for (const b of section.bullets) {
        lines.push(`- ${b}`);
      }
      lines.push('');
    }
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

  if (guide.related?.length) {
    lines.push('## Related Pages');
    lines.push('');
    for (const r of guide.related) {
      lines.push(`- [${r.label}](${r.href.startsWith('http') ? r.href : `${site}${r.href}`})`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`Source: ${site}/guides/${guide.slug}`);

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
