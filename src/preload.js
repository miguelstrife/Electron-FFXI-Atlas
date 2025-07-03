const { contextBridge } = require('electron');
const { EventEmitter } = require('events');

const positionEmitter = new EventEmitter();
global.sharedPositionEmitter = positionEmitter;

contextBridge.exposeInMainWorld('ffxiAtlas', {
  onPositionUpdate: (callback) => positionEmitter.on('position', callback)
});