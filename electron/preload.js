const { contextBridge, ipcRenderer, app } = require('electron');
// const path = require('path');

// Expose IPC (backend) functions to frontend
contextBridge.exposeInMainWorld('electronAPI', {
  onSetLocale: (callback) => ipcRenderer.on('set-locale', (event, locale) => callback(locale)),
  onOpenAboutDialog: (callback) => ipcRenderer.on('open-about-dialog', callback),
  searchFiles: (searchPath, extension) => ipcRenderer.invoke('search-files', searchPath, extension),
  openExplorer: (filePath) => ipcRenderer.invoke('open-explorer', filePath),
  exportToCsv: (startPath, projects) => ipcRenderer.invoke('export-to-csv', startPath, projects),
  getIconPath: () => ipcRenderer.invoke('get-icon-path'),
  reloadWindow: () => ipcRenderer.send('reload-window'),
  // needed in LanguageContext
  isPackaged: () => ipcRenderer.invoke("is-packaged"),
  getPath: (file) => ipcRenderer.invoke("get-path", file),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
});