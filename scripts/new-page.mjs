#!/usr/bin/env node
/**
 * new-page.mjs
 *
 * Create a new page/content type across all 12 languages at once.
 *
 * Usage:
 *   node scripts/new-page.mjs <type> <name> [options]
 *
 * Types:
 *   content <name>        Page content YAML for all 12 languages
 *   product <id>          Interactive: create MDX + products.ts + product-texts.ts
 *   news    <slug>        News article MDX
 *   tech    <slug>        Technology MD doc
 *   usecase <slug>        Case-use MD doc
 *   node    <id>          Knowledge graph node (interactive)
 *
 * Examples:
 *   node scripts/new-page.mjs content about-us
 *   node scripts/new-page.mjs product sup-racer-14
 *   node scripts/new-page.mjs news inflatable-pool-factory-new-factory
 *   node scripts/new-page.mjs tech carbon-fiber-kevlar
 *   node scripts/new-page.mjs usecase sailing-training
 *   node scripts/new-page.mjs node whitewater-kayak
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

// 鈹€鈹€ Constants 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const LOCALES = ['en', 'de', 'es', 'fr', 'it', 'pl', 'pt', 'ru', 'ar'];
const LANG_LABELS = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Russian',
  pl: 'Polski',
  ar: 'Arabic',
};

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// 鈹€鈹€ File helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

function read(p) {
  return fs.readFileSync(path.resolve(ROOT, p), 'utf-8');
}
function write(p, content) {
  const full = path.resolve(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
  console.log(`  鉁?${p}`);
}
function exists(p) {
  return fs.existsSync(path.resolve(ROOT, p));
}

// 鈹€鈹€ 1. Page Content YAML 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async function createPageContent(name) {
  name = slugify(name);
  const yaml = `# ${name} u2014 ${LANG_LABELS.en}
# TODO: fill in sections for ${LANG_LABELS.en}\n
hero:
  tagline: ''
  title: ''
  subtitle: ''
  image:
    src: ~/assets/images/default.png
    alt: ''

cta:
  title: ''
  subtitle: ''
  actions:
    - text: Contact us
      href: /contact
      variant: primary
`;

  for (const code of LOCALES) {
    if (!code || code === 'en') {
      // English goes to src/data/pages/
      const fp = `src/data/pages/${name}.yaml`;
      if (exists(fp)) {
        console.log(`  鈼?${fp} (exists, skipped)`);
        continue;
      }
      write(fp, yaml);
    } else {
      const fp = `src/data/pages/${code}/${name}.yaml`;
      if (exists(fp)) {
        console.log(`  鈼?${fp} (exists, skipped)`);
        continue;
      }
      const localized = yaml.replace(
        `# ${name} u2014 ${LANG_LABELS.en}`,
        `# ${name} u2014 ${LANG_LABELS[code]}\n# TODO: translate to ${LANG_LABELS[code]}`
      );
      write(fp, localized);
    }
  }
  console.log(`\nNext: register in src/content.config.ts if it's a new collection.`);
  console.log(`      Register the Astro route in src/pages/[lang]/ if needed.`);
}

// 鈹€鈹€ 2. Product 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async function createProduct(id) {
  id = slugify(id);
  const mdx = `src/content/products/${id}.mdx`;
  if (exists(mdx)) {
    console.log(`  鉁?${mdx} already exists. Aborting.`);
    return;
  }

  console.log(`\nCreating product: ${id}`);
  const title = await ask('  Product name (e.g. "SUP Racer 14"): ');
  const sku = await ask('  SKU (e.g. "SUP-R14"): ');
  const category = await ask('  Category (SUP|KAYAK|DINGHY|RIB|SAFETY|ACCESSORY): ');
  const summary = await ask('  Short summary (one line): ');

  const ext = id === 'rib-450-patrol' ? 'jpg' : 'jpg';
  const mdxContent = `---
publishDate: ${new Date().toISOString().slice(0, 10)}
title: ${title}
sku: ${sku}
summary: ${summary}
description: ${summary}
image: /images/inflatable-pool-factory/products/${id}.${ext}
gallery:
  - url: /images/inflatable-pool-factory/products/${id}.${ext}
    alt: ${title}
category: ${slugify(category)}
tags:
  - ${slugify(category)}
specs:
  - label: Type
    value: ${category}
price: {}
inStock: true
featured: false
metadata:
  title: ${title}
  description: ${summary}
---
`;
  write(mdx, mdxContent);

  // Append to products.ts
  const idField = JSON.stringify(id);
  const nameField = JSON.stringify(title);
  const catField = JSON.stringify(category.toUpperCase());
  const desc = summary;
  const productEntry = `
  {
    id: ${idField},
    name: ${nameField},
    category: ${catField},
    region: ['GLOBAL'],
    skill: 'beginner',
    environment: ['all'],
    water_condition: ['calm'],
    safety_level: 'medium',
    use_case: ['recreation'],
    safety_rules: ['follow manufacturer guidelines'],
    desc: ${JSON.stringify(desc)},
    definition: ${JSON.stringify(desc)},
    problem: 'TODO',
    howItWorks: 'TODO',
    audience: 'TODO',
    ai_use_cases: ['TODO'],
    ai_specs: { type: 'TODO' },
    ai_comparison: 'TODO',
    ai_faq: [
      { q: 'TODO', a: 'TODO' },
    ],
  },
];`; // includes closing bracket

  const productsPath = 'src/data/products.ts';
  let pContent = read(productsPath);
  // Replace the last ]; with the new entry + ];
  pContent = pContent.replace(/\n\];\s*$/, '');
  write(productsPath, pContent + productEntry);

  // Append to product-texts.ts for all 11 languages
  const textsPath = 'src/data/product-texts.ts';
  let tContent = read(textsPath);
  // Close the file properly u2014 find last `};` and insert before
  const textEntry = `
  ${idField}: {
    name: ${nameField},
    desc: ${JSON.stringify(`TODO: translate ${desc}`)},
    definition: ${JSON.stringify(`TODO: translate ${desc}`)},
    problem: 'TODO: translate',
    howItWorks: 'TODO: translate',
    audience: 'TODO: translate',
    ai_use_cases: ['TODO: translate'],
    ai_comparison: 'TODO: translate',
    ai_faq: [
      { q: 'TODO: translate', a: 'TODO: translate' },
    ],
  },
`;

  for (const code of LOCALES.filter((l) => l !== 'en')) {
    const marker = `  ${code}: {`;
    const idx = tContent.indexOf(marker);
    if (idx === -1) {
      console.log(`  鈼?${code} block not found in product-texts.ts, insert manually`);
      continue;
    }
    // Find the last } before the next language block or end
    const blockStart = idx + marker.length;
    const rest = tContent.slice(blockStart);
    // Find the matching closing brace
    let depth = 1;
    let closeIdx = -1;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '{') depth++;
      if (rest[i] === '}') {
        depth--;
        if (depth === 0) {
          closeIdx = i;
          break;
        }
      }
    }
    if (closeIdx === -1) {
      console.log(`  鉁?Could not parse ${code} block`);
      continue;
    }
    const blockEnd = blockStart + closeIdx;
    // Insert the new product before the last closing brace of this language block
    const lastBrace = tContent.lastIndexOf('}', blockEnd);
    const before = tContent.slice(0, lastBrace);
    const after = tContent.slice(lastBrace);
    tContent = before + textEntry + after;
    console.log(`  鉁?${code} product-texts.ts (appended)`);
  }

  write(textsPath, tContent);
  console.log(`\nNext: add translations to product-texts.ts for field values marked TODO.`);
}

// 鈹€鈹€ 3. News 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async function createNews(slug) {
  slug = slugify(slug);
  const file = `src/content/news/${slug}.mdx`;
  if (exists(file)) {
    console.log(`  鉁?${file} already exists.`);
    return;
  }

  const title = await ask('  Article title: ');
  const category = await ask('  Category (e.g. "Company News", "Product Launch"): ');
  const excerpt = await ask('  Excerpt (one line): ');

  const content = `---
publishDate: ${new Date().toISOString()}
title: "${title}"
excerpt: '${excerpt}'
image: /images/inflatable-pool-factory/news/${slug}.jpg
tags: []
category: ${category}
author: Inflatable Pool Factory Team
metadata:
  title: '${title}'
  description: '${excerpt}'
---

${title}

TODO: write article content here.
`;
  write(file, content);
  console.log(`\nNext: add a news image to public/images/inflatable-pool-factory/news/${slug}.jpg`);
}

// 鈹€鈹€ 4. Technology 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async function createTech(slug) {
  slug = slugify(slug);
  const file = `src/data/technology/${slug}.md`;
  if (exists(file)) {
    console.log(`  鉁?${file} already exists.`);
    return;
  }

  const title = await ask('  Technology title: ');
  const summary = await ask('  Summary (one line): ');

  const content = `---
publishDate: ${new Date().toISOString().slice(0, 10)}
title: ${title}
summary: ${summary}
description: ${summary}
category: technology
tags:
  - ${slug}
entityType: technology
---

${summary}

TODO: write detailed technology description.
`;
  write(file, content);
}

// 鈹€鈹€ 5. Case Use 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async function createCaseUse(slug) {
  slug = slugify(slug);
  const file = `src/data/case-use/${slug}.md`;
  if (exists(file)) {
    console.log(`  鉁?${file} already exists.`);
    return;
  }

  const title = await ask('  Use case title: ');
  const summary = await ask('  Summary (one line): ');
  const products = await ask('  Related product IDs (comma-separated, e.g. "kayak-tandem,airdeck-360"): ');

  const content = `---
publishDate: ${new Date().toISOString().slice(0, 10)}
title: ${title}
summary: ${summary}
description: ${summary}
category: recreation
environment: lake
skill: beginner
products:
  ${products
    .split(',')
    .map((p) => `  - ${p.trim()}`)
    .join('\n')}
tags:
  - ${slug}
entityType: case-use
---

${summary}

TODO: write detailed use case description.
`;
  write(file, content);
}

// 鈹€鈹€ 6. Knowledge Graph Node 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

async function createNode(id) {
  id = slugify(id);
  const types = ['product-category', 'technology', 'material', 'use-case', 'component', 'concept'];
  const nodesPath = 'src/content/graph/nodes.ts';

  console.log(`\nCreating graph node: ${id}`);
  const typeIdx = await ask(`  Type (${types.join(', ')}): `);
  const type = types.find((t) => t.startsWith(typeIdx)) || typeIdx;
  const name = await ask(`  English name: `);

  const slugValues = LOCALES.map((l) => `${l}: '${id}'`).join(', ');
  const entry = `
  {
    id: '${id}',
    type: '${type}',
    name: {"en":"${name}"},
    description: {"en":"TODO"},
    features: {
      en: ["TODO"],
    },
    useCases: {
      en: ["TODO"],
    },
    faq: {
      en: [
        { q: "TODO", a: "TODO" },
      ],
    },
    related: [],
    slug: { ${slugValues} },
  },
`;

  let content = read(nodesPath);
  content = content.replace(/\n\];\s*$/, '');
  write(nodesPath, content + entry + '\n];');
  console.log(`\nNext: add per-language name/description/features/faq in src/content/graph/nodes.ts`);
}

// 鈹€鈹€ Main 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

const [, , type, name] = process.argv;

if (!type || !name) {
  console.log(`Usage: node scripts/new-page.mjs <type> <name>

Types:
  content <name>     Page content YAML for all 12 languages
  product <id>       Interactive product creation (MDX + data + translations)
  news    <slug>     News article MDX
  tech    <slug>     Technology MD doc
  usecase <slug>     Case-use MD doc
  node    <id>       Knowledge graph node with per-language fields
`);
  process.exit(1);
}

const handlers = {
  content: createPageContent,
  page: createPageContent,
  product: createProduct,
  news: createNews,
  tech: createTech,
  technology: createTech,
  usecase: createCaseUse,
  'case-use': createCaseUse,
  caseuse: createCaseUse,
  node: createNode,
};

const handler = handlers[type];
if (!handler) {
  console.error(`Unknown type: ${type}`);
  console.log(`Valid types: content, page, product, news, tech, usecase, node`);
  process.exit(1);
}

console.log(`=== New Page: ${type} "${name}" ===\n`);
await handler(name);
rl.close();
console.log(`\n=== Done ===`);
