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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Mini Explorer",
    icon: path.join(__dirname, 'icon.png') // In case an icon is loaded
  });

  // Hide the default menu bar for a cleaner Win10 look
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

// IPC Handler: Get user's home directory
ipcMain.handle('get-home-path', () => {
  return os.homedir();
});

// IPC Handler: Get common quick access paths
ipcMain.handle('get-quick-access', () => {
  const home = os.homedir();
  return [
    { name: 'Desktop', path: path.join(home, 'Desktop'), icon: 'desktop' },
    { name: 'Documents', path: path.join(home, 'Documents'), icon: 'documents' },
    { name: 'Downloads', path: path.join(home, 'Downloads'), icon: 'downloads' },
    { name: 'Pictures', path: path.join(home, 'Pictures'), icon: 'pictures' },
    { name: 'User Profile', path: home, icon: 'user' }
  ];
});

// IPC Handler: Scan Windows drives
ipcMain.handle('get-system-drives', async () => {
  const drives = [];
  if (process.platform === 'win32') {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < letters.length; i++) {
      const drive = `${letters[i]}:\\`;
      try {
        // Synchronous check is fast enough for checking drive letter existence
        fsSync.accessSync(drive, fsSync.constants.F_OK);
        drives.push({ name: `Local Disk (${letters[i]}:)`, path: drive });
      } catch (err) {
        // Drive does not exist or is not accessible
      }
    }
  } else {
    // Fallback for macOS/Linux
    drives.push({ name: 'Root (/)', path: '/' });
  }
  return drives;
});

// IPC Handler: Scan a directory and return files & types
ipcMain.handle('explore-path', async (event, targetPath) => {
  try {
    const resolvedPath = path.resolve(targetPath);
    const stats = await fs.stat(resolvedPath);
    
    if (!stats.isDirectory()) {
      throw new Error("Specified path is not a directory.");
    }

    const files = await fs.readdir(resolvedPath, { withFileTypes: true });
    
    const fileList = [];
    for (const file of files) {
      const filePath = path.join(resolvedPath, file.name);
      let fileStats = null;
      
      try {
        fileStats = await fs.stat(filePath);
      } catch (e) {
        // Skip files that fail to stat due to permission errors or broken links
        continue;
      }

      const isDir = file.isDirectory();
      let fileType = 'File';
      let extension = '';

      if (isDir) {
        fileType = 'File folder';
      } else {
        extension = path.extname(file.name).toLowerCase();
        // Categorize file types in a nice Windows 10 explorer style
        if (['.txt', '.md', '.rtf', '.log'].includes(extension)) {
          fileType = 'Text Document';
        } else if (['.exe', '.msi', '.bat', '.cmd', '.ps1'].includes(extension)) {
          fileType = 'Application / Executable';
        } else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) {
          fileType = 'Compressed Archive';
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(extension)) {
          fileType = 'Image File';
        } else if (['.mp4', '.mkv', '.avi', '.mov'].includes(extension)) {
          fileType = 'Video File';
        } else if (['.mp3', '.wav', '.flac', '.ogg'].includes(extension)) {
          fileType = 'Audio File';
        } else if (['.pdf'].includes(extension)) {
          fileType = 'PDF Document';
        } else if (['.docx', '.doc'].includes(extension)) {
          fileType = 'Word Document';
        } else if (['.xlsx', '.xls', '.csv'].includes(extension)) {
          fileType = 'Excel Spreadsheet';
        } else if (['.html', '.css', '.js', '.ts', '.json', '.jsx', '.tsx'].includes(extension)) {
          fileType = 'Web / Source Code';
        } else {
          fileType = extension ? `${extension.substring(1).toUpperCase()} File` : 'File';
        }
      }

      fileList.push({
        name: file.name,
        path: filePath,
        isDirectory: isDir,
        type: fileType,
        size: isDir ? '' : fileStats.size,
        modified: fileStats.mtime.toLocaleString()
      });
    }

    // Sort: directories first, then alphabetically
    fileList.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return {
      currentPath: resolvedPath,
      parentPath: path.dirname(resolvedPath),
      files: fileList
    };

  } catch (error) {
    return { error: error.message };
  }
});

// IPC Handler: Open folder/file in native OS Shell explorer
ipcMain.handle('open-in-shell', async (event, targetPath) => {
  try {
    const errorMsg = await shell.openPath(targetPath);
    if (errorMsg) {
      return { error: errorMsg };
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
