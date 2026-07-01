const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const {
  startSeamlessServer,
  stopSeamlessServer,
  getSeamlessAppUrl,
} = require('./utils/backend-process.js');
const { registerVirtualMicIpc } = require('./utils/virtual-mic-ipc.js');

registerVirtualMicIpc();

app.commandLine.appendSwitch('enable-features', 'AudioOutputDevices');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 900,
    minHeight: 700,
    webPreferences: {
      preload: path.resolve('./src/preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'STREEM',
    icon: path.join(__dirname, 'icon.png'),
  });

  mainWindow.setMenuBarVisibility(false);

  try {
    await startSeamlessServer();
    await mainWindow.loadURL(getSeamlessAppUrl());
  } catch (error) {
    await mainWindow.loadFile('src/html/setup-error.html');
    mainWindow.webContents.executeJavaScript(
      `document.getElementById('error-message').textContent = ${JSON.stringify(error.message)};`
    );
  }
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(
        permission === 'media' ||
          permission === 'audio' ||
          permission === 'microphone',
      );
    },
  );

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  stopSeamlessServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopSeamlessServer();
});
