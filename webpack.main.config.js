module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  target: 'electron-main',
  // Use a function to dynamically mark electron modules as external
  externals: (context, request, callback) => {
    if (request.startsWith('electron')) {
      return callback(null, `commonjs2 ${request}`);
    }
    callback();
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};