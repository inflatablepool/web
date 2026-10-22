const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ROOT = process.cwd();

const REPLACEMENTS = {
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/Inflatable Pool Factory factory.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-factory-building.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/design discuss2.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-design-discussion-2.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/design discuss original.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-design-discussion-original.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/PVC material.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-pvc-material-testing.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/Pressure Testing.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-pressure-testing.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/Stock Boat.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-stock-boat-inventory.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/UV Resistance Testing.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-uv-resistance-testing.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/sup making.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-sup-manufacturing.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/sup making3.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-sup-manufacturing-3.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/producing department.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-production-department.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/producing department2.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-production-department-2.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/about-banner.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/production-dept.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/academy-banner.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/tech-meeting-small.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/contact-banner.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/factory-gate.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/custom-banner.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/inflatable-pool-factory-hero-design-concept.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/products/fishing-banner.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/production-dept.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/factory-banner.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/factory-gate.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/process-banner.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/production-dept.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/production-workshop.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-production-department.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/quality-workshop.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-pvc-material-testing.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/rib-workshop.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/products/rib/inflatable-pool-factory-rib-330-boat.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/welding-workshop.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/producting department3.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/hero-5.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/factory-gate.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/hero-image.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/inflatable-pool-factory-hero-design-concept.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/hero-scenic.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/tech-meeting-small.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/boat man inflatable-pool-factory-min.jpeg':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/inflatable-pool-factory-hero-design-concept.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/production-workshop.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/factory/inflatable-pool-factory-production-department.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/trust-hero.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/hero/tech-meeting-small.webp',
  'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/products/rib-330.webp':
    'https://assets.inflatablepoolfactory.com/images/inflatable-pool-factory/products/rib/inflatable-pool-factory-rib-330-boat.webp',
};

const yamlFiles = glob.sync('src/data/pages/**/*.yaml').map((f) => path.join(ROOT, f));
let totalReplaced = 0;
let totalFiles = 0;

for (const filePath of yamlFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [oldUrl, newUrl] of Object.entries(REPLACEMENTS)) {
    const re = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const count = (content.match(re) || []).length;
    if (count > 0) {
      content = content.split(oldUrl).join(newUrl);
      totalReplaced += count;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content);
    totalFiles++;
  }
}

// Summary per replacement
console.log('Replacement summary:');
for (const [oldUrl, newUrl] of Object.entries(REPLACEMENTS)) {
  const oldName = oldUrl.split('/').pop();
  const newName = newUrl.split('/').pop();
  // Count by scanning files
  let c = 0;
  for (const filePath of yamlFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(newUrl)) c++;
  }
  if (c > 0) console.log('  ' + oldName + ' -> ' + newName + ' (' + c + ' files)');
}

console.log('---');
console.log('Total replacements: ' + totalReplaced);
console.log('Total files changed: ' + totalFiles);

// Verify
let missingCount = 0;
for (const f of yamlFiles) {
  const content = fs.readFileSync(f, 'utf8');
  for (const oldUrl of Object.keys(REPLACEMENTS)) {
    if (content.includes(oldUrl)) {
      console.error('STILL MISSING in ' + f.replace(ROOT + path.sep, '').replace(/\\/g, '/'));
      missingCount++;
    }
  }
}
if (missingCount === 0) console.log('All references updated successfully!');
