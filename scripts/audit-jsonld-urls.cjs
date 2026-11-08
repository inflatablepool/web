/**
 * audit-jsonld-urls.cjs — scan all dist index.html JSON-LD blobs for
 * site-relative URL fields. Fragment @ids (/#organization) are intentional.
 * Expected result: 0 pages with relative URLs.
 */
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(process.cwd(), process.argv[2] || 'dist');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const samples = new Map();
let pagesWithRelative = 0;

for (const file of walk(dist)) {
  const html = fs.readFileSync(file, 'utf8');
  let hit = false;
  for (const b of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j;
    try {
      j = JSON.parse(b[1]);
    } catch {
      continue;
    }
    const stack = [{ obj: j }];
    while (stack.length) {
      const { obj, key } = stack.pop();
      if (Array.isArray(obj)) {
        for (const v of obj) stack.push(key ? { obj: v, key } : { obj: v });
        continue;
      }
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string') {
            if (k === '@id' && v.startsWith('/') && !/^\/#/.test(v)) {
              record(k, v, file);
              hit = true;
            } else if (v.startsWith('/') && /^\/\w/.test(v)) {
              record(k, v, file);
              hit = true;
            }
          } else if (v && typeof v === 'object') {
            stack.push({ obj: v, key: k });
          }
        }
      }
    }
  }
  if (hit) pagesWithRelative++;
}

function record(key, value, file) {
  const rel = key + ' ' + value.slice(0, 80);
  if (!samples.has(rel)) samples.set(rel, path.relative(dist, file).replace(/\\/g, '/'));
}

console.log('pages with relative JSON-LD urls:', pagesWithRelative);
for (const [k, v] of samples) console.log(' ', k, '<-', v);
console.log('total distinct:', samples.size);
