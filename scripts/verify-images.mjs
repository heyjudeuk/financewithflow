import fs from 'fs';
import path from 'path';

function findHtmlFiles(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = findHtmlFiles('dist');
console.log(`Found ${htmlFiles.length} HTML files to test`);

let totalImagesChecked = 0;
let totalMissing = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
  const srcsetMatches = [...html.matchAll(/srcset=["']([^"']+)["']/g)].flatMap(m => 
    m[1].split(',').map(s => s.trim().split(' ')[0])
  );
  const allImgs = [...new Set([...imgMatches, ...srcsetMatches])].filter(u => u.startsWith('/') && !u.startsWith('//') && !u.startsWith('/_astro/'));

  totalImagesChecked += allImgs.length;
  for (const img of allImgs) {
    // strip query strings or hash
    const cleanImg = img.split('?')[0].split('#')[0];
    const localPath = path.join('dist', cleanImg.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) {
      console.error(`Missing in ${file} -> ${img}`);
      totalMissing++;
    }
  }
}

console.log(`Site-wide check complete! Checked ${totalImagesChecked} image references across ${htmlFiles.length} pages. Total missing: ${totalMissing}`);

