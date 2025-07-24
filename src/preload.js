const { contextBridge, ipcRenderer, app } = require('electron');
const fs = require('fs');
const path = require('path');

// This helper function builds the correct path to your extra resources.
const getResourcePath = (...paths) => {
  const isPackaged = __dirname.includes('app.asar');
  // In a packaged app, process.resourcesPath points to the 'resources' directory.
  // In development, we construct the path relative to the project root.
  const basePath = isPackaged
    ? process.resourcesPath
    : path.join(__dirname, '..'); // In dev, __dirname is 'src', so we go up one level

  return path.join(basePath, ...paths);
};

contextBridge.exposeInMainWorld('ffxiAtlas', {
  onPositionUpdate: (callback) => ipcRenderer.on('position', (event, data) => callback(data)),
  loadZones: () => {
    // Use the helper to get the correct path to your data file.
    const filePath = getResourcePath('data', 'zonesWithMaps.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  },
  // We also expose the helper function so the renderer can use it to build image paths.
  getPath: getResourcePath,
  getAssetPath: (relativePath) => {
    return `assets/maps/${relativePath.split('/').pop()}`; // returns a relative path
  },
});
