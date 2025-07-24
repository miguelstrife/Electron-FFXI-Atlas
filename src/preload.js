const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('ffxiAtlas', {
  onPositionUpdate: (callback) => ipcRenderer.on('position', (event, data) => callback(data)),
  loadZones: () => {
    const filePath = path.join('./data', 'zonesWithMaps.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
});