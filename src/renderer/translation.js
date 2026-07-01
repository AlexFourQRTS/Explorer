const STATUS_LABELS = {
  idle: 'translation.status_idle',
  loading: 'translation.status_loading',
  ready: 'translation.status_ready',
  listening: 'translation.status_listening',
  translating: 'translation.status_translating',
};

let eventUnsubscribe = null;
let modelsReady = false;

function translateText(key) {
  return window.streemI18n.translateText(key);
}

function getSelectedValue(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    return null;
  }
  const rawValue = element.value;
  if (rawValue === '') {
    return null;
  }
  return Number.isNaN(Number(rawValue)) ? rawValue : Number(rawValue);
}

function setStatusText(statusKey) {
  const statusElement = document.getElementById('translation-status-value');
  if (!statusElement) {
    return;
  }
  const labelKey = STATUS_LABELS[statusKey] || 'translation.status_idle';
  statusElement.textContent = translateText(labelKey);
}

function appendTranscript(text) {
  const transcriptElement = document.getElementById('translation-transcript');
  if (!transcriptElement) {
    return;
  }
  transcriptElement.textContent = text;
}

function appendTranslation(text) {
  const translationElement = document.getElementById('translation-output');
  if (!translationElement) {
    return;
  }
  translationElement.textContent = text;
}

function fillDeviceSelect(selectId, devices) {
  const selectElement = document.getElementById(selectId);
  if (!selectElement) {
    return;
  }
  selectElement.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Default';
  selectElement.appendChild(defaultOption);
  devices.forEach((device) => {
    const option = document.createElement('option');
    option.value = String(device.index);
    option.textContent = `${device.name} (${device.index})`;
    selectElement.appendChild(option);
  });
}

function handleTranslationEvent(payload) {
  if (payload.type === 'status') {
    setStatusText(payload.state);
    if (payload.state === 'ready') {
      modelsReady = true;
    }
    return;
  }
  if (payload.type === 'devices') {
    fillDeviceSelect('translation-input-device', payload.inputs || []);
    fillDeviceSelect('translation-output-device', payload.outputs || []);
    return;
  }
  if (payload.type === 'transcript') {
    appendTranscript(payload.text);
    return;
  }
  if (payload.type === 'translated') {
    appendTranslation(payload.text);
    return;
  }
  if (payload.type === 'error') {
    window.electronAPI.openAlert(payload.message, 'error');
  }
}

async function prepareTranslationModels() {
  setStatusText('loading');
  try {
    await window.electronAPI.translationPrepare();
    await window.electronAPI.translationListDevices();
  } catch (error) {
    window.electronAPI.openAlert(
      `${translateText('translation.error_prepare')}: ${error.message}`,
      'error'
    );
    setStatusText('idle');
  }
}

async function startTranslation() {
  if (!modelsReady) {
    await prepareTranslationModels();
  }
  const config = {
    sourceLang: getSelectedValue('translation-source-lang'),
    targetLang: getSelectedValue('translation-target-lang'),
    inputDevice: getSelectedValue('translation-input-device'),
    outputDevice: getSelectedValue('translation-output-device'),
  };
  try {
    await window.electronAPI.translationStart(config);
  } catch (error) {
    window.electronAPI.openAlert(
      `${translateText('translation.error_start')}: ${error.message}`,
      'error'
    );
  }
}

async function stopTranslation() {
  await window.electronAPI.translationStop();
  setStatusText('ready');
}

function initTranslationPanel() {
  document
    .getElementById('translation-prepare-btn')
    .addEventListener('click', prepareTranslationModels);
  document
    .getElementById('translation-start-btn')
    .addEventListener('click', startTranslation);
  document
    .getElementById('translation-stop-btn')
    .addEventListener('click', stopTranslation);

  eventUnsubscribe = window.electronAPI.onTranslationEvent(handleTranslationEvent);
  setStatusText('idle');
}

window.streemTranslation = {
  initTranslationPanel,
};
