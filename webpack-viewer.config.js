const path = require('path');

module.exports = {
  entry: './src/viewer/export.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: false
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel'
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'standalone-viewer.js',
    library: 'standaloneViewer'
  }
};
