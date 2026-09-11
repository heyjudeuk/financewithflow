import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getFiles(full));
    else results.push(full);
  }
  return results;
}

const uploads = getFiles('./public/wp-content/uploads');
const images = getFiles('./public/images');
const all = [...uploads, ...images];

const exts = {};
all.forEach(f => {
  const ext = path.extname(f).toLowerCase();
  exts[ext] = (exts[ext] || 0) + 1;
});
console.log('Extensions in public/wp-content/uploads and public/images:', exts);

// Find images referenced in src
const srcFiles = getFiles('./src');
const referenced = new Set();
const imgRegex = /(?:\/wp-content\/uploads\/|\/images\/)[^'"\s\)\>,]+\.(?:png|jpg|jpeg|webp)/gi;

srcFiles.forEach(sf => {
  if (sf.endsWith('.astro') || sf.endsWith('.ts') || sf.endsWith('.json') || sf.endsWith('.mdoc')) {
    const content = fs.readFileSync(sf, 'utf8');
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      referenced.add(match[0]);
    }
  }
});

console.log('Total unique image paths referenced in src:', referenced.size);
const refArray = Array.from(referenced).sort();
const pngJpg = refArray.filter(p => !p.endsWith('.webp'));
console.log(`\nReferenced PNG/JPG files (${pngJpg.length}):`);
pngJpg.forEach(p => {
  const localPath = path.join(process.cwd(), 'public', p.replace(/^\//, ''));
  const exists = fs.existsSync(localPath);
  const size = exists ? (fs.statSync(localPath).size / 1024).toFixed(1) + ' KB' : 'MISSING';
  console.log(`- ${p} [${size}]`);
});
