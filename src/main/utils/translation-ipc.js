const { ipcMain } = require('electron');
const WebSocket = require('ws');
const {
  WS_PORT,
  startBackendProcess,
  stopBackendProcess,
} = require('./backend-process.js');

let wsClient = null;
let mainWindowRef = null;

function sendWsMessage(payload) {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    throw new Error('Backend WebSocket is not connected');
  }
  wsClient.send(JSON.stringify(payload));
}

function connectWebSocket() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    wsClient = new WebSocket(`ws://127.0.0.1:${WS_PORT}`);

    wsClient.on('open', () => {
      resolve();
    });

    wsClient.on('message', (rawData) => {
      if (!mainWindowRef) {
        return;
      }
      const payload = JSON.parse(rawData.toString());
      mainWindowRef.webContents.send('translation-event', payload);
    });

    wsClient.on('error', (error) => {
      reject(error);
    });

    wsClient.on('close', () => {
      wsClient = null;
    });
  });
}

function registerTranslationIPC(mainWindow) {
  mainWindowRef = mainWindow;

  ipcMain.handle('translation-prepare', async () => {
    await startBackendProcess();
    await connectWebSocket();
    sendWsMessage({ action: 'prepare' });
    return { success: true };
  });

  ipcMain.handle('translation-list-devices', async () => {
    await startBackendProcess();
    await connectWebSocket();
    sendWsMessage({ action: 'list_devices' });
    return { success: true };
  });

  ipcMain.handle('translation-start', async (_event, config) => {
    await startBackendProcess();
    await connectWebSocket();
    sendWsMessage({
      action: 'start',
      source_lang: config.sourceLang,
      target_lang: config.targetLang,
      input_device: config.inputDevice,
      output_device: config.outputDevice,
    });
    return { success: true };
  });

  ipcMain.handle('translation-stop', async () => {
    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      return { success: true };
    }
    sendWsMessage({ action: 'stop' });
    return { success: true };
  });

  ipcMain.handle('translation-shutdown', async () => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.close();
    }
    stopBackendProcess();
    return { success: true };
  });
}

module.exports = registerTranslationIPC;
