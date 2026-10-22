#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST_BASE = path.join(ROOT, 'public', 'images', 'Inflatable Pool Factory', 'products', 'rib');
const IMAGE_ROOT = 'D:\\Inflatable Pool Factory Aluminum Hull RIB boat图片';
const WEBP_QUALITY = 80;
const MAX_WIDTH = 2000;

const FOLDER_MAP = {
  ap330: 'Apex Performance\\AP330',
  ap360: 'Apex Performance\\AP360',
  ap390: 'Apex Performance\\AP390',
  ap420: 'Apex Performance\\AP420',
  ap460: 'Apex Performance\\AP460',
  ap520: 'Apex Performance\\AP520',
  ap560: 'Apex Performance\\AP560',
  ap660: 'Apex Performance\\AP660',
  ap700: 'Apex Performance\\AP700',
  ap760: 'Apex Performance\\AP760',
  ap800: 'Apex Performance\\AP800',
  ap900: 'Apex Performance\\AP900',
  df420: 'Defender\\DF420',
  df460: 'Defender\\DF460',
  df500: 'Defender\\DF500',
  df540: 'Defender\\DF540',
  'df540-coaster': 'Defender\\DF540 Coaster-style Console',
  df600: 'Defender\\DF600',
  df700: 'Defender\\DF700',
  df760: 'Defender\\DF760',
  df860: 'Defender\\DF860',
  ex7: 'Explorer\\EX7',
  ex9: 'Explorer\\EX9',
  sw240: 'Swiftlitee\\Swiftlitee 240 (SW240)',
  sw260: 'Swiftlitee\\Swiftlitee 260 (SW260)',
  sw290: 'Swiftlitee\\SW290',
  vr260: 'Versa\\VR260)',
  vr290: 'Versa\\VR290',
  vr310: 'Versa\\VR310',
  vr340: 'Versa\\VR340',
  vr360: 'Versa\\VR360',
  vr380: 'Versa\\VR380',
  vr400: 'Versa\\VR400',
  vr420: 'Versa\\VR420',
  vr460: 'Versa\\VR460',
};

function toWebpName(_slug, srcName) {
  let base = srcName.replace(/\.[^.]+$/, '');
  base = base.replace(/^Inflatable Pool Factory\s+/i, '');
  base = base.replace(/^AP(\d+)\s+/i, 'AP$1-');
  base = base.replace(/^DF(\d+)\s+/i, 'DF$1-');
  base = base.replace(/^VR(\d+)\s+/i, 'VR$1-');
  base = base.replace(/^SW(\d+)\s+/i, 'SW$1-');
  base = base.replace(/^EX(\d+)\s+/i, 'EX$1-');
  base = base.replace(/&/g, 'and');
  base = base.replace(/[^a-zA-Z0-9]+/g, '-');
  base = base.replace(/^-+|-+$/g, '');
  base = base.toLowerCase();
  return `${base}.webp`;
}

async function processProduct(slug) {
  const folder = FOLDER_MAP[slug];
  if (!folder) {
    console.log(`  SKIP ${slug} — no folder mapping`);
    return { converted: 0, skipped: 0, errors: 0 };
  }

  const srcDir = path.join(IMAGE_ROOT, folder);
  if (!fs.existsSync(srcDir)) {
    console.log(`  SKIP ${slug} — folder not found: ${srcDir}`);
    return { converted: 0, skipped: 0, errors: 0 };
  }

  const srcFiles = fs.readdirSync(srcDir).filter((f) => /\.(jpg|jpeg|png|bmp|tiff?|webp)$/i.test(f));
  if (srcFiles.length === 0) {
    console.log(`  SKIP ${slug} — no image files`);
    return { converted: 0, skipped: 0, errors: 0 };
  }

  const destDir = path.join(DEST_BASE, slug);
  fs.mkdirSync(destDir, { recursive: true });

  let converted = 0;
  let skipped = 0;
  let errors = 0;

  for (const srcFile of srcFiles) {
    const webpName = toWebpName(slug, srcFile);
    const destPath = path.join(destDir, webpName);
    const srcPath = path.join(srcDir, srcFile);

    if (fs.existsSync(destPath)) {
      skipped++;
      continue;
    }

    try {
      if (srcFile.toLowerCase().endsWith('.webp')) {
        fs.copyFileSync(srcPath, destPath);
      } else {
        await sharp(srcPath)
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(destPath);
      }
      converted++;
    } catch (e) {
      console.error(`    ERROR: ${srcFile}: ${e.message}`);
      errors++;
    }
  }

  console.log(
    `  ${slug}: ${converted} converted, ${skipped} existing, ${errors} errors (from ${srcFiles.length} source files)`
  );
  return { converted, skipped, errors };
}

async function main() {
  const slugs = Object.keys(FOLDER_MAP);
  let totalConverted = 0,
    totalSkipped = 0,
    totalErrors = 0;

  console.log(`\n=== Convert & Copy Product Images ===`);
  console.log(`Source: ${IMAGE_ROOT}`);
  console.log(`Dest:   ${DEST_BASE}`);
  console.log(`Products: ${slugs.length}\n`);

  for (const slug of slugs) {
    const r = await processProduct(slug);
    totalConverted += r.converted;
    totalSkipped += r.skipped;
    totalErrors += r.errors;
  }

  console.log(`\n=== Done ===`);
  console.log(`Converted: ${totalConverted}, Existing: ${totalSkipped}, Errors: ${totalErrors}`);
}

main().catch(console.error);
