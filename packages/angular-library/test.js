const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');

function hasSpecs(directory) {
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? hasSpecs(entryPath)
      : entry.isFile() && entry.name.endsWith('.spec.ts');
  });
}

if (!hasSpecs(path.join(__dirname, 'projects/components/src'))) {
  console.log('No Angular specs found; skipping Angular tests.');
} else {
  const result = spawnSync(
    process.execPath,
    [require.resolve('@angular/cli/bin/ng.js'), 'test', ...process.argv.slice(2)],
    { cwd: __dirname, stdio: 'inherit' }
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
