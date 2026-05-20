const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const updater = require('./updater');
const crashReporter = require('./crashReporter');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// === Window state persistence ===
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { width: 1440, height: 900 };
}

function saveWindowState() {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    const isMaximized = mainWindow.isMaximized();
    const isFullScreen = mainWindow.isFullScreen();
    fs.writeFileSync(stateFile, JSON.stringify({ ...bounds, isMaximized, isFullScreen }));
  } catch (e) { /* ignore */ }
}

// === Recent files ===
const recentFile = path.join(app.getPath('userData'), 'recent-files.json');

function loadRecentFiles() {
  try {
    if (fs.existsSync(recentFile)) {
      return JSON.parse(fs.readFileSync(recentFile, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

function addRecentFile(filePath) {
  const list = loadRecentFiles().filter(f => f !== filePath);
  list.unshift(filePath);
  if (list.length > 10) list.length = 10;
  try { fs.writeFileSync(recentFile, JSON.stringify(list)); } catch (e) { /* ignore */ }
  updateRecentFilesMenu();
  return list;
}

function removeRecentFile(filePath) {
  const list = loadRecentFiles().filter(f => f !== filePath);
  try { fs.writeFileSync(recentFile, JSON.stringify(list)); } catch (e) { /* ignore */ }
  updateRecentFilesMenu();
  return list;
}

function clearRecentFiles() {
  try { fs.writeFileSync(recentFile, JSON.stringify([])); } catch (e) { /* ignore */ }
  updateRecentFilesMenu();
}

// === IPC handlers ===
function setupIpcHandlers() {
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open MSE File',
      filters: [
        { name: 'Metin2 Particle Effect', extensions: ['mse'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    addRecentFile(filePath);
    return { filePath, content };
  });

  ipcMain.handle('dialog:saveFile', async (_, { content, defaultPath }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save MSE File',
      defaultPath: defaultPath || 'effect.mse',
      filters: [
        { name: 'Metin2 Particle Effect', extensions: ['mse'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, content, 'utf8');
    addRecentFile(result.filePath);
    return { filePath: result.filePath };
  });

  ipcMain.handle('dialog:importMSE', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import MSE File',
      filters: [
        { name: 'Metin2 Particle Effect', extensions: ['mse'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const files = result.filePaths.map(fp => ({
      filePath: fp,
      name: path.basename(fp),
      content: fs.readFileSync(fp, 'utf8'),
    }));
    result.filePaths.forEach(fp => addRecentFile(fp));
    return files;
  });

  ipcMain.handle('dialog:exportMSE', async (_, { content, defaultPath }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export MSE File',
      defaultPath: defaultPath || 'effect.mse',
      filters: [
        { name: 'Metin2 Particle Effect', extensions: ['mse'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { filePath: result.filePath };
  });

  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPlatform', () => ({ platform: process.platform, arch: process.arch }));
  ipcMain.handle('app:getRecentFiles', () => loadRecentFiles());
  ipcMain.handle('app:getPath', (_, name) => app.getPath(name));

  ipcMain.handle('updater:checkForUpdates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { available: result.updateInfo.version !== app.getVersion(), info: result.updateInfo };
    } catch (e) {
      return { available: false, error: e.message };
    }
  });

  ipcMain.handle('updater:downloadUpdate', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('updater:quitAndInstall', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('crash:report', (_, report) => {
    crashReporter.logCrash(report);
    return { logged: true };
  });

  ipcMain.handle('menu:openRecent', (_, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return { filePath, content };
    } catch (e) {
      removeRecentFile(filePath);
      return null;
    }
  });
}

// === Menu ===
let menuTemplate = null;

function buildMenu() {
  const recentFiles = loadRecentFiles();
  const recentSubmenu = recentFiles.length > 0
    ? recentFiles.map(fp => ({
        label: path.basename(fp),
        tooltip: fp,
        click: () => mainWindow.webContents.send('menu-action', 'open-recent', fp),
      })).concat([
        { type: 'separator' },
        { label: 'Clear Recent Files', click: () => clearRecentFiles() },
      ])
    : [{ label: 'No Recent Files', enabled: false }];

  menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-action', 'new') },
        { label: 'Open Project', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu-action', 'open') },
        { label: 'Save Project', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-action', 'save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-action', 'save-as') },
        { type: 'separator' },
        { label: 'Import MSE', accelerator: 'CmdOrCtrl+I', click: () => mainWindow.webContents.send('menu-action', 'import-mse') },
        { label: 'Export MSE', accelerator: 'CmdOrCtrl+E', click: () => mainWindow.webContents.send('menu-action', 'export-mse') },
        { label: 'Export EFF', accelerator: 'CmdOrCtrl+Shift+E', click: () => mainWindow.webContents.send('menu-action', 'export-eff') },
        { type: 'separator' },
        { label: 'Open Recent', submenu: recentSubmenu },
        { type: 'separator' },
        { role: 'quit' },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => {
          if (mainWindow) {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }},
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Metin2 Asset Studio Docs',
          click: () => shell.openExternal('https://github.com/anomalyco/Metin2-Asset-Studio'),
        },
        {
          label: 'Check for Updates',
          click: () => updater.checkForUpdatesAndNotify(mainWindow),
        },
        { type: 'separator' },
        { label: 'About', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Metin2 Asset Studio',
            message: `Metin2 Asset Studio Pro v${app.getVersion()}`,
            detail: 'Particle Effect Editor for Metin2\n\nPlatform: Electron | Three.js | React',
          });
        }},
      ]
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

function updateRecentFilesMenu() {
  if (menuTemplate) buildMenu();
}

// === Window creation ===
function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    minWidth: 1024,
    minHeight: 600,
    title: 'Metin2 Asset Studio',
    icon: path.join(__dirname, '..', 'frontend', 'public', 'icon.svg'),
    backgroundColor: '#04060a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (state.isMaximized) mainWindow.maximize();
  if (state.isFullScreen) mainWindow.setFullScreen(true);

  mainWindow.once('ready-to-show', () => { mainWindow.show(); });

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  mainWindow.on('enter-full-screen', () => {
    saveWindowState();
    const menu = Menu.getApplicationMenu();
    if (menu) Menu.setApplicationMenu(null);
  });

  mainWindow.on('leave-full-screen', () => {
    saveWindowState();
    buildMenu();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  buildMenu();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const distPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(distPath);
  }
}

// === Setup IPC on ready ===
function setupAll() {
  setupIpcHandlers();
  createWindow();

  // Auto-updater setup
  if (!isDev) {
    updater.init(mainWindow);
    autoUpdater.checkForUpdates();
  }

  // Check for files passed as args (deep link)
  const fileToOpen = process.argv.find(arg => arg.endsWith('.mse') && arg !== process.argv[0]);
  if (fileToOpen && mainWindow) {
    try {
      const content = fs.readFileSync(fileToOpen, 'utf8');
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('menu-action', 'open-file', { filePath: fileToOpen, content });
      });
      addRecentFile(fileToOpen);
    } catch (e) { /* ignore */ }
  }

  crashReporter.init();
}

// === Single instance lock ===
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Handle deep link file from second instance
      const mseFile = argv.find(arg => arg.endsWith('.mse') && arg !== argv[0]);
      if (mseFile) {
        try {
          const content = fs.readFileSync(mseFile, 'utf8');
          mainWindow.webContents.send('menu-action', 'open-file', { filePath: mseFile, content });
          addRecentFile(mseFile);
        } catch (e) { /* ignore */ }
      }
    }
  });

  // macOS deep link
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (mainWindow && filePath.endsWith('.mse')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        mainWindow.webContents.send('menu-action', 'open-file', { filePath, content });
        addRecentFile(filePath);
      } catch (e) { /* ignore */ }
    }
  });

  app.whenReady().then(setupAll);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    setupIpcHandlers();
    createWindow();
  }
});

// Register protocol for deep link
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('mse', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('mse');
}
