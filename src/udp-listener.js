const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const { BrowserWindow } = require('electron');

const UDP_PORT = 12345;

socket.on('message', (msg, rinfo) => {
    // The message from the Lua addon is now a JSON string.
    // We can forward it directly to the renderer process, which will parse it.
    const jsonString = msg.toString();

    // Find the main browser window.
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
        // Send the raw JSON string to the renderer process on the 'position' channel.
        win.webContents.send('position', jsonString);
    }
    
    // For debugging purposes, you can uncomment this to see the raw JSON in your console.
    // console.log(`Received data: ${jsonString} from ${rinfo.address}:${rinfo.port}`);
});

socket.on('error', (err) => {
    console.error(`UDP server error:\n${err.stack}`);
    socket.close();
});

socket.bind(UDP_PORT);

console.log(`FFXI Atlas UDP listener started on port ${UDP_PORT}`);
