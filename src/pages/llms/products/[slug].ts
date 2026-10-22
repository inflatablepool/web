import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from 'astrowind:config';

export const prerender = true;

export async function getStaticPaths() {
  const products = await getCollection('product');
  return products.map((p) => ({ params: { slug: p.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const products = await getCollection('product', (p) => p.id === params.slug);
  const entry = products[0];
  if (!entry) {
    return new Response('Not found', { status: 404 });
  }

  const { data, body } = entry;
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push('');
  if (data.sku) lines.push(`- **SKU**: ${data.sku}`);
  if (data.category) lines.push(`- **Category**: ${data.category}`);
  if (data.tags?.length) lines.push(`- **Tags**: ${data.tags.join(', ')}`);
  if (data.summary) lines.push(`- **Summary**: ${data.summary}`);
  if (data.description) lines.push(`- **Description**: ${data.description}`);
  if (data.price?.amount) lines.push(`- **Price**: $${data.price.amount} ${data.price.currency || 'USD'}`);
  if (data.price?.note) lines.push(`- **Price Note**: ${data.price.note}`);
  if (data.inStock !== undefined) lines.push(`- **In Stock**: ${data.inStock ? 'Yes' : 'No'}`);
  if (data.image) lines.push(`- **Image**: ${data.image}`);
  lines.push('');

  if (data.specs?.length) {
    lines.push('## Specifications');
    lines.push('');
    lines.push('| Spec | Value |');
    lines.push('|------|-------|');
    for (const spec of data.specs) {
      lines.push(`| ${spec.label} | ${spec.value} |`);
    }
    lines.push('');
  }

  if (body?.trim()) {
    lines.push('## Details');
    lines.push('');
    lines.push(body.trim());
  }

  lines.push('');
  lines.push('---');
  lines.push(`Source: ${SITE?.site || 'https://inflatablepoolfactory.com'}/products/${entry.id}`);

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
