import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const targetFile = path.join(ROOT_DIR, 'node_modules', '@keystatic', 'core', 'dist', 'keystatic-core-ui.js');

if (!fs.existsSync(targetFile)) {
  console.log('[patch-keystatic] keystatic-core-ui.js not found in node_modules, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');

// Target the Column rendering without allowsResizing
const searchTarget = `key_0 === STATUS ? /*#__PURE__*/jsx(Column, {
        isRowHeader: true,
        allowsSorting: true,
        ...options,
        children: /*#__PURE__*/jsx(Icon, {
          "aria-label": "Status",
          src: diffIcon
        })
      }, key_0) : /*#__PURE__*/jsx(Column, {
        isRowHeader: true,
        allowsSorting: true,
        ...options,
        children: name
      }, key_0)`;

const patchedReplacement = `key_0 === STATUS ? /*#__PURE__*/jsx(Column, {
        isRowHeader: true,
        allowsSorting: true,
        ...options,
        children: /*#__PURE__*/jsx(Icon, {
          "aria-label": "Status",
          src: diffIcon
        })
      }, key_0) : /*#__PURE__*/jsx(Column, {
        isRowHeader: true,
        allowsSorting: true,
        allowsResizing: true,
        ...options,
        children: name
      }, key_0)`;

if (content.includes(searchTarget)) {
  content = content.replace(searchTarget, patchedReplacement);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('[patch-keystatic] Successfully patched Keystatic: column resizing enabled on CollectionTable!');
} else if (content.includes('allowsResizing: true')) {
  console.log('[patch-keystatic] Keystatic already patched with allowsResizing.');
} else {
  console.warn('[patch-keystatic] Search pattern not matched; Keystatic may have an updated structure.');
}
