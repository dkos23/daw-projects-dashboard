const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC (backend) functions to frontend
contextBridge.exposeInMainWorld('fileOperations', {
  searchFiles: (searchPath, extension) => ipcRenderer.invoke('search-files', searchPath, extension),
  openExplorer: (filePath) => ipcRenderer.invoke('open-explorer', filePath),
  exportToCsv: (startPath, projects) => ipcRenderer.invoke('export-to-csv', startPath, projects)
});