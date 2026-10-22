const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ROOT = process.cwd();
const yamlFiles = glob.sync('src/data/pages/**/*.yaml');
const context = {};
for (const f of yamlFiles) {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf('https://assets.inflatablepoolfactory.com/images/');
    if (idx === -1) continue;
    // Extract full URL until end of line or quote
    const after = line.substring(idx);
    const quoteMatch = after.match(
      /^https:\/\/assets\.Inflatable Pool Factory\.com\/(images\/[^"'\s}\])]+(?:\s+[^"'\s}\])]+)*)/
    );
    const urlPath = quoteMatch ? quoteMatch[1] : null;
    if (!urlPath) {
      // Try reading until end of line
      const eol = after.search(/[\s"']*(?:$|#)/);
      const rawPath = eol > 0 ? after.substring(0, eol) : after.trim();
      if (rawPath.includes('images/')) {
        // take everything after images/
        const imgIdx = rawPath.indexOf('images/');
        const fullUrlPath = rawPath.substring(imgIdx);
        if (!fs.existsSync(path.join(ROOT, 'public', fullUrlPath))) {
          if (!context[fullUrlPath]) context[fullUrlPath] = [];
          context[fullUrlPath].push(
            f.replace(/\\/g, '/') +
              ':' +
              (i + 1) +
              '  |  ' +
              lines[Math.max(0, i - 2)].trim() +
              '  |  ' +
              lines[i].trim()
          );
        }
      }
    } else {
      if (!fs.existsSync(path.join(ROOT, 'public', urlPath))) {
        if (!context[urlPath]) context[urlPath] = [];
        context[urlPath].push(
          f.replace(/\\/g, '/') + ':' + (i + 1) + '  |  ' + lines[Math.max(0, i - 2)].trim() + '  |  ' + lines[i].trim()
        );
      }
    }
  }
}
const missing = Object.keys(context).sort();
for (const m of missing) {
  console.log('=== ' + m + ' ===');
  const seen = new Set();
  for (const c of context[m]) {
    if (!seen.has(c)) {
      console.log('  ' + c);
      seen.add(c);
    }
  }
  console.log();
}
console.log('Total missing: ' + missing.length);
