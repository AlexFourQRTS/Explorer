

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  getHomePath: () => ipcRenderer.invoke('get-home-path'),

  getQuickAccess: () => ipcRenderer.invoke('get-quick-access'),

  getSystemDrives: () => ipcRenderer.invoke('get-system-drives'),

  explorePath: (targetPath) => ipcRenderer.invoke('explore-path', targetPath),

  openInShell: (targetPath) => ipcRenderer.invoke('open-in-shell', targetPath),

  openModal: (type) => ipcRenderer.invoke('open-loop-modal', type)
});