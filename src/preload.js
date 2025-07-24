const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Expose core Electron properties to the renderer process in a secure way.
// This is essential for determining the correct asset paths.
contextBridge.exposeInMainWorld('electronAPI', {
  isPackaged: app.isPackaged,
  resourcesPath: process.resourcesPath,
});

// This helper function constructs the correct path to an asset.
// It works in both development and a packaged app.
const getAssetPath = (...paths) => {
  // The base path is different in development vs. production.
  // The webpack plugin sets NODE_ENV for us, which we can use to check.
  const isDev = process.env.NODE_ENV === 'development';

  // In development, our 'data' folder is copied by webpack to the build output directory.
  // The preload script's __dirname is inside '.webpack/renderer/main_window',
  // and the data folder is at '.webpack/renderer/data'. So we go up one level.
  const devBasePath = path.join(__dirname, '..');

  // In production, 'extraResource' copies the 'data' folder into the application's
  // resources directory. `process.resourcesPath` points to this directory.
  const prodBasePath = process.resourcesPath;

  const basePath = isDev ? devBasePath : prodBasePath;

  return path.join(basePath, 'data', ...paths);
};

contextBridge.exposeInMainWorld('ffxiAtlas', {
  onPositionUpdate: (callback) => ipcRenderer.on('position', (event, data) => callback(data)),
  loadZones: () => {
    // Use the helper function to get the correct path.
    const filePath = getAssetPath('zonesWithMaps.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
});
