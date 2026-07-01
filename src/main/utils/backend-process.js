const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const SERVER_PORT = Number(process.env.STREEM_PORT || 7860);
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;
const READY_TIMEOUT_MS = 120000;

let serverProcess = null;

function getProjectRoot() {
  return path.resolve(__dirname, '../../..');
}

function getStartScript() {
  return path.join(getProjectRoot(), 'scripts', 'start-server.sh');
}

function startSeamlessServer() {
  if (serverProcess) {
    return waitForServerReady();
  }

  const startScript = getStartScript();
  if (!fs.existsSync(startScript)) {
    return Promise.reject(new Error(`Missing start script: ${startScript}`));
  }

  serverProcess = spawn('bash', [startScript], {
    cwd: getProjectRoot(),
    env: {
      ...process.env,
      STREEM_PORT: String(SERVER_PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[seamless] ${chunk}`);
  });

  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[seamless] ${chunk}`);
  });

  serverProcess.on('exit', () => {
    serverProcess = null;
  });

  return waitForServerReady();
}

function waitForServerReady() {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const tryFetch = () => {
      if (Date.now() > deadline) {
        reject(new Error('Seamless server startup timeout'));
        return;
      }

      fetch(SERVER_URL)
        .then((response) => {
          if (response.ok) {
            resolve();
            return;
          }
          setTimeout(tryFetch, 500);
        })
        .catch(() => {
          setTimeout(tryFetch, 500);
        });
    };
    tryFetch();
  });
}

function stopSeamlessServer() {
  if (!serverProcess) {
    return;
  }
  serverProcess.kill();
  serverProcess = null;
}

function getSeamlessAppUrl() {
  const roomId = 'STREEM';
  return `${SERVER_URL}/?autoJoin=1&roomID=${roomId}`;
}

module.exports = {
  SERVER_PORT,
  SERVER_URL,
  startSeamlessServer,
  stopSeamlessServer,
  getSeamlessAppUrl,
};
