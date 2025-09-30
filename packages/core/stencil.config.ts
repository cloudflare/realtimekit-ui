import { Config } from '@stencil/core';
import { postcss } from '@stencil-community/postcss';
import { reactOutputTarget } from '@stencil/react-output-target';
// import { vueOutputTarget } from '@stencil/vue-output-target';
import { angularOutputTarget } from '@stencil/angular-output-target';
import nodePolyfills from 'rollup-plugin-node-polyfills';

const realtimekitPath = require.resolve('@cloudflare/realtimekit/inlined');

const esModules = ['lodash-es'].join('|');

export const config: Config = {
  namespace: 'realtimekit-ui',
  sourceMap: false,
  devServer: {
    openBrowser: false,
    reloadStrategy: 'pageReload',
  },
  watchIgnoredRegex: new RegExp(`node_modules/@cloudflare/realtimekit/.*`),
  extras: {
    experimentalImportInjection: true,
  },
  testing: {
    transform: {
      '^.+\\.(ts|tsx|js|jsx|css)$': '@stencil/core/testing/jest-preprocessor',
    },
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  },
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    angularOutputTarget({
      componentCorePackage: '@cloudflare/realtimekit-ui',
      outputType: 'component',
      directivesProxyFile:
        '../angular-library/projects/components/src/lib/stencil-generated/components.ts',
      directivesArrayFile:
        '../angular-library/projects/components/src/lib/stencil-generated/index.ts',
    }),
    // vueOutputTarget({
    //   componentCorePackage: '@cloudflare/realtimekit-ui',
    //   proxiesFile: '../vue-library/lib/components.ts',
    // }),
    reactOutputTarget({
      componentCorePackage: '@cloudflare/realtimekit-ui',
      proxiesFile: '../react-library/src/components/stencil-generated/index.ts',
      includeDefineCustomElements: true,
    }),
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-json',
      file: 'dist/docs/docs-components.json',
    },
    {
      type: 'docs-vscode',
      file: 'dist/docs/docs-vscode.json',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
      // copy latest esm build to public/ for importing
      copy: [
        {
          src: realtimekitPath,
          dest: 'realtimekit.js',
        },
      ],
    },
  ],
  plugins: [
    postcss({
      plugins: [require('tailwindcss/nesting'), require('tailwindcss'), require('autoprefixer')],
    }),
  ],
  rollupPlugins: {
    after: [nodePolyfills()],
  },
};
