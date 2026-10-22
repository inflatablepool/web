const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ROOT = process.cwd();
const yamlFiles = glob.sync('src/data/pages/**/*.yaml');
const allRefs = {};
for (const f of yamlFiles) {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  // Match all assets.inflatablepoolfactory.com URLs including unquoted ones
  const re = /https:\/\/assets\.Inflatable Pool Factory\.com\/(images\/[^"'\s\])>}]+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const refPath = m[1];
    if (!allRefs[refPath]) allRefs[refPath] = { count: 0, files: [] };
    allRefs[refPath].count++;
    if (allRefs[refPath].files.length < 3) allRefs[refPath].files.push(f.replace(/\\/g, '/'));
  }
}
console.log('All unique image refs in YAML files:');
const refNames = Object.keys(allRefs).sort();
for (const r of refNames) {
  const exists = fs.existsSync(path.join(ROOT, 'public', r));
  const info = allRefs[r];
  console.log((exists ? 'OK  ' : 'MISS') + ' [' + info.count + 'x] ' + r + '  (e.g. ' + info.files[0] + ')');
}
console.log('---');
console.log('Total unique refs:', refNames.length);
console.log('Missing:', refNames.filter((r) => !fs.existsSync(path.join(ROOT, 'public', r))).length);
