const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const emitter = global.sharedPositionEmitter || require('events').EventEmitter.prototype;
const EventEmitter = require('events');

const eventEmitter = new EventEmitter();

socket.on('message', (msg, rinfo) => {
    const [x, , z, zoneId] = msg.toString().split(',');
    emitter.emit('position', { x: parseFloat(x), z: parseFloat(z), zoneId });
    eventEmitter.emit('position', { x: parseFloat(x), z: parseFloat(z), zoneId });
    // For debugging purposes, log the received position
    console.log(`Received position update: x=${x}, z=${z}, zoneId=${zoneId} from ${rinfo.address}:${rinfo.port}`);
});

socket.bind(12345);
