const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// const positionEmitter = new EventEmitter();
// global.sharedPositionEmitter = positionEmitter;
// const eventEmitter = new EventEmitter();

contextBridge.exposeInMainWorld('ffxiAtlas', {
  onPositionUpdate: (callback) => ipcRenderer.on('position', (event, data) => callback(data)),
  loadZones: () => {
    const filePath = path.join('./resources', 'zones.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
});