// HTML rendering helpers for the public news worker. Posts are plain markdown
// (headings, paragraphs, bold/italic, links, images, lists, blockquote, hr,
// code) — enough to render the existing 21 posts without a heavy MDX pipeline.

export const LANGS = ['en', 'fr', 'de', 'es', 'pt', 'ar', 'it', 'ru', 'pl', 'nl', 'sv', 'no', 'el', 'fi', 'da'];

// Hero heading + subtitle per locale (mirrors src/i18n/generated/pages/news.ts).
export const NEWS_UI: Record<string, { title: string; subtitle: string }> = {
  en: {
    title: 'News',
    subtitle: 'The latest from Inflatable Pool Factory — product launches, company updates, guides, and stories from the water',
  },
  fr: {
    title: 'Actualités',
    subtitle:
      'Les dernières nouvelles de Inflatable Pool Factory — lancements de produits, actualités, guides et histoires du terrain',
  },
  de: {
    title: 'Neuigkeiten',
    subtitle: 'Aktuelles von Inflatable Pool Factory – Produkteinführungen, Unternehmensupdates, Ratgeber und Geschichten vom Wasser',
  },
  es: {
    title: 'Noticias',
    subtitle: 'Las últimas novedades de Inflatable Pool Factory — lanzamientos, actualizaciones, guías e historias del agua',
  },
  pt: {
    title: 'Notícias',
    subtitle:
      'O mais recente da Inflatable Pool Factory — lançamentos de produtos, atualizações da empresa, guias e histórias do mar',
  },
  ar: {
    title: 'الأخبار',
    subtitle: 'آخر المستجدات من Inflatable Pool Factory — إطلاق المنتجات، تحديثات الشركة، الأدلة، وقصص من الماء',
  },
  it: {
    title: 'Novità',
    subtitle: 'Ultime notizie da Inflatable Pool Factory – lanci prodotti, aggiornamenti aziendali, guide e storie dal mare',
  },
  ru: {
    title: 'Новости',
    subtitle: 'Последние новости Inflatable Pool Factory — запуски продуктов, обновления компании, руководства и истории с воды',
  },
  pl: {
    title: 'Aktualności',
    subtitle: 'Najnowsze wiadomości od Inflatable Pool Factory – premiery produktów, aktualizacje firmy, poradniki i historie z wody',
  },
  nl: {
    title: 'Nieuws',
    subtitle:
      'Het laatste nieuws van Inflatable Pool Factory – productlanceringen, bedrijfsupdates, handleidingen en verhalen van het water',
  },
  sv: {
    title: 'Nyheter',
    subtitle:
      'Senaste nyheterna från Inflatable Pool Factory – produktlanseringar, företagsuppdateringar, guider och berättelser från vattnet',
  },
  no: {
    title: 'Nyheter',
    subtitle:
      'Siste nytt fra Inflatable Pool Factory – produktlanseringer, bedriftsoppdateringer, veiledninger og historier fra vannet',
  },
  el: {
    title: 'Νέα',
    subtitle:
      'Τα τελευταία νέα από την Inflatable Pool Factory – κυκλοφορίες προϊόντων, εταιρικές ενημερώσεις, οδηγοί και ιστορίες από το νερό',
  },
  tr: {
    title: 'Haberler',
    subtitle: "Inflatable Pool Factory'dan en son haberler – ürün lansmanları, şirket güncellemeleri, rehberler ve sudan hikayeler",
  },
  fi: {
    title: 'Uutiset',
    subtitle: 'Uusimmat Inflatable Pool Factory — tuotelanseeraukset, yrityspäivitykset, oppaat ja tarinoita vesiltä',
  },
  cs: {
    title: 'Novinky',
    subtitle: 'Nejnovější z Inflatable Pool Factory — uvedení produktů, aktualizace společnosti, průvodci a příběhy z vody',
  },
  da: {
    title: 'Nyheder',
    subtitle: 'Det seneste fra Inflatable Pool Factory — produktlanceringer, virksomhedsopdateringer, guides og historier fra vandet',
  },
  ro: {
    title: 'Noutăți',
    subtitle:
      'Cele mai recente de la Inflatable Pool Factory — lansări de produse, actualizări ale companiei, ghiduri și povești de pe apă',
  },
  th: {
    title: 'ข่าวสาร',
    subtitle: 'ข่าวสารล่าสุดจาก Inflatable Pool Factory — การเปิดตัวสินค้า อัปเดตบริษัท คำแนะนำ และเรื่องราวจากบนน้ำ',
  },
};

export function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '');
}

export interface MarkdownResult {
  html: string;
  safeLinks: { href: string; text: string }[];
}

// NOTE: links are intentionally returned for the llms/`markdown`-flavored
// endpoints; `renderMarkdown` itself just produces HTML.
export function renderMarkdown(md: string): MarkdownResult {
  const safeLinks: { href: string; text: string }[] = [];
  const lines = String(md ?? '').split(/\r?\n/);
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let listTag = 'ul';
  let code: string[] | null = null;

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      out.push(`<${listTag}>${list.map((li) => `<li>${li}</li>`).join('')}</${listTag}>`);
      list = [];
    }
  };

  for (const raw of lines) {
    if (code !== null) {
      if (raw.trim().startsWith('```')) {
        out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else code.push(raw);
      continue;
    }
    const line = raw.trim();

    if (line.startsWith('```')) {
      flushPara();
      flushList();
      code = [];
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      flushPara();
      flushList();
      const level = line.match(/^#+/)![0].length;
      out.push(`<h${level}>${inline(line.replace(/^#+\s*/, ''))}</h${level}>`);
      continue;
    }
    if (/^(>+\s?)/.test(line)) {
      flushPara();
      flushList();
      out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }
    if (line === '---' || line === '***' || line === '___') {
      flushPara();
      flushList();
      out.push('<hr />');
      continue;
    }
    if (/^[-*+]\s+/.test(line)) {
      flushPara();
      if (listTag !== 'ul') {
        flushList();
        listTag = 'ul';
      }
      list.push(inline(line.replace(/^[-*+]\s+/, '')));
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      if (listTag !== 'ol') {
        flushList();
        listTag = 'ol';
      }
      list.push(inline(line.replace(/^\d+\.\s+/, '')));
      continue;
    }
    if (line === '') {
      flushPara();
      flushList();
      continue;
    }
    para.push(raw.trim());
  }
  flushPara();
  flushList();
  if (code !== null) out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);

  return { html: out.join('\n'), safeLinks };
}

export function sanitizeUrl(u: string): string {
  const s = String(u ?? '').trim();
  if (/^(https?:|mailto:|tel:)/.test(s) || s.startsWith('/')) return s;
  return '';
}

export function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const categorySlug = toSlug;
export const tagSlug = toSlug;

export function readingTime(body: string): number {
  const words = (body || '').trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.round(words / 200));
}

export function excerptFromBody(body: string, len = 200): string {
  const text = (body || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*`_>[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > len ? text.slice(0, len).trimEnd() + '…' : text;
}

export function formatDate(d: Date, lang = 'en'): string {
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function isoDate(d: Date): string {
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}
