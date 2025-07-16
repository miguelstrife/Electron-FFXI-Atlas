const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
// const emitter = global.sharedPositionEmitter || require('events').EventEmitter.prototype;
// const EventEmitter = require('events');
const { BrowserWindow } = require('electron');


// const eventEmitter = new EventEmitter();
const UDP_PORT = 12345;

socket.on('message', (msg, rinfo) => {
    const [x, y, z, zoneId] = msg.toString().split(',');
    const data = { x: parseFloat(x), y: parseFloat(y), z: parseFloat(z), zoneId: zoneId.trim() };
    //Send to renderer process
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
        win.webContents.send('position', data);
    }
    // emitter.emit('position', { x: parseFloat(x), z: parseFloat(z), zoneId });
    // eventEmitter.emit('position', { x: parseFloat(x), z: parseFloat(z), zoneId });
    // For debugging purposes, log the received position
    // console.log(`Received position update: x=${x}, y=${y}, z=${z}, zoneId=${zoneId} from ${rinfo.address}:${rinfo.port}`);
});

socket.on('error', (err) => {
        console.error(`UDP server error:\n${err.stack}`);
        udpServer.close();
});

socket.bind(UDP_PORT);
