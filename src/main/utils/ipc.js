const { ipcMain, dialog, shell, BrowserWindow } = require('electron');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const os = require('os');

function registerIPC(mainWindow) {

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

  ipcMain.handle('explore-path', async (event, targetPath) => {
    if (fsSync.existsSync(targetPath)) {
      shell.showItemInFolder(targetPath);
    } else {
      return { success: false, message: 'Path does not exist' };
    }
  });

  ipcMain.handle('open-in-shell', async (event, targetPath) => {
    if (fsSync.existsSync(targetPath)) {
      shell.openPath(targetPath);
      return { success: true };
    } else {
      return { success: false, message: 'Path does not exist' };
    }
  });

  ipcMain.handle('get-home-path', async () => {
    return os.homedir();
  });

  ipcMain.handle('get-quick-access', async () => {
    const home = os.homedir();
    return [
      { name: 'Рабочий стол', path: path.join(home, 'Desktop'), icon: 'desktop' },
      { name: 'Документы', path: path.join(home, 'Documents'), icon: 'documents' },
      { name: 'Загрузки', path: path.join(home, 'Downloads'), icon: 'downloads' },
      { name: 'Изображения', path: path.join(home, 'Pictures'), icon: 'pictures' }
    ];
  });

  ipcMain.handle('get-system-drives', async () => {
    if (process.platform === 'win32') {
      return [{ name: 'Локальный диск (C:)', path: 'C:\\' }];
    } else {
      return [{ name: 'Корневой раздел (/)', path: '/' }];
    }
  });

  ipcMain.handle('select-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Текстовые документы и конфигурации', extensions: ['txt', 'json', 'env', 'ini', 'js', 'html', 'css', 'xml'] },
        { name: 'Все файлы', extensions: ['*'] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('select-save-file-dialog', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Создать новый файл',
      defaultPath: path.join(os.homedir(), 'note.txt'),
      filters: [
        { name: 'Текстовые документы', extensions: ['txt'] },
        { name: 'Конфигурационные файлы', extensions: ['json', 'env', 'ini'] },
        { name: 'Все файлы', extensions: ['*'] }
      ]
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    return result.filePath;
  });

  ipcMain.handle('read-text-file', async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return { success: true, content: data, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('write-text-file', async (event, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-alert-modal', async (event, message, type) => {
    const alertModal = new BrowserWindow({
      width: 350,
      height: 200,
      parent: mainWindow,
      modal: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.resolve('./src/preload/preload.js'),
      }
    });

    alertModal.setMenuBarVisibility(false);

    const filePath = path.resolve('./src/html/alert.html');
    alertModal.loadURL(`file://${filePath}?message=${encodeURIComponent(message)}&type=${type}`);
  });

  ipcMain.handle('close-window', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
  });
}

module.exports = registerIPC;
