const { platform } = require('os');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    // Using a function for the ignore rule is more explicit and can be more reliable.
    // This function will return 'true' for any file path that starts with '/assets',
    // effectively ignoring it during the initial file scan.
    ignore: (filePath) => {
      // The filePath passed here is relative to the project root and starts with a "/"
      if (filePath.startsWith('/assets')) {
        return true;
      }
      return false;
    },
    // Use extraResource to efficiently copy large directories into the final package's resources folder.
    extraResource: [
      './assets',
      './data',
      './scripts',
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip'
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // You can add configuration options here, for example, to set up a signing certificate.
        // certificateFile: './certs/my-cert.pfx',
        // certificatePassword: process.env.CERTIFICATE_PASSWORD
      },
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/renderer.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
  ],
};
