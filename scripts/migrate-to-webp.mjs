import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const ARCHIVE_DIR = path.join(ROOT_DIR, 'archive', 'source-images');

function getAllFiles(dir, exts = []) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(full, exts));
    } else {
      if (exts.length === 0 || exts.includes(path.extname(entry.name).toLowerCase())) {
        results.push(full);
      }
    }
  }
  return results;
}

// 1. Discover all unique image paths referenced in src/
console.log('=== Step 1: Scanning image references across src/ ===');
const srcFiles = getAllFiles(SRC_DIR, ['.astro', '.ts', '.json', '.mdoc', '.html']);
const referencedPaths = new Set();
const imgRegex = /(?:\/wp-content\/uploads\/|\/images\/)[^'"\s\)\>,]+\.(?:png|jpg|jpeg)/gi;

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    referencedPaths.add(match[0]);
  }
}

console.log(`Found ${referencedPaths.size} unique PNG/JPG references in templates and data.`);

// 2. Prepare archiving directory
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

// 3. Process each image with Sharp & archive original
console.log('\n=== Step 2: Converting images to WebP and archiving originals ===');
let totalOriginalBytes = 0;
let totalWebpBytes = 0;
const replacementMap = new Map(); // originalUrl -> webpUrl

for (const relUrl of referencedPaths) {
  const cleanRel = relUrl.replace(/^\//, '');
  const localSrcPath = path.join(PUBLIC_DIR, cleanRel);

  if (!fs.existsSync(localSrcPath)) {
    console.warn(`[SKIP - Not Found on disk]: ${relUrl}`);
    continue;
  }

  const originalStats = fs.statSync(localSrcPath);
  totalOriginalBytes += originalStats.size;

  const ext = path.extname(localSrcPath).toLowerCase();
  const webpRel = relUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const localWebpPath = localSrcPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  try {
    const buffer = fs.readFileSync(localSrcPath);
    const meta = await sharp(buffer).metadata();
    const origWidth = meta.width || 800;

    let pipeline = sharp(buffer);

    // Right-size oversized images
    // Mobile-specific hero or thumbnails capped at 800px
    if (cleanRel.includes('1024x683') && cleanRel.includes('Finance-with-Flow-Roz-Johnson4212-1')) {
      pipeline = pipeline.resize({ width: 800, withoutEnlargement: true });
    } else if (origWidth > 1920) {
      pipeline = pipeline.resize({ width: 1920, withoutEnlargement: true });
    }

    // Compression options
    if (meta.hasAlpha || ext === '.png') {
      // Crisp graphics, logos, circles
      if (cleanRel.includes('circle') || cleanRel.includes('logo') || cleanRel.includes('writing')) {
        pipeline = pipeline.webp({ quality: 95, effort: 6, nearLossless: true });
      } else {
        pipeline = pipeline.webp({ quality: 90, effort: 6 });
      }
    } else {
      // High-quality photographic WebP
      pipeline = pipeline.webp({ quality: 88, effort: 6 });
    }

    await pipeline.toFile(localWebpPath);
    const webpStats = fs.statSync(localWebpPath);
    totalWebpBytes += webpStats.size;

    replacementMap.set(relUrl, webpRel);

    // Archive original file
    const archiveDest = path.join(ARCHIVE_DIR, cleanRel);
    const archiveDestDir = path.dirname(archiveDest);
    if (!fs.existsSync(archiveDestDir)) {
      fs.mkdirSync(archiveDestDir, { recursive: true });
    }
    fs.copyFileSync(localSrcPath, archiveDest);
    fs.unlinkSync(localSrcPath);

    const savedKb = ((originalStats.size - webpStats.size) / 1024).toFixed(1);
    console.log(`✓ Converted & Archived: ${relUrl} -> .webp (-${savedKb} KB)`);
  } catch (err) {
    console.error(`Error converting ${relUrl}:`, err.message);
  }
}

console.log('\n=== Step 3: Updating template and data references ===');
let updatedFilesCount = 0;

for (const file of srcFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;

  for (const [origUrl, webpUrl] of replacementMap.entries()) {
    if (content.includes(origUrl)) {
      // Global replace
      content = content.replaceAll(origUrl, webpUrl);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(file, content, 'utf8');
    updatedFilesCount++;
    console.log(`Updated references in: ${path.relative(ROOT_DIR, file)}`);
  }
}

console.log('\n=== Summary ===');
console.log(`Total original image size: ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total WebP image size:     ${(totalWebpBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total payload saved:       ${((totalOriginalBytes - totalWebpBytes) / 1024 / 1024).toFixed(2)} MB`);
console.log(`Files with updated references: ${updatedFilesCount}`);
console.log(`Originals safely preserved in: ${path.relative(ROOT_DIR, ARCHIVE_DIR)}`);
