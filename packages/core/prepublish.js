const fs = require('fs');
const path = require('path');
const { devDependencies, license, publishConfig, ...pkg } = require('./package.json');

const env = (process.env.ENVIRONMENT || 'staging').replace('refs/heads/', '');

const tag = env === 'main' ? 'latest' : env;

console.log('prepublish:env', { env, tag, ghr: process.env.GHR });

/**
 * The build runs before semantic-release bumps the version, so the built files carry a
 * placeholder (see src/utils/ui-kit-metadata.ts) that is replaced here with the final version.
 */
const VERSION_PLACEHOLDER = 'UI_KIT_VERSION_PLACEHOLDER';

function stampVersion(dir, version) {
  let stamped = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stamped += stampVersion(file, version);
    } else if (entry.name.endsWith('.js')) {
      const source = fs.readFileSync(file, 'utf8');
      if (source.includes(VERSION_PLACEHOLDER)) {
        fs.writeFileSync(file, source.split(VERSION_PLACEHOLDER).join(version));
        stamped += 1;
      }
    }
  }
  return stamped;
}

const stampedFiles = stampVersion(path.join(__dirname, 'dist'), pkg.version);

if (stampedFiles === 0) {
  throw new Error(
    `prepublish: ${VERSION_PLACEHOLDER} not found in dist/. Run the build again before publishing.`
  );
}

console.log('prepublish:version', { version: pkg.version, stampedFiles });

fs.writeFileSync(
  './package.json',
  JSON.stringify(
    {
      ...pkg,
      publishConfig: process.env.GHR === 'true' || !env.includes('main') ? { tag } : publishConfig,
      scripts: {
        postpublish: pkg.scripts.postpublish,
      },
    },
    null,
    2
  )
);
