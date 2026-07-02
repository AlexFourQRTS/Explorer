const { spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

if (process.platform === 'win32') {
  const result = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      path.join(__dirname, 'setup-seamless.ps1'),
    ],
    { cwd: projectRoot, stdio: 'inherit' },
  );
  process.exit(result.status ?? 1);
}

const result = spawnSync('bash', [path.join(__dirname, 'setup-seamless.sh')], {
  cwd: projectRoot,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
