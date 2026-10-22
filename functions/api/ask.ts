interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  url: string;
}

const FAQ_CORPUS: FaqEntry[] = [
  {
    id: 'pool-setup-time',
    question: 'How long does it take to set up an inflatable pool?',
    answer:
      'Most Inflatable Pool Factory pools set up in 15–30 minutes. Unroll the pool on flat ground, connect the included pump, and inflate the drop stitch walls to the rated pressure. Then fill with water. Rectangular pools take slightly longer than round models due to their larger footprint.',
    keywords: ['set up', 'setup', 'assemble', 'assembly', 'inflate', 'installation', 'install', 'how long'],
    url: '/faq',
  },
  {
    id: 'drop-stitch-walls',
    question: 'What is a drop stitch pool?',
    answer:
      'Drop stitch construction connects the top and bottom layers of fabric with thousands of internal threads. When inflated, these threads lock the walls rigid like a hard-sided pool, so the pool keeps its shape at full water pressure while still folding away for storage.',
    keywords: ['drop stitch', 'dropstitch', 'drop-stitch', 'construction', 'technology', 'rigid'],
    url: '/faq',
  },
  {
    id: 'pool-water-capacity',
    question: 'How much water does an inflatable pool hold?',
    answer:
      'It depends on the model and fill level. Our round pools typically hold 1,500–5,000 liters at 80% fill; rectangular pools hold more. Always place the pool on ground that can support the combined weight of pool plus water before filling.',
    keywords: ['how much water', 'capacity', 'liters', 'litres', 'volume', 'gallons', 'hold'],
    url: '/faq',
  },
  {
    id: 'pool-ground-prep',
    question: 'What surface should I place the pool on?',
    answer:
      'Set the pool on firm, level ground free of stones, sticks, and sharp objects. A concrete pad, patio, or level lawn works well. We recommend a ground sheet underneath for extra protection. Never place the pool on sloped or soft ground.',
    keywords: ['surface', 'ground', 'place', 'placement', 'prepare', 'preparation', 'underneath', 'position'],
    url: '/faq',
  },
  {
    id: 'pool-filtration',
    question: 'Do I need a filter pump?',
    answer:
      'A cartridge filter pump keeps water clean and greatly extends the time between water changes. Inflatable Pool Factory pools have standard hose fittings that accept common 32mm or 38mm filter pumps, available separately or bundled with your order.',
    keywords: ['filter', 'pump', 'filtration', 'cartridge'],
    url: '/faq',
  },
  {
    id: 'pool-water-treatment',
    question: 'How do I keep the water clean?',
    answer:
      'Use standard pool chemicals: chlorine or bromine tablets in a floating dispenser, plus regular pH checks (7.2–7.6). Run the filter pump daily, skim debris, and cover the pool when not in use. With basic care, water can last several weeks before changing.',
    keywords: [
      'clean',
      'cleaning',
      'chemicals',
      'chlorine',
      'bromine',
      'ph',
      'treatment',
      'water quality',
      'keep',
      'water clean',
    ],
    url: '/faq',
  },
  {
    id: 'pool-repair',
    question: 'How do I repair a puncture?',
    answer:
      'Find the leak with soapy water, clean and dry the area, then apply a PVC patch with rounded corners from the included repair kit. Press firmly and wait 24 hours before reinflating. Small punctures are rare and typically take minutes to fix.',
    keywords: ['repair', 'puncture', 'leak', 'patch', 'hole', 'fix', 'patch kit'],
    url: '/faq',
  },
  {
    id: 'pool-storage',
    question: 'How do I store the pool for winter?',
    answer:
      'Drain the pool, clean it with mild soap, rinse thoroughly, and dry completely in the shade. Deflate, fold loosely, and store in the carry bag in a cool, dry place away from direct sunlight and freezing temperatures.',
    keywords: ['store', 'storage', 'winter', 'off-season', 'fold', 'pack away'],
    url: '/faq',
  },
  {
    id: 'pool-kids-safety',
    question: 'Are inflatable pools safe for children?',
    answer:
      'Yes, with basic supervision. Always watch children near water, empty small pools after use, and secure larger pools with a cover or ladder removal. Check local fencing regulations for pools above certain depths, and never leave children unattended.',
    keywords: ['children', 'kids', 'child', 'safe', 'safety', 'supervision', 'toddler', 'baby'],
    url: '/faq',
  },
  {
    id: 'pool-size-choice',
    question: 'What pool size should I choose?',
    answer:
      'Round pools suit families and casual swimming in smaller yards. Rectangular pools fit lap swimming and larger groups. Allow at least 1 meter of clear space around the pool, and check your available ground area against the pool dimensions before ordering.',
    keywords: [
      'size',
      'choose',
      'which pool',
      'round or rectangular',
      'rectangular or round',
      'dimensions',
      'space',
      'recommend',
      'backyard',
      'best',
      'small',
      'family',
      'family pool',
    ],
    url: '/faq',
  },
  {
    id: 'pool-with-cover',
    question: 'Do pools come with a cover?',
    answer:
      'Our round grey pool ships with a fitted debris cover included. Covers for other models are available as accessories. A cover keeps out leaves and insects, reduces evaporation, and helps maintain water temperature.',
    keywords: ['cover', 'lid', 'debris', 'pump'],
    url: '/faq',
  },
  {
    id: 'pool-lifespan',
    question: 'How long does an inflatable pool last?',
    answer:
      'With proper care, an Inflatable Pool Factory drop stitch pool lasts 5+ seasons of regular use. The UV-resistant, puncture-resistant PVC is built for repeated setup, takedown, and storage. Key factors are clean water chemistry, careful ground prep, and dry storage.',
    keywords: ['last', 'lifespan', 'lifetime', 'durable', 'durability', 'years', 'seasons', 'uv', 'pvc', 'material'],
    url: '/faq',
  },
  {
    id: 'pool-shipping',
    question: 'How long does shipping take?',
    answer:
      'In-stock orders ship within 2–3 business days. Delivery time depends on destination and order size — contact us at info@inflatablepoolfactory.com with your location and quantity for an accurate delivery estimate.',
    keywords: ['shipping', 'delivery', 'deliver', 'ship', 'arrive', 'dispatch', 'courier'],
    url: '/faq',
  },
  {
    id: 'pool-pricing',
    question: 'How much do Inflatable Pool Factory pools cost?',
    answer:
      'Each product page shows the current price with a Buy Now button, so you can order directly online with secure Stripe checkout. Wholesale pricing is available for bulk orders — contact info@inflatablepoolfactory.com for details.',
    keywords: ['price', 'pricing', 'cost', 'expensive', 'cheap', 'discount'],
    url: '/faq',
  },
  {
    id: 'pool-oem',
    question: 'Do you offer OEM/ODM services?',
    answer:
      'Yes. We offer custom sizes, colors, logos, covers, and packaging for businesses. Our factory handles everything from minor branding changes to fully custom pool designs. Minimum order quantities apply — contact us for details.',
    keywords: ['oem', 'odm', 'custom', 'logo', 'branding', 'white label', 'private label'],
    url: '/faq',
  },
  {
    id: 'pool-warranty',
    question: 'What is the Inflatable Pool Factory warranty?',
    answer:
      'Inflatable Pool Factory pools carry a limited manufacturer warranty covering defects in materials and workmanship under normal use. The warranty covers seams, valves, and fabric. Contact info@inflatablepoolfactory.com with your order details to start a claim.',
    keywords: ['warranty', 'guarantee', 'claim', 'defect', 'refund', 'return'],
    url: '/faq',
  },
  {
    id: 'pool-vs-steel',
    question: 'Inflatable pool or steel-frame pool?',
    answer:
      'Inflatable drop stitch pools are faster to set up, easier to store, softer against the body, and need no tools or metal frames. Steel-frame pools can look more permanent but rust, require more assembly, and are harder to store. For most backyards, inflatable is the practical choice.',
    keywords: ['steel', 'metal frame', 'frame pool', 'versus', 'vs', 'compare', 'difference'],
    url: '/faq',
  },
  {
    id: 'company-model',
    question: 'Is Inflatable Pool Factory a trading company or a manufacturer?',
    answer:
      'Inflatable Pool Factory is a brand company with its own manufacturing base. We design and produce every pool in our own facility and ship factory-direct worldwide. No middlemen — every order goes straight from our production line to you.',
    keywords: ['manufacturer', 'factory', 'trading company', 'who are you', 'where made', 'made in', 'company'],
    url: '/faq',
  },
];

const FALLBACK_ANSWER =
  "I couldn't find an exact answer to that. For questions about our inflatable drop stitch swimming pools, email us at info@inflatablepoolfactory.com — we usually reply within a few hours. You can also browse the FAQ and product pages for details.";

const GREETING_ANSWER =
  'Hello! Ask me anything about Inflatable Pool Factory inflatable drop stitch swimming pools — setup, sizes, prices, shipping, care, or warranty.';

const GREETING_RE = /^(hi|hello|hey|yo|good\s*(morning|afternoon|evening))\b/i;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreFaq(question: string, faq: FaqEntry): number {
  let score = 0;
  for (const keyword of faq.keywords) {
    const kw = normalize(keyword);
    if (!kw) continue;
    if (kw.includes(' ')) {
      if (question.includes(kw)) score += 2;
    } else if (new RegExp(`\\b${kw}\\b`).test(question)) {
      score += 1;
    }
  }
  return score;
}

const GENERIC_TOKENS = new Set([
  'i',
  'me',
  'my',
  'we',
  'our',
  'you',
  'your',
  'it',
  'its',
  'is',
  'are',
  'am',
  'was',
  'were',
  'be',
  'been',
  'do',
  'does',
  'did',
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'from',
  'by',
  'as',
  'what',
  'how',
  'why',
  'when',
  'where',
  'which',
  'who',
  'should',
  'would',
  'could',
  'can',
  'will',
  'shall',
  'may',
  'might',
  'must',
  'there',
  'that',
  'this',
  'these',
  'those',
  'come',
  'comes',
  'need',
  'get',
  'have',
  'has',
  'had',
  'pool',
  'pools',
  'inflatable',
  'Inflatable Pool Factory',
]);

function significantTokens(text: string): Set<string> {
  const tokens = normalize(text)
    .split(' ')
    .filter((w) => w.length > 1 && !GENERIC_TOKENS.has(w));
  return new Set(tokens);
}

export function findBestFaq(question: string): { faq: FaqEntry; score: number } | null {
  const questionTokens = significantTokens(question);
  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const faq of FAQ_CORPUS) {
    let score = scoreFaq(question, faq);
    const faqTokens = significantTokens(faq.question);
    let overlap = 0;
    for (const token of questionTokens) {
      if (faqTokens.has(token)) overlap++;
    }
    score += Math.min(overlap, 3);
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }
  return best ? { faq: best, score: bestScore } : null;
}

export const onRequestPost: (...args: any[]) => any = async (context: any) => {
  const { request } = context;

  let question = '';
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    question = String(body.question || '');
  } else {
    const form = await request.formData().catch(() => null);
    if (form) question = String(form.get('question') || '');
  }

  question = question.trim().slice(0, 500);
  if (!question) {
    return Response.json({ error: 'Missing question.' }, { status: 400 });
  }

  if (GREETING_RE.test(normalize(question))) {
    return Response.json({ answer: GREETING_ANSWER, sources: [] });
  }

  const normalized = normalize(question);
  const match = findBestFaq(normalized);

  if (match && match.score >= 2) {
    return Response.json({
      answer: match.faq.answer,
      sources: [{ title: `FAQ: ${match.faq.question}`, url: match.faq.url }],
    });
  }

  return Response.json({ answer: FALLBACK_ANSWER, sources: [] });
};

export const onRequest: (...args: any[]) => any = async (context: any) => {
  const { request } = context;
  return Response.json({ error: `Method ${request.method} not allowed. Use POST.` }, { status: 405 });
};
