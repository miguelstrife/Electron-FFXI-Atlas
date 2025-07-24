const { app, BrowserWindow, globalShortcut } = require('electron/main');
const path = require('path');

// Start UDP listener
require('./udp-listener');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1550,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer.html'));
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});