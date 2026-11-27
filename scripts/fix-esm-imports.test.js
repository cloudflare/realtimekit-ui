const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { afterEach, beforeEach, test } = require('node:test');
const { fixEsmImports } = require('./fix-esm-imports');

let dir;

function write(file, contents) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function read(file) {
  return fs.readFileSync(path.join(dir, file), 'utf8');
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-react-esm-'));
  // Same layout and specifiers as the tsc output in packages/react-library/dist/es
  write('package.json', '{ "type": "module" }');
  write('index.js', "export * from './components';\n");
  write('components/index.js', "export * from './stencil-generated/index';\n");
  write(
    'components/stencil-generated/index.js',
    "import { createComponent } from './react-component-lib';\n" +
      "export const RtkButton = createComponent('rtk-button');\n"
  );
  write(
    'components/stencil-generated/react-component-lib/index.js',
    "export { createComponent } from './createComponent';\n"
  );
  write(
    'components/stencil-generated/react-component-lib/createComponent.js',
    'export const createComponent = (tagName) => tagName;\n'
  );
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

test('points relative specifiers at a file or a directory index', () => {
  fixEsmImports(dir);

  assert.equal(read('index.js'), "export * from './components/index.js';\n");
  assert.equal(read('components/index.js'), "export * from './stencil-generated/index.js';\n");
  assert.match(
    read('components/stencil-generated/index.js'),
    /from '\.\/react-component-lib\/index\.js'/
  );
  assert.equal(
    read('components/stencil-generated/react-component-lib/index.js'),
    "export { createComponent } from './createComponent.js';\n"
  );
});

test('rewrites side-effect and dynamic imports', () => {
  write('polyfill.js', '');
  write('lazy/index.js', 'export default 1;\n');
  write(
    'components/load.js',
    "import '../polyfill';\nexport const load = () => import('../lazy');\n"
  );

  fixEsmImports(dir);

  assert.equal(
    read('components/load.js'),
    "import '../polyfill.js';\nexport const load = () => import('../lazy/index.js');\n"
  );
});

test('leaves package and already complete specifiers alone', () => {
  const source =
    "import React from 'react';\n" +
    "export * from '@cloudflare/realtimekit-ui';\n" +
    "export * from './components/index.js';\n";
  write('extra.js', source);

  fixEsmImports(dir);

  assert.equal(read('extra.js'), source);
});

test('warns about relative specifiers it cannot resolve', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const source = "export * from './missing';\n";
  write('broken.js', source);

  fixEsmImports(dir);

  assert.equal(read('broken.js'), source);
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /'\.\/missing'/);
});

test('the output loads with the Node ESM loader once fixed', async () => {
  const entry = pathToFileURL(path.join(dir, 'index.js'));
  await assert.rejects(import(`${entry}?before`), { code: 'ERR_UNSUPPORTED_DIR_IMPORT' });

  fixEsmImports(dir);

  const { RtkButton } = await import(`${entry}?after`);
  assert.equal(RtkButton, 'rtk-button');
});
