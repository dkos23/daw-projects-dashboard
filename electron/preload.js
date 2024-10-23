const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC (backend) functions to frontend
contextBridge.exposeInMainWorld('electronAPI', {
  onSetLocale: (callback) => ipcRenderer.on('set-locale', (event, locale) => callback(locale)),
  onOpenAboutDialog: (callback) => ipcRenderer.on('open-about-dialog', callback),
  searchFiles: (searchPath, extension) => ipcRenderer.invoke('search-files', searchPath, extension),
  openExplorer: (filePath) => ipcRenderer.invoke('open-explorer', filePath),
  exportToCsv: (startPath, projects) => ipcRenderer.invoke('export-to-csv', startPath, projects),
  getIconPath: () => ipcRenderer.invoke('get-icon-path'),
});