const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

// Define the folders that need to be available during development.
const assetsToCopy = ['assets', 'data', 'scripts'];

// We only need to copy these files for the dev server. For packaging,
// we will use the more efficient `extraResource` option in forge.config.js.
const plugins = process.env.NODE_ENV === 'development'
  ? assetsToCopy.map(asset => new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, asset),
          to: asset,
        },
      ],
    }))
  : [];

module.exports = plugins;
