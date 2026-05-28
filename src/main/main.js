const { app, BrowserWindow } = require('electron');
const path = require('path');
const registerIPC = require('./utils/ipc.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.resolve('./src/preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Mini Explorer",
    icon: path.join(__dirname, 'icon.png')
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');

  registerIPC(mainWindow);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
