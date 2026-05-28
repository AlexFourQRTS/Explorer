

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {


  openModal: (type) => ipcRenderer.invoke('open-loop-modal', type),

  selectFileDialog: () => ipcRenderer.invoke('select-file-dialog'),

  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),

  writeTextFile: (filePath, content) => ipcRenderer.invoke('write-text-file', filePath, content),

  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

  openAlert: (message, type) => ipcRenderer.invoke('open-alert-modal', message, type),

  closeWindow: () => ipcRenderer.invoke('close-window')
});