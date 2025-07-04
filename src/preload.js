const { contextBridge } = require('electron');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

const positionEmitter = new EventEmitter();
global.sharedPositionEmitter = positionEmitter;
const eventEmitter = new EventEmitter();

contextBridge.exposeInMainWorld('ffxiAtlas', {
  onPositionUpdate: (callback) => positionEmitter.on('position', callback),
  loadZones: () => {
    const filePath = path.join('./resources', 'zones.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
});