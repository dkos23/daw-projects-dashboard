const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { searchFiles, openExplorer, exportToCsv } = require('./helper'); // Import helper functions

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icons/dkos23_icon.ico'),
    title: "My DAW Projects",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, '../out/settings.html')}`  // Load static HTML in production
    : 'http://localhost:3000/settings';  // Load in development

  win.loadURL(startUrl);

  // Close window event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler to search for Ableton .als files
ipcMain.handle('search-files', async (event, searchPath, extension) => {
  try {
    const results = await searchFiles(searchPath, extension);
    return results;
  } catch (error) {
    console.error('Error searching files:', error);
    return { error: error.message };
  }
});

// IPC handler to open a file in Windows Explorer
ipcMain.handle('open-explorer', async (event, filePath) => {
  try {
    openExplorer(filePath);
    return { message: 'File Explorer opened successfully' };
  } catch (error) {
    return { error: error.message };
  }
});

// IPC handler to export data to CSV
ipcMain.handle('export-to-csv', async (event, startPath, projects) => {
  try {
    const validPath = startPath || os.tmpdir();
    const csvPath = await exportToCsv(validPath, projects);
    return { message: 'CSV exported successfully', path: csvPath };
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return { error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
