const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
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

// Домашняя папка пользователя
ipcMain.handle('get-home-path', async () => {
  return os.homedir();
});

// Быстрый доступ (дефолтные папки)
ipcMain.handle('get-quick-access', async () => {
  const home = os.homedir();
  return [
    { name: 'Рабочий стол', path: path.join(home, 'Desktop'), icon: 'desktop' },
    { name: 'Документы', path: path.join(home, 'Documents'), icon: 'documents' },
    { name: 'Загрузки', path: path.join(home, 'Downloads'), icon: 'downloads' },
    { name: 'Изображения', path: path.join(home, 'Pictures'), icon: 'pictures' }
  ];
});

// Системные диски
ipcMain.handle('get-system-drives', async () => {
  if (process.platform === 'win32') {
    return [{ name: 'Локальный диск (C:)', path: 'C:\\' }];
  } else {
    return [{ name: 'Корневой раздел (/)', path: '/' }];
  }
});

// Диалоговое окно выбора файла для чтения
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

// Чтение текстового файла
ipcMain.handle('read-text-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, content: data, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Запись/обновление текстового файла
ipcMain.handle('write-text-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Удаление файла
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Открытие всплывающего окна (модального алерта)
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

// Закрытие активного окна (для кнопки ОК в алерте)
ipcMain.handle('close-window', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});


