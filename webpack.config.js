var path = require('path');

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
    contentBase: 'dist/',
    inline: true
  },
  // Add sass-loader to compile scss to css
  module: {
    rules: [{
      test: /\.scss$/,
      use: [{
        loader: "style-loader" // creates style nodes from JS strings
      }, {
        loader: "css-loader" // translates CSS into CommonJS
      }, {
        loader: "sass-loader" // compiles Sass to CSS
      }]
    }]
  },

};
