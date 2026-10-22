import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public', 'images', 'Inflatable Pool Factory');
const srcAssetsDir = path.join(projectRoot, 'src', 'assets', 'images');

const BASE = 'D:\\OneDrive\\Daily work\\E3\\processing\\Inflatable Pool Factory';
const BOATS = path.join(BASE, 'boats');
const PADDLE = path.join(BASE, 'paddle');
const ACC = path.join(BASE, 'paddles-and-accessories');
const AQUA =
  'D:\\OneDrive\\Daily work\\E3\\processing\\Inflatable Pool Factory Helen\\鍏徃鏂囦欢\\Inflatable Pool Factory\\鍥剧墖';

function normalize(p) {
  return p.replace(/\\/g, '/');
}

function find(patterns) {
  for (const p of patterns) {
    const results = globSync(normalize(p), { nocase: true });
    if (results.length > 0) {
      results.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
      return results[0];
    }
  }
  return null;
}

const imageMap = [
  // HERO
  { src: [path.join(BASE, 'IMG_20210217_234528.jpg')], dest: 'hero/hero-scenic.png', w: 1920, q: 85 },
  { src: [path.join(PADDLE, '**/*FLYAIR-PREMIUM*')], dest: 'hero/hero-3.jpg', w: 1920, q: 85 },
  { src: [path.join(PADDLE, '**/*NRS12*')], dest: 'hero/hero-4.jpg', w: 1920, q: 85 },
  { src: [path.join(PADDLE, '**/*RAPID-AIR-TOURING*')], dest: 'hero/hero-5.jpg', w: 1920, q: 85 },
  { src: [path.join(PADDLE, '**/*HALAPLAYA*')], dest: 'hero/hero-7.jpg', w: 1920, q: 85 },

  // CATEGORIES
  { src: [path.join(PADDLE, '**/*ALAnA116*')], dest: 'categories/sup-touring.png', w: 800, q: 80 },
  {
    src: [path.join(BOATS, '**/c5e7a92b9002bcd7c6368e6b0f6ae6e8*')],
    dest: 'categories/kayak-river.jpg',
    w: 800,
    q: 80,
  },
  { src: [path.join(BOATS, '**/45b3856f186a2195d1b36446271468f0*')], dest: 'categories/dinghy.jpg', w: 800, q: 80 },
  { src: [path.join(BOATS, '**/b3d5a5e5b14720aedde1b05976abcd95*')], dest: 'categories/rib.jpg', w: 800, q: 80 },
  {
    src: [path.join(ACC, '**/life jackets.png'), path.join(ACC, '**/*life*jacket*')],
    dest: 'categories/life-jacket.png',
    w: 800,
    q: 80,
  },
  {
    src: [path.join(ACC, '**/sup_paddles.png'), path.join(ACC, '**/*sup*paddle*')],
    dest: 'categories/accessories.png',
    w: 800,
    q: 80,
  },

  // PRODUCTS
  { src: [path.join(PADDLE, '**/*ALAnA116*')], dest: 'products/sup-allround.jpg', w: 800, q: 80 },
  { src: [path.join(PADDLE, '**/*NRS12*')], dest: 'products/sup-touring.jpg', w: 800, q: 80 },
  { src: [path.join(PADDLE, '**/9-10-THRIVE*')], dest: 'products/rk-river.jpg', w: 800, q: 80 },
  { src: [path.join(PADDLE, '**/*ERS96DUAL*')], dest: 'products/rk-expedition.jpg', w: 800, q: 80 },
  { src: [path.join(BOATS, '**/60475f01e5a30889b35abf2459a11b15*')], dest: 'products/airdeck-270.jpg', w: 800, q: 80 },
  { src: [path.join(BOATS, '**/19de621df6d16a159245ef51fae3d4d6*')], dest: 'products/airdeck-360.jpg', w: 800, q: 80 },
  { src: [path.join(BOATS, '**/ach_rv-126sb*')], dest: 'products/rib-330.jpg', w: 800, q: 80 },
  { src: [path.join(BOATS, '**/ach_hb-270ax*')], dest: 'products/rib-450-patrol.jpg', w: 800, q: 80 },
  {
    src: [path.join(ACC, '**/life jackets.png'), path.join(ACC, '**/*life*jacket*')],
    dest: 'products/life-jacket.png',
    w: 800,
    q: 80,
  },
  { src: [path.join(ACC, '**/40030_02_Charcoal*')], dest: 'products/life-jacket-2.jpg', w: 800, q: 80 },
  {
    src: [path.join(ACC, '**/sup_paddles.png'), path.join(ACC, '**/*sup*paddle*')],
    dest: 'products/sup-paddle.jpg',
    w: 800,
    q: 80,
  },
  { src: [path.join(ACC, '**/43002_03_Carbon*')], dest: 'products/electric-pump.jpg', w: 800, q: 80 },

  // USE CASES
  { src: [path.join(PADDLE, '**/*109Green*')], dest: 'use-cases/beginner.jpg', w: 800, q: 80 },
  { src: [path.join(PADDLE, '**/*Ride9*')], dest: 'use-cases/outdoor.jpg', w: 800, q: 80 },
  { src: [path.join(AQUA, '**/producting department3*')], dest: 'use-cases/professional.jpg', w: 800, q: 80 },
  { src: [path.join(PADDLE, '**/*skylake109*')], dest: 'use-cases/family.jpg', w: 800, q: 80 },

  // NEWS
  { src: [path.join(AQUA, '**/producing department*')], dest: 'news/supply-chain.jpg', w: 800, q: 80 },
  { src: [path.join(AQUA, '**/PVC material*')], dest: 'news/quality.jpg', w: 800, q: 80 },
  { src: [path.join(PADDLE, '**/*100AQUA*')], dest: 'news/outdoor.jpg', w: 800, q: 80 },
  { src: [path.join(BOATS, '**/922fdd40-9e8d-4477-bc03-54d7ad775352*')], dest: 'news/dealers.jpg', w: 800, q: 80 },
  { src: [path.join(BOATS, '**/c437b3c40f7db3def52c39bdb66a633f*')], dest: 'categories/rescue.jpg', w: 800, q: 80 },
];

async function main() {
  // ensure dirs
  for (const sub of ['hero', 'categories', 'products', 'use-cases', 'news']) {
    fs.mkdirSync(path.join(publicDir, sub), { recursive: true });
  }

  for (const item of imageMap) {
    const srcPath = find(item.src);
    if (!srcPath) {
      console.log(`SKIP: ${item.dest} (not found)`);
      continue;
    }
    const destPath = path.join(publicDir, item.dest);
    const ext = path.extname(item.dest);
    const format = ext === '.png' ? 'png' : 'jpeg';
    try {
      const info = await sharp(srcPath).metadata();
      const width = info.width > item.w ? item.w : undefined; // only downsize
      const opts = {};
      if (width) opts.width = width;
      const ext = format;
      const resized = sharp(srcPath).resize({ ...opts, fit: 'inside', withoutEnlargement: true });
      await resized[ext]({ quality: item.q }).toFile(destPath);
      const kb = (fs.statSync(destPath).size / 1024).toFixed(0);
      console.log(`OK: ${item.dest} (${kb}KB)`);
    } catch (err) {
      console.log(`FAIL: ${item.dest} -> ${err.message}`);
    }
  }

  // Default OG images
  const heroScenic = path.join(publicDir, 'hero', 'hero-scenic.png');
  if (fs.existsSync(heroScenic)) {
    await sharp(heroScenic).resize(1200, 630).png().toFile(path.join(srcAssetsDir, 'default.png'));
    console.log('OK: src/assets/images/default.png');
    await sharp(heroScenic).resize(1920).png().toFile(path.join(srcAssetsDir, 'hero-image.png'));
    console.log('OK: src/assets/images/hero-image.png');
  }
}

main().catch(console.error);
