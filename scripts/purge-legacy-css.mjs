import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const BUNDLE_PATH = path.join(ROOT_DIR, 'public', 'styles', 'site-bundle.css');
const ARCHIVE_DIR = path.join(ROOT_DIR, 'archive', 'styles');
const ARCHIVE_FILE = path.join(ARCHIVE_DIR, 'site-bundle.original.css');

// 1. Ensure Archive directory exists and archive original
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}
if (!fs.existsSync(ARCHIVE_FILE)) {
  fs.copyFileSync(BUNDLE_PATH, ARCHIVE_FILE);
  console.log(`Archived original site-bundle.css (${(fs.statSync(BUNDLE_PATH).size / 1024).toFixed(1)} KB) to archive/styles/`);
}

// 2. Collect all active HTML from dist/ and templates from src/
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

const htmlFiles = getAllFiles(path.join(ROOT_DIR, 'dist'), ['.html']);
const srcFiles = getAllFiles(path.join(ROOT_DIR, 'src'), ['.astro', '.ts', '.js']);

let combinedSearchText = '';
for (const f of [...htmlFiles, ...srcFiles]) {
  combinedSearchText += ' ' + fs.readFileSync(f, 'utf8');
}

// Dynamic whitelist of classes used in scripts or state changes
const WHITELIST_PATTERNS = [
  'elementor-message',
  'elementor-button-text',
  'elementor-active',
  'post-article-body',
  'e-font-icon-svg',
  'elementor-1191',
  'elementor-element-',
  'elementor-share-btn',
  'elementor-post-info',
  'elementor-inline-item',
  'elementor-grid',
  'e-flex',
  'e-con',
  'e-con-inner',
  'elementor-widget',
  'elementor-widget-container'
];

function isSelectorActive(selector) {
  // Always keep root variables, body defaults, keyframes, font-faces
  if (selector.includes(':root') || selector.startsWith('@font-face') || selector.startsWith('@keyframes')) {
    return true;
  }

  // Check if selector contains any class from whitelist
  for (const wp of WHITELIST_PATTERNS) {
    if (selector.includes(wp)) return true;
  }

  // Extract classes from selector
  const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
  if (!classMatches) {
    // If it's a basic tag selector like "body", "p", "a", etc.
    const tags = selector.split(/[\s>+~,:]+/).filter(Boolean);
    for (const t of tags) {
      if (['html', 'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'svg', 'button', 'input', 'form'].includes(t)) {
        return true;
      }
    }
    return false;
  }

  // Check if at least one class in this selector appears in the active site HTML
  for (const c of classMatches) {
    const className = c.replace(/^\./, '');
    // Ignore pure numbers or single chars that falsely match
    if (className.length > 2 && combinedSearchText.includes(className)) {
      return true;
    }
  }

  return false;
}

// 3. Parse CSS and filter rules
const originalCss = fs.readFileSync(BUNDLE_PATH, 'utf8');
console.log(`Original CSS length: ${(originalCss.length / 1024).toFixed(1)} KB`);

// Split CSS into blocks safely (accounting for media queries)
function parseAndFilterCss(css) {
  let output = [];
  let buffer = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let currentAtRule = null;
  let atRuleBuffer = '';

  let i = 0;
  let totalRules = 0;
  let keptRules = 0;

  while (i < css.length) {
    const char = css[i];

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      buffer += char;
    } else if (inString && char === stringChar && css[i - 1] !== '\\') {
      inString = false;
      buffer += char;
    } else if (!inString && char === '{') {
      depth++;
      buffer += char;
    } else if (!inString && char === '}') {
      depth--;
      buffer += char;

      if (depth === 0) {
        // Complete top-level block
        const block = buffer.trim();
        buffer = '';

        if (block.startsWith('@media') || block.startsWith('@supports')) {
          // Process inner rules of media query
          const firstBrace = block.indexOf('{');
          const atHeader = block.substring(0, firstBrace).trim();
          const innerContent = block.substring(firstBrace + 1, block.length - 1).trim();

          // Sub-filter inner rules
          const subFiltered = filterSimpleCss(innerContent);
          if (subFiltered.css.trim().length > 0) {
            output.push(`${atHeader} {\n${subFiltered.css}\n}`);
            keptRules += subFiltered.kept;
          }
          totalRules += subFiltered.total;
        } else if (block.startsWith('@font-face') || block.startsWith('@keyframes') || block.startsWith('@-webkit-keyframes')) {
          output.push(block);
          keptRules++;
          totalRules++;
        } else {
          // Standard rule
          totalRules++;
          const firstBrace = block.indexOf('{');
          if (firstBrace > -1) {
            const selector = block.substring(0, firstBrace).trim();
            if (isSelectorActive(selector)) {
              output.push(block);
              keptRules++;
            }
          }
        }
      }
    } else {
      buffer += char;
    }
    i++;
  }

  return { css: output.join('\n\n'), total: totalRules, kept: keptRules };
}

function filterSimpleCss(css) {
  let output = [];
  let buffer = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let total = 0;
  let kept = 0;

  let i = 0;
  while (i < css.length) {
    const char = css[i];
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      buffer += char;
    } else if (inString && char === stringChar && css[i - 1] !== '\\') {
      inString = false;
      buffer += char;
    } else if (!inString && char === '{') {
      depth++;
      buffer += char;
    } else if (!inString && char === '}') {
      depth--;
      buffer += char;
      if (depth === 0) {
        const block = buffer.trim();
        buffer = '';
        total++;
        const firstBrace = block.indexOf('{');
        if (firstBrace > -1) {
          const selector = block.substring(0, firstBrace).trim();
          if (isSelectorActive(selector)) {
            output.push(block);
            kept++;
          }
        }
      }
    } else {
      buffer += char;
    }
    i++;
  }
  return { css: output.join('\n'), total, kept };
}

console.log('Filtering redundant CSS rules...');
const result = parseAndFilterCss(originalCss);

console.log(`\n=== Audit & Purge Results ===`);
console.log(`Total rules processed: ${result.total}`);
console.log(`Active rules kept:      ${result.kept}`);
console.log(`Dead rules removed:     ${result.total - result.kept} (${(((result.total - result.kept) / result.total) * 100).toFixed(1)}%)`);

// Write the clean, purged CSS back
fs.writeFileSync(BUNDLE_PATH, result.css, 'utf8');
const newStats = fs.statSync(BUNDLE_PATH);

console.log(`New site-bundle.css size: ${(newStats.size / 1024).toFixed(1)} KB`);
console.log(`Space saved on every page load: ${((originalCss.length - newStats.size) / 1024).toFixed(1)} KB`);
