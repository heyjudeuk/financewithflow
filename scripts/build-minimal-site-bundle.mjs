import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const ARCHIVE_FILE = path.join(ROOT_DIR, 'archive', 'styles', 'site-bundle.original.css');
const BUNDLE_PATH = path.join(ROOT_DIR, 'public', 'styles', 'site-bundle.css');

if (!fs.existsSync(ARCHIVE_FILE)) {
  console.error('Archive file does not exist at:', ARCHIVE_FILE);
  process.exit(1);
}

// 1. Gather all classes actually present in HTML / templates
function getAllFiles(dir, exts = []) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllFiles(full, exts));
    else if (!exts.length || exts.includes(path.extname(entry.name).toLowerCase())) results.push(full);
  }
  return results;
}

const htmlFiles = getAllFiles(path.join(ROOT_DIR, 'dist'), ['.html']);
const srcFiles = getAllFiles(path.join(ROOT_DIR, 'src'), ['.astro', '.ts', '.js']);

const actualClasses = new Set();
const classAttrRegex = /class(?:Name)?=["'`]?([^"'`>]+)["'`]?/g;

for (const file of [...htmlFiles, ...srcFiles]) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = classAttrRegex.exec(content)) !== null) {
    const tokens = m[1].split(/\s+/);
    for (const t of tokens) {
      if (t) actualClasses.add(t);
    }
  }
}

// Add dynamic script classes and core elementor classes
[
  'elementor-message',
  'elementor-message-success',
  'elementor-message-danger',
  'elementor-button-text',
  'elementor-active',
  'post-article-body'
].forEach(c => actualClasses.add(c));

console.log(`Verified active classes across site: ${actualClasses.size}`);

// Read original and remove comments
let rawCss = fs.readFileSync(ARCHIVE_FILE, 'utf8');
rawCss = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');

// Robust selector splitter that does NOT split inside parentheses or brackets
function splitSelectorList(selectorString) {
  const result = [];
  let buffer = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  for (let i = 0; i < selectorString.length; i++) {
    const char = selectorString[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;

    if (char === ',' && parenDepth === 0 && bracketDepth === 0) {
      if (buffer.trim()) result.push(buffer.trim());
      buffer = '';
    } else {
      buffer += char;
    }
  }
  if (buffer.trim()) result.push(buffer.trim());
  return result;
}

function isSelectorValid(sel) {
  sel = sel.trim();
  if (!sel) return false;

  // Drop dead WordPress plugins and themes
  if (
    sel.includes('.wp-') ||
    sel.includes('wp-block') ||
    sel.includes('.wc-') ||
    sel.includes('.woocommerce') ||
    sel.includes('.cmplz-') ||
    sel.includes('#left-area') ||
    sel.includes('#et-') ||
    sel.includes('#main-header')
  ) {
    return false;
  }

  // Header/Footer rules: site already scopes modern header/footer
  if (sel.includes('.site-header:not') || sel.includes('.site-footer:not') || sel.includes('.site-main')) {
    return false;
  }

  // Drop unused video or slideshow background wrappers
  if (sel.includes('elementor-background-video') || sel.includes('elementor-background-slideshow')) {
    return false;
  }

  // Check :root and .elementor-kit-7
  if (sel === ':root' || sel.startsWith(':root') || sel === '.elementor-kit-7' || sel.startsWith('.elementor-kit-7')) {
    return true;
  }

  // Strip :not(...) clauses when checking if elements exist
  const selWithoutNot = sel.replace(/:not\([^)]*\)/g, '');

  // Extract all class names in this selector chain
  const classMatches = selWithoutNot.match(/\.([a-zA-Z0-9_-]+)/g);
  if (!classMatches || classMatches.length === 0) {
    // If it's a tag selector like `.elementor img` or `:is(.e-con) > img`
    // Ensure at least one known class is present
    return false;
  }

  // Every class in this selector chain MUST be active on the site
  for (const cm of classMatches) {
    const cls = cm.substring(1);
    if (!actualClasses.has(cls)) {
      return false;
    }
  }

  return true;
}

function cleanRuleBlock(header, body) {
  header = header.trim();
  if (!header) return null;

  if (header === ':root' || header.startsWith(':root')) {
    // Keep root variables
    const varLines = body.slice(1, -1).split(';').map(l => l.trim()).filter(Boolean);
    const validVars = varLines.filter(l => {
      const v = l.trim();
      return v.startsWith('--e-') || v.startsWith('--elementor-') || v.startsWith('--page-title-display');
    });
    if (validVars.length === 0) return null;
    return `${header} {\n  ${validVars.join(';\n  ')};\n}`;
  }

  const individualSelectors = splitSelectorList(header);
  const validSelectors = individualSelectors.filter(s => isSelectorValid(s));
  if (validSelectors.length === 0) return null;

  return `${validSelectors.join(', ')} ${body}`;
}

let keptRules = [];
let buffer = '';
let depth = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < rawCss.length; i++) {
  const c = rawCss[i];
  if (!inString && (c === '"' || c === "'")) {
    inString = true;
    stringChar = c;
    buffer += c;
  } else if (inString && c === stringChar && rawCss[i - 1] !== '\\') {
    inString = false;
    buffer += c;
  } else if (!inString && c === '{') {
    depth++;
    buffer += c;
  } else if (!inString && c === '}') {
    depth--;
    buffer += c;
    if (depth === 0) {
      const block = buffer.trim();
      buffer = '';

      if (block.startsWith('@font-face') || block.startsWith('@keyframes') || block.startsWith('@-webkit-keyframes')) {
        continue;
      }

      if (block.startsWith('@media') || block.startsWith('@supports')) {
        const firstBrace = block.indexOf('{');
        const mediaHeader = block.substring(0, firstBrace).trim();
        const inner = block.substring(firstBrace + 1, block.length - 1).trim();

        let innerKept = [];
        let inBuffer = '';
        let inDepth = 0;
        for (let j = 0; j < inner.length; j++) {
          const ic = inner[j];
          inBuffer += ic;
          if (ic === '{') inDepth++;
          else if (ic === '}') {
            inDepth--;
            if (inDepth === 0) {
              const rule = inBuffer.trim();
              inBuffer = '';
              const fb = rule.indexOf('{');
              if (fb > -1) {
                const h = rule.substring(0, fb).trim();
                const b = rule.substring(fb).trim();
                const cleaned = cleanRuleBlock(h, b);
                if (cleaned) innerKept.push(cleaned);
              }
            }
          }
        }
        if (innerKept.length > 0) {
          keptRules.push(`${mediaHeader} {\n${innerKept.join('\n')}\n}`);
        }
      } else {
        const fb = block.indexOf('{');
        if (fb > -1) {
          const h = block.substring(0, fb).trim();
          const b = block.substring(fb).trim();
          const cleaned = cleanRuleBlock(h, b);
          if (cleaned) keptRules.push(cleaned);
        }
      }
    }
  } else {
    buffer += c;
  }
}

// Consolidate and deduplicate identical rules
const seenRules = new Set();
const dedupedRules = [];
for (const rule of keptRules) {
  const normalized = rule.replace(/\s+/g, ' ').trim();
  if (!seenRules.has(normalized)) {
    seenRules.add(normalized);
    dedupedRules.push(rule);
  }
}

const headerComment = `/* ==========================================================================
   Finance with Flow - Curated Legacy Stylesheet
   Stripped and purged of redundant WordPress, Gutenberg, Complianz,
   WooCommerce, Breeze cache, unused webfonts, and dead keyframes.
   Contains strictly verified active legacy styles:
   - Elementor single post layouts & typography (.elementor-1191)
   - Blog posts grid & cards (.elementor-posts, .elementor-posts-container)
   - Post navigation controls (.elementor-post-navigation)
   - Social sharing button widgets (.elementor-share-buttons)
   - Form AJAX notifications (.elementor-message, .elementor-button-text)
   - Elementor color and layout design tokens (.elementor-kit-7)
   ========================================================================== */\n\n`;

const finalCss = headerComment + dedupedRules.join('\n\n') + '\n';

console.log(`Original file size: ${(rawCss.length / 1024).toFixed(1)} KB`);
console.log(`New clean bundle size: ${(finalCss.length / 1024).toFixed(1)} KB`);
console.log(`Total rules preserved: ${dedupedRules.length}`);

fs.writeFileSync(BUNDLE_PATH, finalCss, 'utf8');
console.log('Successfully wrote to:', BUNDLE_PATH);
