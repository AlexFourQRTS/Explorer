const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');

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



ipcMain.handle('open-loop-modal', async (event, loopType) => {
  const modal = new BrowserWindow({
    width: 500,
    height: 400,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve('./src/preload/preload.js'),
    }
  });

  modal.setMenuBarVisibility(false);

  const filePath = path.resolve('./src/html/modal.html');

  modal.loadURL(`file://${filePath}?type=${loopType}`);

});

