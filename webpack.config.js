require('es6-promise').polyfill();
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	entry: {
		entry: "./src/entry.js",
    //    test: "./test/run.ts"
		// , tsworker: "awesome-typescript-loader?instanceName=worker&noLib=true!./src/taskworker"
			// ,tsworker: "./src/tsworker"
	},


	optimization: {
		minimizer: [new UglifyJsPlugin({
			uglifyOptions: {
				sourceMap: true,
				safari10: true
    }
		})]
	},

	resolve: {
		extensions: ['.ts', '.tsx', '.webpack.js', '.web.js', '.js']
	},

	// Source maps support (or 'inline-source-map' also works)
	devtool: 'source-map',

	output: {
		publicPath: '',
		path: path.join(__dirname, '/dist'),
		filename: "[name].js"
	},
	plugins: [
		new ExtractTextPlugin('entry.css'),
		new CopyWebpackPlugin([
				//{ from: 'node_modules/cm-chessboard/assets', to: 'assets' }
		]),
		new webpack.DefinePlugin({
			__VERSION__: JSON.stringify(require("./package.json").version)
		}),
	],
	module: {
		
		rules: [

			/*
		    {
                loader: 'babel-loader',
                test: /\.js$/,
                query: {
                  presets: 'es2015',
                }
            },
*/

			// { test: /\.css$/, loader: "style!css" },

			// {
			// 	test: /tsworker\.ts$/,
			// 	loader: 'awesome-typescript-loader'
			// },

			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'] //ExtractTextPlugin.extract('style-loader', 'css-loader')
			},

			/*
			{
				test: /\.ts$/,
				// loader: 'awesome-typescript-loader'
				loaders: [
					'babel-loader?presets=es2015',
					'awesome-typescript-loader?instanceName=app'
				]
			},
			*/
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			  },

			//{
			//	test: /\.tsx$/,
			//	loaders: [
			//		// 'worker',
			//		// 'babel-loader?presets=es2015',
			//		'file?name=[name].[ext]',
			//		'awesome-typescript-loader?instanceName=worker&noLib=true'
			//	]
			//},

			
			{
				test: /\.(jpe?g|png|gif|svg)$/i,
				use: [
					'file-loader?hash=sha512&digest=hex&name=images/[name]-[hash].[ext]',
					{
						loader: 'image-webpack-loader',
						options: {
							svgo: {
								enabled: false
							}
						}
					}
				]
			}
			

		]
		
	},
	externals: [{
		child_process: 'empty'
	}]
};