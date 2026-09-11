import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const BUNDLE_PATH = path.join(ROOT_DIR, 'public', 'styles', 'site-bundle.css');
const ARCHIVE_FILE = path.join(ROOT_DIR, 'archive', 'styles', 'site-bundle.original.css');

const original = fs.readFileSync(ARCHIVE_FILE, 'utf8');

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
const classAttrRegex = /class(?:Name)?=["'`]([^"'`]+)["'`]/g;

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

// Add dynamic script classes to whitelist
const SCRIPT_WHITELIST = [
  'elementor-message',
  'elementor-message-success',
  'elementor-message-danger',
  'elementor-button-text',
  'elementor-active',
  'post-article-body'
];
SCRIPT_WHITELIST.forEach(c => actualClasses.add(c));

console.log(`Verified active classes across site: ${actualClasses.size}`);

function selectorMatchesSite(selector) {
  const trimmed = selector.trim();
  if (trimmed === ':root' || trimmed.startsWith(':root')) {
    // Keep root color and spacing variables, but skip giant block gradient definitions
    return true;
  }

  const matches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
  if (!matches) {
    // No classes. Check tags.
    // If it's pure tag selector like "body", "p", "a", etc.
    const tags = selector.split(/[\s>+~,:]+/).filter(Boolean);
    // Ignore Gutenberg / WooCommerce / Breeze tag chains
    return false;
  }

  // ALL classes in at least one compound selector must exist in actualClasses
  // e.g. in ".elementor .elementor-element", both .elementor and .elementor-element must be active
  for (const m of matches) {
    const cls = m.substring(1);
    if (!actualClasses.has(cls)) {
      return false;
    }
  }

  return true;
}

function parseAndExtractCss(css) {
  let kept = [];
  let buffer = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

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

        if (block.startsWith('@media') || block.startsWith('@supports')) {
          const firstBrace = block.indexOf('{');
          const header = block.substring(0, firstBrace).trim();
          const inner = block.substring(firstBrace + 1, block.length - 1).trim();

          const innerKept = filterInner(inner);
          if (innerKept.length > 0) {
            kept.push(`${header} {\n${innerKept.join('\n')}\n}`);
          }
        } else if (block.startsWith('@keyframes') || block.startsWith('@-webkit-keyframes')) {
          kept.push(block);
        } else if (block.startsWith('@font-face')) {
          // Keep font-faces if any
          kept.push(block);
        } else {
          const firstBrace = block.indexOf('{');
          if (firstBrace > -1) {
            const selectorGroup = block.substring(0, firstBrace).trim();
            const body = block.substring(firstBrace).trim();
            // Selector group might have commas: .foo, .bar
            const individualSelectors = selectorGroup.split(',').map(s => s.trim());
            const validSelectors = individualSelectors.filter(s => selectorMatchesSite(s));

            if (validSelectors.length > 0) {
              kept.push(`${validSelectors.join(', ')} ${body}`);
            }
          }
        }
      }
    } else {
      buffer += char;
    }
    i++;
  }
  return kept;
}

function filterInner(css) {
  let kept = [];
  let buffer = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

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
        const firstBrace = block.indexOf('{');
        if (firstBrace > -1) {
          const selectorGroup = block.substring(0, firstBrace).trim();
          const body = block.substring(firstBrace).trim();
          const individualSelectors = selectorGroup.split(',').map(s => s.trim());
          const validSelectors = individualSelectors.filter(s => selectorMatchesSite(s));
          if (validSelectors.length > 0) {
            kept.push(`${validSelectors.join(', ')} ${body}`);
          }
        }
      }
    } else {
      buffer += char;
    }
    i++;
  }
  return kept;
}

console.log('Extracting exact active CSS...');
const cleanBlocks = parseAndExtractCss(original);
const cleanCss = cleanBlocks.join('\n\n');

console.log(`Original size: ${(original.length / 1024).toFixed(1)} KB`);
console.log(`Clean extracted size: ${(cleanCss.length / 1024).toFixed(1)} KB`);
console.log(`Total rules preserved: ${cleanBlocks.length}`);

fs.writeFileSync(BUNDLE_PATH, cleanCss, 'utf8');
