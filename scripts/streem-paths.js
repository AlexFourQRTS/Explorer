const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const CONDA_ENV_NAME = 'streem-seamless';
const WIN_ASCII_MINIFORGE = 'C:\\miniforge3';
const WSL_SKIP_DISTROS = new Set([
  'docker-desktop',
  'docker-desktop-data',
  'podman-machine-default',
]);
const WSL_PREFERRED_DISTROS = [
  'Ubuntu-22.04',
  'Ubuntu-24.04',
  'Ubuntu-20.04',
  'Ubuntu',
  'Debian',
];

function hasNonAscii(text) {
  return /[^\x00-\x7F]/.test(text);
}

function getDefaultMiniforgeDir() {
  if (process.env.MINIFORGE_DIR) {
    return process.env.MINIFORGE_DIR;
  }
  const home = os.homedir();
  if (process.platform === 'win32' && hasNonAscii(home)) {
    return WIN_ASCII_MINIFORGE;
  }
  return path.join(home, 'miniforge3');
}

function getProjectRoot() {
  return path.resolve(__dirname, '..');
}

function getMiniforgeCandidates() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return [
      process.env.MINIFORGE_DIR,
      getDefaultMiniforgeDir(),
      WIN_ASCII_MINIFORGE,
      process.env.CONDA_PREFIX,
      path.join(home, 'miniforge3'),
      path.join(home, 'Miniforge3'),
      path.join(home, 'miniconda3'),
      path.join(home, 'Miniconda3'),
    ].filter(Boolean);
  }
  return [
    process.env.MINIFORGE_DIR,
    path.join(home, 'miniforge3'),
    path.join(home, 'Miniforge3'),
  ].filter(Boolean);
}

function getCondaEnvPython() {
  for (const base of getMiniforgeCandidates()) {
    const python =
      process.platform === 'win32'
        ? path.join(base, 'envs', CONDA_ENV_NAME, 'python.exe')
        : path.join(base, 'envs', CONDA_ENV_NAME, 'bin', 'python');
    if (fs.existsSync(python)) {
      return python;
    }
  }

  const venvPython =
    process.platform === 'win32'
      ? path.join(getProjectRoot(), '.venv-seamless', 'Scripts', 'python.exe')
      : path.join(getProjectRoot(), '.venv-seamless', 'bin', 'python');
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  return null;
}

function nativeBackendReady() {
  const python = getCondaEnvPython();
  if (!python) {
    return false;
  }
  try {
    execSync(`"${python}" -c "import uvicorn, fairseq2"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function toWslPath(windowsPath) {
  const resolved = path.resolve(windowsPath);
  const match = /^([A-Za-z]):\\(.*)$/.exec(resolved);
  if (!match) {
    return resolved.replace(/\\/g, '/');
  }
  return `/mnt/${match[1].toLowerCase()}/${match[2].replace(/\\/g, '/')}`;
}

function decodeWslOutput(buffer) {
  for (const encoding of ['utf16le', 'utf8']) {
    try {
      const text = buffer.toString(encoding).replace(/\0/g, '').replace(/^\uFEFF/, '');
      if (text.trim()) {
        return text;
      }
    } catch {
      // try next encoding
    }
  }
  return '';
}

function runWslList(args) {
  try {
    const buffer = execSync(`wsl.exe ${args}`, {
      encoding: 'buffer',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return decodeWslOutput(buffer);
  } catch {
    return '';
  }
}

function getWslDistroNames() {
  const quietList = runWslList('-l -q');
  const quietNames = quietList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (quietNames.length) {
    return quietNames;
  }

  const verboseList = runWslList('-l -v');
  const verboseNames = [];
  for (const line of verboseList.split(/\r?\n/)) {
    if (!/Running|Stopped/i.test(line)) {
      continue;
    }
    const match = line.match(/^\*?\s*([^\s]+)\s+/);
    if (!match) {
      continue;
    }
    const distro = match[1].trim();
    if (distro) {
      verboseNames.push(distro);
    }
  }

  return verboseNames;
}

function getWslDistro() {
  if (process.platform !== 'win32') {
    return null;
  }
  if (process.env.STREEM_WSL_DISTRO) {
    return process.env.STREEM_WSL_DISTRO;
  }

  const names = getWslDistroNames();
  if (!names.length) {
    return null;
  }

  for (const name of WSL_PREFERRED_DISTROS) {
    if (names.includes(name)) {
      return name;
    }
  }

  for (const name of names) {
    if (!WSL_SKIP_DISTROS.has(name.toLowerCase())) {
      return name;
    }
  }

  return null;
}

function shouldUseWslBackend() {
  if (process.platform !== 'win32') {
    return false;
  }
  if (process.env.STREEM_BACKEND === 'wsl') {
    return true;
  }
  if (process.env.STREEM_BACKEND === 'native') {
    return false;
  }
  return !nativeBackendReady();
}

function getModelPath(fileName) {
  return path.join(getProjectRoot(), 'Model', fileName);
}

function ensureModelsPresent() {
  const unity = getModelPath('seamless_streaming_unity.pt');
  if (!fs.existsSync(unity)) {
    throw new Error(`Missing model: ${unity}`);
  }
}

function getServerEnv() {
  const root = getProjectRoot();
  return {
    ...process.env,
    FAIRSEQ2_USER_ASSET_DIR: path.join(root, 'config', 'fairseq2', 'generated'),
    STREEM_MODEL_DIR: path.join(root, 'Model'),
  };
}

function getServerDir() {
  return path.join(getProjectRoot(), 'seamless-streaming', 'seamless_server');
}

module.exports = {
  CONDA_ENV_NAME,
  WIN_ASCII_MINIFORGE,
  getDefaultMiniforgeDir,
  getProjectRoot,
  getCondaEnvPython,
  nativeBackendReady,
  toWslPath,
  getWslDistro,
  shouldUseWslBackend,
  ensureModelsPresent,
  getServerEnv,
  getServerDir,
};
