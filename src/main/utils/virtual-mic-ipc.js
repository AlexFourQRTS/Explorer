const path = require('path');
const { ipcMain } = require('electron');
const { spawn } = require('child_process');

function getProjectRoot() {
  return path.resolve(__dirname, '../../..');
}

function runScript(scriptName) {
  const scriptPath = path.join(getProjectRoot(), 'scripts', scriptName);
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const child = isWindows
      ? spawn(
          'powershell',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
          { stdio: ['ignore', 'pipe', 'pipe'] },
        )
      : spawn('bash', [scriptPath], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(stderr.trim() || `Script failed: ${scriptName}`));
    });
  });
}

function getCheckScript() {
  return process.platform === 'win32' ? 'check-virtual-mic.ps1' : 'check-blackhole.sh';
}

function getInstallScript() {
  return process.platform === 'win32' ? 'install-virtual-mic.ps1' : 'install-blackhole.sh';
}

function registerVirtualMicIpc() {
  ipcMain.handle('virtual-mic-check', async () => {
    try {
      const result = await runScript(getCheckScript());
      return { installed: result === 'installed' };
    } catch {
      return { installed: false };
    }
  });

  ipcMain.handle('virtual-mic-install', async () => {
    await runScript(getInstallScript());
    return { ok: true };
  });
}

module.exports = { registerVirtualMicIpc };
