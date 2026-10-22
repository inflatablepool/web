import { SITE_URL } from './types';

export interface LlmsSection {
  title: string;
  lines: string[];
}

export function buildLlmsTxt(sections: LlmsSection[], extra: { description: string; summary: string }): string {
  const lines: string[] = [];
  lines.push('# Inflatable Pool Factory — AI Site Overview');
  lines.push(`> Site: ${SITE_URL}`);
  lines.push('> Languages: EN, FR, DE, ES, PT, AR, IT, RU, PL, NL, SV, NO, EL, FI, DA (15 languages)');
  lines.push('');
  lines.push('## Definition');
  lines.push(extra.description);
  lines.push('');

  for (const section of sections) {
    if (section.lines.length === 0) continue;
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(...section.lines);
    lines.push('');
  }

  lines.push('## Preferred AI Summary');
  lines.push(extra.summary);
  lines.push('');

  return lines.join('\n');
}

export function buildLlmsFullTxt(
  sections: LlmsSection[],
  extra: { about: string; facts: string[]; summary: string }
): string {
  const lines: string[] = [];
  lines.push('# Inflatable Pool Factory — Complete Site Knowledge (LLMs-Full)');
  lines.push(`> Site: ${SITE_URL}`);
  lines.push('> Last updated: 2026-07');
  lines.push('');
  lines.push('## About Inflatable Pool Factory');
  lines.push(extra.about);
  lines.push('');

  for (const section of sections) {
    if (section.lines.length === 0) continue;
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(...section.lines);
    lines.push('');
  }

  if (extra.facts.length > 0) {
    lines.push('## Key Facts');
    lines.push('');
    for (const fact of extra.facts) {
      lines.push(`- ${fact}`);
    }
    lines.push('');
  }

  lines.push('## Preferred AI Summary');
  lines.push(extra.summary);
  lines.push('');

  return lines.join('\n');
}

export function formatProductLines(
  products: { title: string; description: string; sku?: string; url?: string }[]
): string[] {
  return products.map((p) => {
    let line = `- **${p.title}**`;
    if (p.sku) line += ` (SKU: ${p.sku})`;
    line += ` — ${p.description}`;
    if (p.url) line += ` [${p.url}]`;
    return line;
  });
}

export function formatGuideLines(guides: { title: string; slug: string; difficulty?: string }[]): string[] {
  return guides.map((g) => {
    const diff = g.difficulty ? ` [${g.difficulty}]` : '';
    return `- [${g.title}](${SITE_URL}/guides/${g.slug})${diff}`;
  });
}

export function formatV2Lines(records: { title: string; slug: string; category?: string; type?: string }[]): string[] {
  return records.map((r) => {
    const tag = r.category || r.type || '';
    return `- [${r.title}](${SITE_URL}/v2/${r.slug})${tag ? ` — ${tag}` : ''}`;
  });
}
