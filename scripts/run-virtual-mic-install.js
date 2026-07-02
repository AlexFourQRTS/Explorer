const { spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const script =
  process.platform === 'win32' ? 'install-virtual-mic.ps1' : 'install-blackhole.sh';

const result =
  process.platform === 'win32'
    ? spawnSync(
        'powershell',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, script)],
        { cwd: projectRoot, stdio: 'inherit' },
      )
    : spawnSync('bash', [path.join(__dirname, script)], {
        cwd: projectRoot,
        stdio: 'inherit',
      });

process.exit(result.status ?? 1);
