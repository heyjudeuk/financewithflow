import fs from 'node:fs';
import path from 'node:path';

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

const htmlFiles = getAllFiles('./dist', ['.html']);
const srcFiles = getAllFiles('./src', ['.astro', '.ts', '.js']);

const actualClasses = new Set();
const classAttrRegex = /class(?:Name)?=["'`]([^"'`]+)["'`]/g;

for (const file of [...htmlFiles, ...srcFiles]) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = classAttrRegex.exec(content)) !== null) {
    const tokens = m[1].split(/\s+/);
    for (const t of tokens) {
      if (t.startsWith('elementor') || t.startsWith('e-')) {
        actualClasses.add(t);
      }
    }
  }
}

console.log(`Exact list of elementor/e- classes present across the entire site (${actualClasses.size}):`);
console.log(Array.from(actualClasses).sort());
