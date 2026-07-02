const fs = require('fs');
const path = require('path');
const { shouldUseWslBackend, toWslPath } = require('./streem-paths.js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MODEL_DIR = path.join(PROJECT_ROOT, 'Model');
const GENERATED_ASSETS = path.join(PROJECT_ROOT, 'config', 'fairseq2', 'generated');

function toFileUri(filePath) {
  const resolved = path.resolve(filePath);
  if (process.platform === 'win32' && shouldUseWslBackend()) {
    return `file://${toWslPath(resolved)}`;
  }
  const normalized = resolved.replace(/\\/g, '/');
  return `file:///${normalized}`;
}

function writeAssetCard(name, checkpointFile) {
  const content = [
    `name: ${name}`,
    `base: ${name.replace(/^streem_/, '')}`,
    `checkpoint: "${toFileUri(path.join(MODEL_DIR, checkpointFile))}"`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(GENERATED_ASSETS, `${name}.yaml`), content, 'utf8');
}

fs.mkdirSync(GENERATED_ASSETS, { recursive: true });

writeAssetCard('streem_seamless_streaming_unity', 'seamless_streaming_unity.pt');
writeAssetCard(
  'streem_seamless_streaming_monotonic_decoder',
  'seamless_streaming_monotonic_decoder.pt',
);

const vadSource = path.join(PROJECT_ROOT, 'config', 'seamless', 'vad_s2st_sc_main.yaml');
const vadTarget = path.join(
  PROJECT_ROOT,
  'seamless-streaming',
  'seamless_server',
  'models',
  'SeamlessStreaming',
  'vad_s2st_sc_main.yaml',
);
fs.mkdirSync(path.dirname(vadTarget), { recursive: true });
fs.copyFileSync(vadSource, vadTarget);

console.log(`Asset cards written to ${GENERATED_ASSETS}`);
console.log('SeamlessStreaming config updated.');
