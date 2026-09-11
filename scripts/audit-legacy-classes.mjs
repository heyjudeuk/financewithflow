import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir, exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getFiles(full, exts));
    else if (!exts || exts.includes(path.extname(entry.name).toLowerCase())) results.push(full);
  }
  return results;
}

const htmlFiles = getFiles('./dist', ['.html']);
const srcFiles = getFiles('./src', ['.astro', '.ts', '.js']);

const allClasses = new Set();
const classAttrRegex = /class(?:Name)?=["'`]([^"'`]+)["'`]/g;

for (const file of [...htmlFiles, ...srcFiles]) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = classAttrRegex.exec(content)) !== null) {
    const tokens = m[1].split(/\s+/);
    for (const t of tokens) {
      if (t.startsWith('elementor') || t.startsWith('wp-') || t.startsWith('e-') || t.startsWith('has-')) {
        allClasses.add(t);
      }
    }
  }
}

console.log(`Legacy classes actively referenced in src/ or dist/ (${allClasses.size}):`);
const sorted = Array.from(allClasses).sort();
console.log(sorted);
