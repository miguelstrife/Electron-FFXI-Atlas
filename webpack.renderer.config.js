const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  // Add externals to prevent webpack from trying to bundle Node.js built-in modules.
  // This is the correct way to handle modules like 'fs' and 'path' in a preload script.
  externals: {
    fs: 'require("fs")',
    path: 'require("path")',
  },
};
