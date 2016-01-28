require('es6-promise').polyfill();
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: {
		entry: "./src/entry.js"
			// ,tsworker: "./src/tsworker"
	},

	resolve: {
		extensions: ['', '.ts', '.tsx', '.tsw', '.webpack.js', '.web.js', '.js']
	},

	// Source maps support (or 'inline-source-map' also works)
	devtool: 'inline-source-map',

	output: {
		publicPath: '',
		path: path.join(__dirname, '/dist'),
		filename: "[name].js"
	},
	plugins: [
		new ExtractTextPlugin('entry.css')
	],
	module: {
		loaders: [

		    {
                loader: 'babel-loader',
                test: /\.js$/,
                query: {
                  presets: 'es2015',
                }
            },


			// { test: /\.css$/, loader: "style!css" },

			// {
			// 	test: /tsworker\.ts$/,
			// 	loader: 'awesome-typescript-loader'
			// },

			{
				test: /\.css$/,
				loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
			},

			{
				test: /\.ts$/,
				// loader: 'awesome-typescript-loader'
				loaders: [
					'babel-loader?presets=es2015',
					'awesome-typescript-loader?instanceName=app'
				]
			},

			{
				test: /\.tsx$/,
				loaders: [
					// 'worker',
					// 'babel-loader?presets=es2015',
					'file?name=[name].[ext]',
					'awesome-typescript-loader?instanceName=worker&noLib=true'
				]
			},

			{
				test: /\.(jpe?g|png|gif|svg)$/i,
				loaders: [
					'file?hash=sha512&digest=hex&name=images/[name]-[hash].[ext]',
					'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
				]
			}

		]
	},
	externals: [{
		child_process: 'empty'
	}]
};