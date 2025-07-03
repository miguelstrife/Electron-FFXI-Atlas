const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
    const [x, y, z] = msg.toString().split(',').map(parseFloat);
    // Use the data in your UI
    console.log(`Player position: X=${x}, Y=${y}, Z=${z}`);
});

server.bind(12345);
