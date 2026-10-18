// Run on packages/react-library/dist/es by that package's `compile` script.
// tsc keeps relative specifiers as written (`./components`), but Node's ESM loader needs the
// full path (`./components/index.js`). Bundlers resolve both, so the problem only shows up when
// Node itself loads dist/es, e.g. during SSR in Astro, and fails with ERR_UNSUPPORTED_DIR_IMPORT.
// This points each relative specifier at the file it resolves to.
const fs = require('fs');
const path = require('path');

const RELATIVE_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]*)\2/g;

function resolveSpecifier(file, specifier) {
  if (/\.(c|m)?js$|\.json$/.test(specifier)) return specifier;

  const target = path.resolve(path.dirname(file), specifier);
  if (fs.existsSync(`${target}.js`)) return `${specifier}.js`;
  if (fs.existsSync(path.join(target, 'index.js'))) return `${specifier}/index.js`;
  return specifier;
}

function addExtensions(file) {
  const source = fs.readFileSync(file, 'utf8');
  const output = source.replace(
    RELATIVE_SPECIFIER,
    (_match, prefix, quote, specifier) =>
      `${prefix}${quote}${resolveSpecifier(file, specifier)}${quote}`
  );
  if (output !== source) fs.writeFileSync(file, output);
}

function fixEsmImports(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) fixEsmImports(entryPath);
    else if (entry.name.endsWith('.js')) addExtensions(entryPath);
  }
}

module.exports = { fixEsmImports };

if (require.main === module) {
  const [dir] = process.argv.slice(2);
  if (!dir) {
    console.error('Usage: node scripts/fix-esm-imports.js <dir>');
    process.exit(1);
  }
  fixEsmImports(path.resolve(dir));
}
