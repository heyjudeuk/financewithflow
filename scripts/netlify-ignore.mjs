import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Get commit references injected by Netlify
const cachedCommit = process.env.CACHED_COMMIT_REF;
const currentCommit = process.env.COMMIT_REF || 'HEAD';

console.log('[netlify-ignore] Checking whether build should proceed or be cancelled...');

// If running outside Netlify or no previous commit ref exists (e.g. initial build), always proceed
if (!cachedCommit || cachedCommit === currentCommit) {
  console.log('[netlify-ignore] Initial or manual build detected (no CACHED_COMMIT_REF). Proceeding with build.');
  process.exit(1); // Exit 1 tells Netlify to PROCEED with build
}

let changedFiles = [];
try {
  const diffOutput = execSync(`git diff --name-only ${cachedCommit} ${currentCommit}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  changedFiles = diffOutput.trim().split(/\r?\n/).filter(Boolean);
} catch (err) {
  // If git diff against CACHED_COMMIT_REF fails (e.g. shallow clone), try HEAD~1
  try {
    const fallbackDiff = execSync('git diff --name-only HEAD~1 HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    changedFiles = fallbackDiff.trim().split(/\r?\n/).filter(Boolean);
  } catch (e) {
    console.log('[netlify-ignore] Unable to inspect git diff. Proceeding with build as safety precaution.');
    process.exit(1);
  }
}

if (changedFiles.length === 0) {
  console.log('[netlify-ignore] No files changed. Cancelling build (exit code 0).');
  process.exit(0); // Exit 0 tells Netlify to CANCEL / SKIP build (0 minutes used)
}

console.log(`[netlify-ignore] Found ${changedFiles.length} changed file(s):`);
changedFiles.forEach((f) => console.log(`  - ${f}`));

const ignorableDocPatterns = [
  /^README\.md$/i,
  /^\.gitignore$/i,
  /^walkthrough\.md$/i,
  /^implementation_plan\.md$/i,
  /^docs\//i,
];

/**
 * Checks if a post file is currently marked as draft.
 * If the file does not exist (deleted), returns false to force a rebuild.
 */
function isDraftPost(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const statusMatch = content.match(/^status:\s*['"]?([^'"\r\n]+)['"]?/m);
    if (statusMatch && statusMatch[1].trim() === 'draft') {
      return true;
    }
  } catch (e) {}
  return false;
}

let shouldBuild = false;

for (const file of changedFiles) {
  const normalized = file.replace(/\\/g, '/');

  // 1. Ignorable documentation files
  if (ignorableDocPatterns.some((pattern) => pattern.test(normalized))) {
    continue;
  }

  // 2. Post content files
  if (normalized.startsWith('src/content/posts/')) {
    if (isDraftPost(normalized)) {
      console.log(`[netlify-ignore] Post '${normalized}' is in DRAFT status.`);
      continue;
    } else {
      console.log(`[netlify-ignore] Post '${normalized}' is PUBLISHED. Triggering build.`);
      shouldBuild = true;
      break;
    }
  }

  // 3. Post images (accompanying draft edits)
  if (normalized.startsWith('public/images/posts/')) {
    continue;
  }

  // 4. Any other file (templates, components, config, package.json, categories, styles) requires build
  console.log(`[netlify-ignore] Production file '${normalized}' changed. Triggering build.`);
  shouldBuild = true;
  break;
}

if (shouldBuild) {
  console.log('[netlify-ignore] Changes require a production build. Proceeding (exit code 1).');
  process.exit(1);
} else {
  console.log('[netlify-ignore] All changes are drafts or documentation. Cancelling build to save build minutes (exit code 0).');
  process.exit(0);
}
