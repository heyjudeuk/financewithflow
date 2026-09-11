import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, 'src', 'content', 'posts');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const POSTS_IMG_DIR = path.join(PUBLIC_DIR, 'images', 'posts');

/**
 * Ensures a directory exists synchronously.
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Processes a featured image for a given post slug:
 * - Creates 400w (@thumb.webp), 800w (featured.webp), 1600w (@2x.webp)
 * - Returns the path for featuredImage (e.g. "/images/posts/<slug>/featured.webp")
 */
async function processFeaturedImage(sourcePath, slug) {
  const targetDir = path.join(POSTS_IMG_DIR, slug);
  ensureDir(targetDir);

  const out1x = path.join(targetDir, 'featured.webp');
  const out2x = path.join(targetDir, 'featured@2x.webp');
  const outThumb = path.join(targetDir, 'featured@thumb.webp');

  const allVariantsExist = fs.existsSync(out1x) && fs.existsSync(out2x) && fs.existsSync(outThumb);

  // If all variants exist and source is already featured.webp, skip
  if (allVariantsExist && path.resolve(sourcePath) === path.resolve(out1x)) {
    return `/images/posts/${slug}/featured.webp`;
  }

  // Read source image into memory
  const sourceBuffer = fs.readFileSync(sourcePath);
  const metadata = await sharp(sourceBuffer).metadata();
  const origWidth = metadata.width || 1200;

  // 1. 2x Retina (max 1600px)
  const target2x = Math.min(origWidth, 1600);
  await sharp(sourceBuffer)
    .resize({ width: target2x, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(out2x);

  // 2. 1x Standard (max 800px)
  const target1x = Math.min(origWidth, 800);
  await sharp(sourceBuffer)
    .resize({ width: target1x, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(out1x);

  // 3. Thumb (max 400px)
  const targetThumb = Math.min(origWidth, 400);
  await sharp(sourceBuffer)
    .resize({ width: targetThumb, withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toFile(outThumb);

  // If the source was a loose file outside targetDir (e.g. public/images/posts/my-photo.png), remove it
  if (path.resolve(sourcePath) !== path.resolve(out1x) && path.resolve(sourcePath) !== path.resolve(out2x) && path.resolve(sourcePath) !== path.resolve(outThumb)) {
    try {
      // If it is directly in public/images/posts/<file> (loose upload by Keystatic), clean it up
      if (path.dirname(path.resolve(sourcePath)) === path.resolve(POSTS_IMG_DIR)) {
        fs.unlinkSync(sourcePath);
      }
    } catch (e) {}
  }

  return `/images/posts/${slug}/featured.webp`;
}

/**
 * Optimizes an inline content body image to WebP if it is not already.
 */
async function processContentImage(imageSrc) {
  // Only process local images in /images/posts/
  if (!imageSrc.startsWith('/images/posts/')) return imageSrc;

  const relPath = imageSrc.replace(/^\//, '');
  const fullPath = path.join(PUBLIC_DIR, relPath);

  if (!fs.existsSync(fullPath)) return imageSrc;

  const ext = path.extname(fullPath).toLowerCase();
  // Already webp or svg, check size
  if (ext === '.svg') return imageSrc;

  if (ext === '.webp') {
    // If it's already webp, leave as is
    return imageSrc;
  }

  // Convert png, jpg, jpeg to webp
  const newRelPath = relPath.replace(/\.(png|jpe?g)$/i, '.webp');
  const newFullPath = path.join(PUBLIC_DIR, newRelPath);

  try {
    const buffer = fs.readFileSync(fullPath);
    await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(newFullPath);

    // Remove old large file
    try {
      fs.unlinkSync(fullPath);
    } catch (e) {}

    return '/' + newRelPath.replace(/\\/g, '/');
  } catch (err) {
    console.warn(`Could not optimize inline image ${fullPath}:`, err.message);
    return imageSrc;
  }
}

async function main() {
  console.log('[prebuild] Scanning blog posts for unoptimized Keystatic uploads...');

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('[prebuild] No posts directory found.');
    return;
  }

  const postFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdoc') || f.endsWith('.md'));
  let updatedCount = 0;

  for (const file of postFiles) {
    const filePath = path.join(POSTS_DIR, file);
    const slug = path.basename(file, path.extname(file));
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // 1. Process featuredImage in frontmatter
    const featuredMatch = content.match(/^featuredImage:\s*['"]?([^'"\r\n]+)['"]?/m);
    if (featuredMatch) {
      const rawSrc = featuredMatch[1].trim();

      // Resolve source file in public/
      let localSourcePath = null;
      if (rawSrc.startsWith('/')) {
        localSourcePath = path.join(PUBLIC_DIR, rawSrc.replace(/^\//, ''));
      }

      if (localSourcePath && fs.existsSync(localSourcePath)) {
        const ext = path.extname(localSourcePath).toLowerCase();
        const isStandardWebp = rawSrc === `/images/posts/${slug}/featured.webp`;
        const targetDir = path.join(POSTS_IMG_DIR, slug);
        const variantsExist = fs.existsSync(path.join(targetDir, 'featured.webp')) &&
                              fs.existsSync(path.join(targetDir, 'featured@2x.webp')) &&
                              fs.existsSync(path.join(targetDir, 'featured@thumb.webp'));

        // If not standard webp or variants missing, optimize!
        if (!isStandardWebp || !variantsExist || ext !== '.webp') {
          try {
            console.log(`[prebuild] Optimizing featured image for [${slug}]: ${rawSrc}`);
            const newFeaturedSrc = await processFeaturedImage(localSourcePath, slug);
            if (newFeaturedSrc !== rawSrc) {
              content = content.replace(
                /^featuredImage:\s*['"]?[^'"\r\n]+['"]?/m,
                `featuredImage: "${newFeaturedSrc}"`
              );
              hasChanges = true;
            }
          } catch (err) {
            console.error(`[prebuild] Failed to process featured image for [${slug}]:`, err.message);
          }
        }
      }
    }

    // 2. Process inline images in content body
    // Matches Markdown images: ![alt](url)
    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;
    const replacements = [];

    while ((match = imgRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const altText = match[1];
      const imgUrl = match[2];

      if (imgUrl.startsWith('/images/posts/') && !imgUrl.endsWith('.webp') && !imgUrl.endsWith('.svg')) {
        replacements.push({ fullMatch, altText, imgUrl });
      }
    }

    for (const r of replacements) {
      const optimizedUrl = await processContentImage(r.imgUrl);
      if (optimizedUrl !== r.imgUrl) {
        content = content.replace(r.fullMatch, `![${r.altText}](${optimizedUrl})`);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      updatedCount++;
    }
  }

  console.log(`[prebuild] Finished. Updated ${updatedCount} post(s) with optimized WebP images.`);
}

main().catch(err => {
  console.error('[prebuild] Image optimization error:', err);
  // Don't fail the build if an image fails, allow build to continue
  process.exit(0);
});
