const path = require('path');
const { ipcMain } = require('electron');
const { spawn } = require('child_process');

function getProjectRoot() {
  return path.resolve(__dirname, '../../..');
}

function runScript(scriptName) {
  const scriptPath = path.join(getProjectRoot(), 'scripts', scriptName);
  return new Promise((resolve, reject) => {
    const child = spawn('bash', [scriptPath], { stdio: ['ignore', 'pipe', 'pipe'] });
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

function registerVirtualMicIpc() {
  ipcMain.handle('virtual-mic-check', async () => {
    try {
      const result = await runScript('check-blackhole.sh');
      return { installed: result === 'installed' };
    } catch {
      return { installed: false };
    }
  });

  ipcMain.handle('virtual-mic-install', async () => {
    await runScript('install-blackhole.sh');
    return { ok: true };
  });
}

module.exports = { registerVirtualMicIpc };
