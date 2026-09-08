import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Deletions are OPT-IN. Running this script unguarded previously removed images
 * that pages still referenced, breaking the Packages and Meet the Team pages.
 * Pass --delete (or ALLOW_DELETE=1) only when you have verified what will go.
 */
const ALLOW_DELETE =
  process.argv.includes('--delete') || process.env.ALLOW_DELETE === '1';

/** Guarded unlink: logs what *would* be removed unless deletion is enabled. */
function safeUnlink(filePath) {
  if (!ALLOW_DELETE) {
    console.log(`   [dry-run] would delete: ${path.relative(ROOT_DIR, filePath)}`);
    return false;
  }
  fs.unlinkSync(filePath);
  return true;
}

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const POSTS_IMG_DIR = path.join(PUBLIC_DIR, 'images', 'posts');
const CONTENT_POSTS_DIR = path.join(ROOT_DIR, 'src', 'content', 'posts');

async function main() {
  console.log('=== Starting Image Optimization & Asset Cleanup ===\n');
  let totalSavedBytes = 0;

  // 1. DELETE LOOSE DUPLICATE FILES IN public/images/posts/
  console.log('--- 1. Removing loose duplicate post images in public/images/posts/ ---');
  if (fs.existsSync(POSTS_IMG_DIR)) {
    const looseFiles = fs.readdirSync(POSTS_IMG_DIR, { withFileTypes: true });
    for (const item of looseFiles) {
      if (item.isFile()) {
        const filePath = path.join(POSTS_IMG_DIR, item.name);
        const stats = fs.statSync(filePath);
        totalSavedBytes += stats.size;
        if (!safeUnlink(filePath)) continue;
        console.log(`Deleted loose duplicate: ${item.name} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    }
  }

  // 2. DELETE UNUSED WORDPRESS TEST ASSETS (e.g. 2026/06 pillow)
  console.log('\n--- 2. Removing unused WordPress test uploads ---');
  const unusedPillowDir = path.join(PUBLIC_DIR, 'wp-content', 'uploads', '2026', '06');
  if (fs.existsSync(unusedPillowDir)) {
    const pillowFiles = fs.readdirSync(unusedPillowDir);
    for (const f of pillowFiles) {
      const p = path.join(unusedPillowDir, f);
      const s = fs.statSync(p).size;
      totalSavedBytes += s;
      if (!safeUnlink(p)) continue;
      console.log(`Deleted unused asset: 2026/06/${f} (${(s / 1024 / 1024).toFixed(2)} MB)`);
    }
    if (ALLOW_DELETE) fs.rmdirSync(unusedPillowDir);
  }

  // 3. CONVERT BLOG POST FEATURED IMAGES TO HIGH-FIDELITY WEBP WITH RETINA VARIANTS
  console.log('\n--- 3. Generating Retina WebP variants for all blog posts ---');
  if (fs.existsSync(POSTS_IMG_DIR)) {
    const postDirs = fs.readdirSync(POSTS_IMG_DIR, { withFileTypes: true }).filter(d => d.isDirectory());

    for (const dir of postDirs) {
      const postSlug = dir.name;
      const dirPath = path.join(POSTS_IMG_DIR, postSlug);
      const files = fs.readdirSync(dirPath);

      // Find primary source image (featured.png or featured.jpg or featured.webp)
      const sourceImageName = files.find(f => f.startsWith('featured.') && !f.includes('@'));
      if (!sourceImageName) continue;

      const sourcePath = path.join(dirPath, sourceImageName);
      const originalSize = fs.statSync(sourcePath).size;

      try {
        // Read the source into memory first: when the source IS featured.webp the
        // 1x output writes to that same path, and sharp refuses to use one file
        // for both input and output.
        const sourceBuffer = fs.readFileSync(sourcePath);
        const metadata = await sharp(sourceBuffer).metadata();
        const origWidth = metadata.width || 1200;

        // 2x Retina (1600px max)
        const target2xWidth = Math.min(origWidth, 1600);
        const out2xPath = path.join(dirPath, 'featured@2x.webp');
        await sharp(sourceBuffer)
          .resize({ width: target2xWidth, withoutEnlargement: true })
          .webp({ quality: 90, effort: 6 })
          .toFile(out2xPath);

        // 1x Standard (800px max)
        const target1xWidth = Math.min(origWidth, 800);
        const out1xPath = path.join(dirPath, 'featured.webp');
        await sharp(sourceBuffer)
          .resize({ width: target1xWidth, withoutEnlargement: true })
          .webp({ quality: 90, effort: 6 })
          .toFile(out1xPath);

        // Thumbnail / Mobile Card (400px max)
        const targetThumbWidth = Math.min(origWidth, 400);
        const outThumbPath = path.join(dirPath, 'featured@thumb.webp');
        await sharp(sourceBuffer)
          .resize({ width: targetThumbWidth, withoutEnlargement: true })
          .webp({ quality: 90, effort: 6 })
          .toFile(outThumbPath);

        const new1xSize = fs.statSync(out1xPath).size;
        const new2xSize = fs.statSync(out2xPath).size;

        // If the original was .png or .jpg and not .webp, remove the old heavy original
        if (sourceImageName !== 'featured.webp' && fs.existsSync(sourcePath)) {
          totalSavedBytes += (originalSize - new2xSize);
          safeUnlink(sourcePath);
          console.log(`Converted [${postSlug}]: ${sourceImageName} (${(originalSize/1024).toFixed(0)}KB) -> WebP 2x (${(new2xSize/1024).toFixed(0)}KB), 1x (${(new1xSize/1024).toFixed(0)}KB)`);
        } else {
          console.log(`Generated retina variants for [${postSlug}]: 1x, 2x, thumb`);
        }
      } catch (err) {
        console.error(`Error processing ${sourcePath}:`, err.message);
      }
    }
  }

  // 4. UPDATE BLOG POST MDOC FILES TO POINT TO featured.webp
  console.log('\n--- 4. Updating blog post frontmatter references to .webp ---');
  if (fs.existsSync(CONTENT_POSTS_DIR)) {
    const mdocFiles = fs.readdirSync(CONTENT_POSTS_DIR).filter(f => f.endsWith('.mdoc'));
    let updatedCount = 0;
    for (const mdocFile of mdocFiles) {
      const filePath = path.join(CONTENT_POSTS_DIR, mdocFile);
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace featured.jpg or featured.png with featured.webp
      if (content.includes('/featured.jpg') || content.includes('/featured.png')) {
        content = content.replace(/\/featured\.(jpg|png)/g, '/featured.webp');
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} blog posts to reference .webp featured images.`);
  }

  // 5. COMPRESS MASSIVE RAW PNGs IN wp-content/uploads/
  console.log('\n--- 5. Compressing large standalone PNGs in wp-content/uploads/ ---');
  const uploadsDir = path.join(PUBLIC_DIR, 'wp-content', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    function getFilesRecursive(dir) {
      let results = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...getFilesRecursive(full));
        else results.push(full);
      }
      return results;
    }

    const allUploads = getFilesRecursive(uploadsDir);
    for (const f of allUploads) {
      const ext = path.extname(f).toLowerCase();
      const stats = fs.statSync(f);

      // Target PNG files > 500KB
      if (ext === '.png' && stats.size > 500 * 1024) {
        const webpPath = f.replace(/\.png$/i, '.webp');
        try {
          await sharp(f).webp({ quality: 90, effort: 6 }).toFile(webpPath);
          const newSize = fs.statSync(webpPath).size;
          console.log(`Created WebP for: ${path.relative(PUBLIC_DIR, f)} (${(stats.size/1024/1024).toFixed(2)}MB -> ${(newSize/1024/1024).toFixed(2)}MB)`);
        } catch (e) {
          console.warn(`Could not convert ${f}:`, e.message);
        }
      }
    }
  }

  // 6. REMOVE STALE dist/ FOLDER
  const distDir = path.join(ROOT_DIR, 'dist');
  if (fs.existsSync(distDir)) {
    console.log('\n--- 6. Cleaning stale dist/ folder ---');
    if (ALLOW_DELETE) fs.rmSync(distDir, { recursive: true, force: true });
    else console.log('   [dry-run] would remove dist dir');
    console.log('Cleaned dist/ directory.');
  }

  console.log('\n=== Summary ===');
  console.log(`Total space freed: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('Optimization failed:', err);
  process.exit(1);
});
