import fs from 'node:fs';
import path from 'node:path';

function getHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getHtmlFiles(full));
    else if (full.endsWith('.html')) results.push(full);
  }
  return results;
}

const htmlFiles = getHtmlFiles('./dist');
console.log(`Loaded ${htmlFiles.length} HTML files.`);

// Combine all HTML text to search class names and tags
let allHtml = '';
for (const file of htmlFiles) {
  allHtml += ' ' + fs.readFileSync(file, 'utf8');
}

// Read site-bundle.css
const cssPath = './public/styles/site-bundle.css';
const cssContent = fs.readFileSync(cssPath, 'utf8');
console.log(`site-bundle.css size: ${(cssContent.length / 1024).toFixed(1)} KB`);

// Extract class selectors
const classRegex = /\.([a-zA-Z0-9_-]+)/g;
const classesInCss = new Set();
let m;
while ((m = classRegex.exec(cssContent)) !== null) {
  classesInCss.add(m[1]);
}
console.log(`Total unique class selectors in site-bundle.css: ${classesInCss.size}`);

let usedClasses = [];
let unusedClasses = [];
for (const cls of classesInCss) {
  // Check if class appears in any HTML (as class="...cls..." or in classList)
  if (allHtml.includes(cls)) {
    usedClasses.push(cls);
  } else {
    unusedClasses.push(cls);
  }
}

console.log(`Used classes in HTML: ${usedClasses.length}`);
console.log(`Unused classes in HTML: ${unusedClasses.length}`);
console.log(`Unused percentage: ${((unusedClasses.length / classesInCss.size) * 100).toFixed(1)}%`);

console.log('\nTop 30 used classes from site-bundle.css:');
console.log(usedClasses.slice(0, 30));
