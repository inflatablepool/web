#!/usr/bin/env node
/**
 * Import images from the "Inflatable Pool Factory Inflatable boats" source folder into
 * public/images/inflatable-pool-factory/products/<slug>/ as webp, using the site's
 * product sizing rules (800px, q80).
 *
 * Usage: node scripts/import-inflatable-images.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'D:\\OneDrive\\Website\\Inflatable Pool Factory\\Inflatable Pool Factory Inflatable boats';
const OUT_ROOT = path.resolve('public/images/inflatable-pool-factory/products');

const GROUPS = [
  {
    slug: 'high-speed-catamaran',
    subdir: 'High-Speed Inflatable Catamaran',
    files: [
      'Grand Prix Heritage.png',
      'Racing Sport Edition.png',
      'Nordic Expedition Edition.png',
      'Stealth Blade Edition.png',
      'Volt Phantom Edition.png',
      'Urban Camo & Safety Edition.png',
      'Digital Tech Camo.png',
      'Classic Army Green Camo.png',
      'Modern Urban Camo.png',
    ],
  },
  {
    slug: 'sib-aluminum-floor',
    subdir: 'Inflatable Boat',
    files: [
      'Navy Blue Pantone 289C.png',
      'Rescue Red Pantone 485C.png',
      'Arctic Grey Pantone 422C.png',
      'Black Pantone Black 6C.png',
      'Charcoal Pantone 432C.png',
      'Dark Grey Pantone 425C.png',
      'Olive Drab Pantone 7764C.png',
      '高级工业风（浅灰为主 + 明黄点缀）2.png',
    ],
  },
  {
    slug: 'sib-dropstitch-floor',
    subdir: 'Inflatable Boat',
    files: ['Two-tone-1.png', 'Two-tone-2.png', 'Two-tone-3.png', 'Two-tone-4.png'],
  },
  {
    slug: 'premium-dropstitch-seat',
    subdir: 'Inflatable Drop-Stitch Boat Seat',
    files: [
      'Inflatable Drop-Stitch Boat Seat 1.png',
      'Inflatable Drop-Stitch Boat Seat 2.png',
      'Inflatable Drop-Stitch Boat Seat 3.jpg',
      'Inflatable Drop-Stitch Boat Seat 4.png',
      'Inflatable Drop-Stitch Boat Seat 5.jpg',
    ],
  },
  {
    slug: 'kaboat',
    subdir: 'Inflatable Kaboat, Inflatable Catamaran Kayak',
    files: [
      'Gemini_Generated_Image_92qbl92qbl92qbl9.png',
      'Gemini_Generated_Image_cp7glscp7glscp7g.png',
      'Gemini_Generated_Image_qg3jmiqg3jmiqg3j.png',
      'Gemini_Generated_Image_s0bd1js0bd1js0bd.png',
      'Fire RedPANTONE 485 C.png',
      'Safety Yellow Pantone 116 C.png',
      'Rescue Orange(Pantone 1585 C).png',
      '高级工业风（浅灰为主 + 明黄点缀）1.png',
    ],
  },
  {
    slug: 'inflatable-catamaran-kayak',
    subdir: 'Inflatable Kaboat, Inflatable Catamaran Kayak',
    files: [
      'Army Green(Deep Olive).png',
      'Dark Gray.png',
      'Desert TanPantone 7530 C.png',
      'Cool Gray .png',
      'Pantone Cool Gray 4 C .png',
    ],
  },
  {
    slug: 'kayak-full-dropstitch',
    subdir: 'Inflatable Kayak\\Full Drop-Stitch Inflatable Kayak',
    files: [
      '1.png',
      '2.png',
      'Navy Blue & Matte Gold Line Art.png',
      'Storm Gray & Silver-White Line Art.png',
      'Aurora Ocean Mint Teal to Midnight Ocean.png',
      'Sunset Dusk Dusty Coral to Slate Blue.png',
      'OD Green & Digital Reef Camo.png',
      'Desert Tan & Digital Camo Utility.png',
      'Dark Walnut & Antique Bronze.png',
      'Teak Wood Grain & Leather Brown.png',
      'Teal.png',
    ],
  },
  {
    slug: 'kayak-hybrid',
    subdir: 'Inflatable Kayak\\Hybrid Inflatable Kayak',
    files: [
      'Teal to Deep Ocean Blue.png',
      'Cement Gray  Stealth Black.png',
      'Dusty Coral  Sunset Pink.png',
      'Midnight  Deep Navy Blue.png',
      'SageOlive Green.png',
      'Sandstone  Desert Tan.png',
      'Storm Gray  Pearl Gray.png',
      'Tactical Olive & Reef Camo.png',
      'Wood-Grain & Marble Textures.png',
    ],
  },
  {
    slug: 'whitewater-raft',
    subdir: 'Inflatable Raft',
    files: [
      'Bright Red Pantone 485 C.png',
      'Bright Bluepantong186C.png',
      'Classic Yellow Pantone 116 C.png',
      'Oceanic Blue.png',
      'Rock Gray Pantone 422 C.png',
      'Safety Orange Pantone 1645 C.png',
      'Flame Red  Rescue.png',
      'Mint Green & Cream White.png',
    ],
  },
  {
    slug: 'tactical-raft',
    subdir: 'Inflatable Raft',
    files: ['Tactical Olive  Forest.png', '(Olive Green).png', 'Canyon Desert  Tan.png', 'Bumblebee  Solar Flare.png'],
  },
  {
    slug: 'heavy-duty-raft-commercial',
    subdir: 'Inflatable Raft',
    files: ['9047d1f4-ee1c-4eac-8425-6d67b41fdbf2.jpg', 'Inflatable Thwarts.png', 'Cotton Candy Blue & Pink.png'],
  },
];

const missing = [];

async function main() {
  for (const group of GROUPS) {
    const outDir = path.join(OUT_ROOT, group.slug);
    fs.mkdirSync(outDir, { recursive: true });
    let n = 0;
    for (const f of group.files) {
      const src = path.join(SRC, group.subdir, f);
      if (!fs.existsSync(src)) {
        missing.push(`${group.subdir}/${f}`);
        continue;
      }
      n++;
      const dest = path.join(outDir, `inflatable-pool-factory-${group.slug}-${n}.webp`);
      const img = sharp(src);
      const meta = await img.metadata();
      const opts = {};
      if (meta.width && meta.width > 800) opts.width = 800;
      await img
        .resize({ ...opts, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(dest);
      console.log(`  OK ${group.slug}/${path.basename(dest)}  (${f})`);
    }
    console.log(`${group.slug}: ${n}/${group.files.length}`);
  }
  if (missing.length) {
    console.log(`\nMISSING (${missing.length}):`);
    missing.forEach((m) => console.log(`  - ${m}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
