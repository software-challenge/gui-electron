const path = require('path');

module.exports = {
  entry: './src/viewer/Viewer.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
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
    filename: 'standalone-viewer.js',
    path: path.resolve(__dirname, 'dist')
  }
};
