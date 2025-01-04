const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { searchFiles, openExplorer, exportToCsv } = require('./helper'); // Import helper functions

let mainWindow;

function createWindow() {

  // Get system locale (this will return something like 'en-US' or 'de')
  const systemLocale = app.getLocale();
  console.log("System Locale: ", systemLocale);  // For debugging


  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icons/daw_app_icon_no_bg.ico'),
    title: "DAW Projects Dashboard",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  // Load static HTML in production or in development
  const startUrl = app.isPackaged
    ? `file://${path.join(__dirname, '../out/settings.html')}`
    : 'http://localhost:3000/settings';

  
  mainWindow.loadURL(startUrl);

  // Send system locale to renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('set-locale', systemLocale);
  });

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' },
      ],
    },
    // {
    //   label: 'Edit',
    //   submenu: [
    //     { role: 'undo' },
    //     { role: 'redo' },
    //     { type: 'separator' },
    //     { role: 'cut' },
    //     { role: 'copy' },
    //     { role: 'paste' },
    //   ],
    // },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'togglefullscreen' },
        {
          label: 'Toggle DevTools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.openDevTools();
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        // {
        //   label: 'Learn More',
        //   click: async () => {
        //     console.log("Learn More clicked, sending 'openExternal' event");
        //     await shell.openExternal('https://dkos23.github.io/ableton-dashboard/');
        //   },
        // },
        {
          label: 'About',
          click: () => {
            console.log("About clicked, sending 'open-about-dialog' event");
            mainWindow.webContents.send('open-about-dialog');
          },
        },
      ],
    },
  ];

  // Build the menu from the template
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Close window event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler to search for eg:Ableton .als files
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

ipcMain.handle('get-icon-path', () => {
  // In development, we serve it from the public directory
  if (process.env.NODE_ENV === 'development') {
    return '/icons/daw_app_icon_no_bg_256.png';
  } else {
    // In production, we load it from the built resources
    return `file://${path.join(process.resourcesPath, 'icons', 'daw_app_icon_no_bg_256.png')}`;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
