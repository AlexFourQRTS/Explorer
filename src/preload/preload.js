const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getHomePath: () => ipcRenderer.invoke('get-home-path'),
  getQuickAccess: () => ipcRenderer.invoke('get-quick-access'),
  getSystemDrives: () => ipcRenderer.invoke('get-system-drives'),
  explorePath: (targetPath) => ipcRenderer.invoke('explore-path', targetPath),
  openInShell: (targetPath) => ipcRenderer.invoke('open-in-shell', targetPath),
  openModal: (type) => ipcRenderer.invoke('open-loop-modal', type),
  selectFileDialog: () => ipcRenderer.invoke('select-file-dialog'),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  writeTextFile: (filePath, content) => ipcRenderer.invoke('write-text-file', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  openAlert: (message, type) => ipcRenderer.invoke('open-alert-modal', message, type),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  selectSaveFileDialog: () => ipcRenderer.invoke('select-save-file-dialog')
});