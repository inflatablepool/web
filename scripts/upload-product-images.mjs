#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.join(ROOT, '.cache', 'webp-tmp');

const IMAGE_ROOT = 'D:\\Inflatable Pool Factory Aluminum Hull RIB boat图片';
const R2_BUCKET = 'inflatable-pool-factory-assets';
const R2_BASE_PATH = 'images/inflatable-pool-factory/products/rib';
const WEBP_QUALITY = 80;
const MAX_WIDTH = 2000;

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!API_TOKEN || !ACCOUNT_ID) {
  console.error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID env vars');
  console.error('Set them before running this script:');
  console.error('  $env:CLOUDFLARE_API_TOKEN="your-token"');
  console.error('  $env:CLOUDFLARE_ACCOUNT_ID="your-account-id"');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const NO_CONVERT = process.argv.includes('--no-convert');
const PRODUCT_ARG = process.argv.find((a) => a.startsWith('--product='));
const SINGLE_PRODUCT = PRODUCT_ARG ? PRODUCT_ARG.split('=')[1] : null;

const FOLDER_MAP = {
  ap330: 'Apex Performance\\Apex Performance 330 (AP330)',
  ap360: 'Apex Performance\\Apex Performance 360 (AP360)',
  ap390: 'Apex Performance\\Apex Performance 390 (AP390)',
  ap420: 'Apex Performance\\Apex Performance 420 (AP420)',
  ap460: 'Apex Performance\\Apex Performance 460 (AP460)',
  ap520: 'Apex Performance\\Apex Performance 520 (AP520)',
  ap560: 'Apex Performance\\Apex Performance 560 (AP560)',
  ap660: 'Apex Performance\\Apex Performance 660 (AP660)',
  ap700: 'Apex Performance\\Apex Performance 700 (AP700)',
  ap760: 'Apex Performance\\Apex Performance 760 (AP760)',
  ap800: 'Apex Performance\\Apex Performance 800 (AP800)',
  ap900: 'Apex Performance\\Apex Performance 900 (AP900)',
  df420: 'Defender\\Defender 420 (DF420)',
  df460: 'Defender\\Defender 460 (DF460)',
  df500: 'Defender\\Defender 500 (DF500)',
  df540: 'Defender\\Defender 540 (DF540)',
  'df540-coaster': 'Defender\\Defender 540 (DF540)',
  df600: 'Defender\\Defender 600 (DF600)',
  df700: 'Defender\\Defender 700 (DF700)',
  df760: 'Defender\\Defender 760 (DF760)',
  df860: 'Defender\\Defender 860 (DF860)',
  ex7: 'Explorer\\EX7',
  ex9: 'Explorer\\EX9',
  sw240: 'Swiftlitee\\Swiftlitee 240 (SW240)',
  sw260: 'Swiftlitee\\Swiftlitee 260 (SW260)',
  sw290: 'Swiftlitee\\Swiftlitee 290 (SW290)',
  sw310: null,
  sw340: null,
  vr260: 'Versa\\VR260)',
  vr290: 'Versa\\Versa 290 (VR290)',
  vr310: 'Versa\\Versa 310 (VR310)',
  vr340: 'Versa\\Versa 340 (VR340)',
  vr360: 'Versa\\Versa 360 (VR360)',
  vr380: 'Versa\\Versa 380 (VR380)',
  vr400: 'Versa\\Versa 400 (VR400)',
  vr420: 'Versa\\Versa 420 (VR420)',
  vr460: 'Versa\\Versa 460 (VR460)',
};

async function convertToWebp(srcPath, destPath) {
  await sharp(srcPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(destPath);
}

function getR2Key(slug, filename) {
  const webpName = filename.replace(/\.(jpg|jpeg|png|bmp|tiff?)$/i, '.webp');
  return `${R2_BASE_PATH}/${slug}/${webpName}`;
}

async function uploadToR2(key, buffer) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${key}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would upload: ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return true;
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'image/webp',
      },
      body: buffer,
    });

    if (res.ok) {
      console.log(`  Uploaded: ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return true;
    } else {
      const err = await res.text();
      console.error(`  Failed: ${key} - ${res.status} ${err}`);
      return false;
    }
  } catch (e) {
    console.error(`  Error: ${key} - ${e.message}`);
    return false;
  }
}

async function processProduct(slug) {
  const folder = FOLDER_MAP[slug];
  if (!folder) {
    console.log(`  Skipping ${slug} — no image folder`);
    return;
  }

  const fullPath = path.join(IMAGE_ROOT, folder);
  if (!fs.existsSync(fullPath)) {
    console.log(`  Skipping ${slug} — folder not found: ${fullPath}`);
    return;
  }

  const files = fs.readdirSync(fullPath).filter((f) => /\.(jpg|jpeg|png|bmp|webp)$/i.test(f));
  console.log(`  ${slug}: ${files.length} images in ${folder}`);

  let uploaded = 0;
  let failed = 0;

  const slugTmp = path.join(TMP_DIR, slug);
  if (!NO_CONVERT) fs.mkdirSync(slugTmp, { recursive: true });

  for (const file of files) {
    const srcPath = path.join(fullPath, file);
    const key = getR2Key(slug, file);

    let buffer;
    if (NO_CONVERT || file.toLowerCase().endsWith('.webp')) {
      buffer = fs.readFileSync(srcPath);
    } else {
      const tmpPath = path.join(slugTmp, file.replace(/\.[^.]+$/, '.webp'));
      try {
        await convertToWebp(srcPath, tmpPath);
        buffer = fs.readFileSync(tmpPath);
      } catch (e) {
        console.error(`  Convert failed: ${file} - ${e.message}`);
        failed++;
        continue;
      }
    }

    const ok = await uploadToR2(key, buffer);
    if (ok) uploaded++;
    else failed++;
  }

  console.log(`  ${slug}: ${uploaded} uploaded, ${failed} failed`);
}

async function main() {
  const slugs = Object.keys(FOLDER_MAP);
  const toProcess = SINGLE_PRODUCT ? [SINGLE_PRODUCT] : slugs;

  console.log(`\n=== Upload Product Images to R2 ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`WebP conversion: ${NO_CONVERT ? 'disabled' : `enabled (q=${WEBP_QUALITY}, max ${MAX_WIDTH}px)`}`);
  console.log(`Products: ${toProcess.length}`);
  console.log(`R2 Bucket: ${R2_BUCKET}`);
  console.log();

  if (!NO_CONVERT) fs.mkdirSync(TMP_DIR, { recursive: true });

  for (const slug of toProcess) {
    await processProduct(slug);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
