const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // Project javascript file.
  entry: "./src/index.js",
  // Output. which is loaded in the index.html.
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },

  // Automatically reload the page when compilation is done from dist.
  devServer: {
    port: 3000,
    compress: true,
    contentBase: 'dist/',
  },

  module: {
    rules: [
      // Add babel-loader to compile ES6 to ES5
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['es2015', 'stage-0']
          },
        }],
      },
      // Add sass-loader to compile scss to css
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract([
          'css-loader', 'sass-loader'
        ]),
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin({
      filename: 'bundle.css',
      allChunks: true,
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'data'),
        to: path.resolve(__dirname, 'dist') + '/data'
      }
    ])
  ],


};
