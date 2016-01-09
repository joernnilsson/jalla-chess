require('es6-promise').polyfill();
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: "./src/entry.js",

	resolve: {
		extensions: ['', '.ts', '.webpack.js', '.web.js', '.js']
	},

	  // Source maps support (or 'inline-source-map' also works)
  devtool: 'source-map',

	output: {
		publicPath: '',
		path: path.join(__dirname, '/dist'),
		filename: "app.js"
	},
  plugins: [
      new ExtractTextPlugin('app.css')
  ],
	module: {
		loaders: [
			// { test: /\.css$/, loader: "style!css" },

        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
        },

			  {
				test: /\.ts$/,
				loader: 'awesome-typescript-loader'
			  },
			  
				{
					test: /\.(jpe?g|png|gif|svg)$/i,
					loaders: [
						'file?hash=sha512&digest=hex&name=images/[name]-[hash].[ext]',
						'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
					]
				}

		]
	}
};