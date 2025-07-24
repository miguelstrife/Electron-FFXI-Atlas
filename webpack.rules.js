module.exports = [
  // Add support for native node modules
  {
    test: /\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    test: /\.jsx?$/,
    use: {
      loader: 'babel-loader',
      options: {
        exclude: /node_modules/,
        presets: ['@babel/preset-react']
      }
    }
  },
  // Add support for CSS
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
  // Add support for images
  {
    test: /\.(png|jpg|jpeg|gif|svg)$/,
    use: 'file-loader',
  },
];
