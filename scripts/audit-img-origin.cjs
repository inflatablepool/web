/**
 * audit-img-origin.cjs — count <img> srcs by origin across dist.
 * Report relative /images or /files srcs (they cost a worker 301 hop),
 * R2-absolute srcs, and everything else.
 */
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(process.cwd(), process.argv[2] || 'dist');
let total = 0;
let relative = 0;
let assetsAbs = 0;
let other = 0;
const pagesWithRel = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') {
      const html = fs.readFileSync(p, 'utf8');
      let rel = 0;
      for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
        const src = (m[0].match(/src="([^"]+)"/) || [])[1] || '';
        total++;
        if (src.startsWith('/images/') || src.startsWith('/files/')) {
          relative++;
          rel++;
        } else if (src.startsWith('https://assets.inflatablepoolfactory.com')) assetsAbs++;
        else other++;
      }
      if (rel) pagesWithRel.set(path.relative(dist, p), rel);
    }
  }
})(dist);
console.log({ total, relative, assetsAbs, other });
const entries = [...pagesWithRel.entries()].sort((a, b) => b[1] - a[1]);
console.log('pages with relative img src:', entries.length);
for (const [p, n] of entries.slice(0, 12)) console.log('  ', p, n);
