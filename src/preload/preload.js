

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  getHomePath: () => ipcRenderer.invoke('get-home-path'), // not used yet, but will be in the future

  getQuickAccess: () => ipcRenderer.invoke('get-quick-access'), // not used yet, but will be in the future

  getSystemDrives: () => ipcRenderer.invoke('get-system-drives'), // not used yet, but will be in the future

  explorePath: (targetPath) => ipcRenderer.invoke('explore-path', targetPath), // not used yet, but will be in the future

  openInShell: (targetPath) => ipcRenderer.invoke('open-in-shell', targetPath), // not used yet, but will be in the future

  openModal: (type) => ipcRenderer.invoke('open-loop-modal', type)
});