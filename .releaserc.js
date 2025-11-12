const baseConfig = {
  branches: [],
  tagFormat: '@cloudflare/realtimekit-ui-v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        pkgRoot: './packages/core/',
        tarballDir: 'dist',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        pkgRoot: './packages/react-library/',
        tarballDir: 'dist',
      },
    ],
    // [
    //   '@semantic-release/npm',
    //   {
    //     npmPublish: false,
    //     pkgRoot: './packages/vue-library',
    //     tarballDir: 'dist',
    //   },
    // ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        pkgRoot: './packages/angular-library/projects/components/dist',
        tarballDir: 'dist',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          './packages/core/package.json',
          './packages/react-library/package.json',
          // './packages/vue-library/package.json',
          './packages/angular-library/projects/components/package.json',
          'CHANGELOG.md',
          'package.json',
          'package-lock.json',
          './packages/react-library/src/**/*.{js,ts,tsx}',
          // './packages/vue-library/src/**/*.{js,ts,tsx}',
          './packages/angular-library/projects/components/src/**/*.{js,ts,tsx}',
        ],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}\n\n\nskip-checks: true',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: 'dist/*.tgz',
      },
    ],
  ],
  repositoryUrl: 'https://github.com/cloudflare/realtimekit-ui',
};

const config = {
  ...baseConfig,
  branches: ['main', { name: 'staging', prerelease: true }],
};

module.exports = config;
