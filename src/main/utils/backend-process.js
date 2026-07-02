const path = require('path');
const { spawn, execSync } = require('child_process');
const {
  getProjectRoot,
  getCondaEnvPython,
  ensureModelsPresent,
  getServerEnv,
  getServerDir,
  shouldUseWslBackend,
  getWslDistro,
  toWslPath,
} = require('../../../scripts/streem-paths.js');

const SERVER_PORT = Number(process.env.STREEM_PORT || 7860);
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;
const READY_TIMEOUT_MS = Number(process.env.STREEM_READY_TIMEOUT_MS || 300000);

let serverProcess = null;

function prepareAssets() {
  if (shouldUseWslBackend()) {
    return;
  }
  execSync('node scripts/prepare-assets.js', {
    cwd: getProjectRoot(),
    stdio: 'inherit',
  });
}

function freePort(port) {
  if (process.env.STREEM_FREE_PORT === '0') {
    return;
  }
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const pids = new Set();
      for (const line of output.split('\n')) {
        if (!line.includes('LISTENING')) {
          continue;
        }
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          pids.add(pid);
        }
      }
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      }
      return;
    }
    execSync(`lsof -ti :${port} | xargs kill 2>/dev/null || true`, {
      shell: true,
      stdio: 'ignore',
    });
  } catch {
    // Port already free.
  }
}

function attachServerLogs(child) {
  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[seamless] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[seamless] ${chunk}`);
  });

  child.on('exit', () => {
    serverProcess = null;
  });
}

function startNativeServer() {
  const python = getCondaEnvPython();
  if (!python) {
    throw new Error(
      'Python env "streem-seamless" not found. Run from Explorer/: npm run setup:seamless',
    );
  }

  const serverDir = getServerDir();
  serverProcess = spawn(
    python,
    [
      '-m',
      'uvicorn',
      'app_pubsub:app',
      '--host',
      '127.0.0.1',
      '--port',
      String(SERVER_PORT),
    ],
    {
      cwd: serverDir,
      env: {
        ...getServerEnv(),
        STREEM_PORT: String(SERVER_PORT),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  attachServerLogs(serverProcess);
}

function startWslServer() {
  const distro = getWslDistro();
  if (!distro) {
    throw new Error(
      'Backend requires WSL2 with Ubuntu. Run: wsl --install -d Ubuntu\nThen: npm run setup:seamless',
    );
  }

  const wslRoot = toWslPath(getProjectRoot());
  const startScript = `${wslRoot}/scripts/start-server.sh`;
  serverProcess = spawn(
    'wsl.exe',
    [
      '-d',
      distro,
      'bash',
      '-lc',
      `STREEM_PROJECT_ROOT='${wslRoot}' tr -d '\\r' < '${startScript}' > /tmp/streem-start-server.sh && STREEM_PROJECT_ROOT='${wslRoot}' STREEM_SKIP_PREPARE_ASSETS=1 bash /tmp/streem-start-server.sh`,
    ],
    {
      env: {
        ...process.env,
        STREEM_PORT: String(SERVER_PORT),
        STREEM_SKIP_PREPARE_ASSETS: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  attachServerLogs(serverProcess);
}

function startSeamlessServer() {
  if (serverProcess) {
    return waitForServerReady();
  }

  ensureModelsPresent();
  prepareAssets();
  freePort(SERVER_PORT);

  if (shouldUseWslBackend()) {
    startWslServer();
  } else {
    startNativeServer();
  }

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
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(serverProcess.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
  } else {
    serverProcess.kill();
  }
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
