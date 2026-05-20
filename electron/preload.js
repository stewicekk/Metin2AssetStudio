const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_, action, ...args) => callback(action, ...args));
  },

  // File dialogs
  openFile: async () => {
    const result = await ipcRenderer.invoke('dialog:openFile');
    return result;
  },

  saveFile: async (content, defaultPath) => {
    const result = await ipcRenderer.invoke('dialog:saveFile', { content, defaultPath });
    return result;
  },

  importMSE: async () => {
    const result = await ipcRenderer.invoke('dialog:importMSE');
    return result;
  },

  exportMSE: async (content, defaultPath) => {
    const result = await ipcRenderer.invoke('dialog:exportMSE', { content, defaultPath });
    return result;
  },

  // App info
  getVersion: async () => {
    return await ipcRenderer.invoke('app:getVersion');
  },

  getPlatform: async () => {
    return await ipcRenderer.invoke('app:getPlatform');
  },

  getPath: async (name) => {
    return await ipcRenderer.invoke('app:getPath', name);
  },

  getRecentFiles: async () => {
    return await ipcRenderer.invoke('app:getRecentFiles');
  },

  openRecentFile: async (filePath) => {
    return await ipcRenderer.invoke('menu:openRecent', filePath);
  },

  // Updater
  checkForUpdates: async () => {
    return await ipcRenderer.invoke('updater:checkForUpdates');
  },

  downloadUpdate: async () => {
    return await ipcRenderer.invoke('updater:downloadUpdate');
  },

  quitAndInstall: async () => {
    return await ipcRenderer.invoke('updater:quitAndInstall');
  },

  // Crash reporting
  reportCrash: async (report) => {
    return await ipcRenderer.invoke('crash:report', report);
  },

  // Updater event listeners
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update:available', (_, info) => callback(info));
  },

  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update:downloaded', (_, info) => callback(info));
  },

  onUpdateError: (callback) => {
    ipcRenderer.on('update:error', (_, error) => callback(error));
  },

  onUpdateProgress: (callback) => {
    ipcRenderer.on('update:progress', (_, percent) => callback(percent));
  },
});
