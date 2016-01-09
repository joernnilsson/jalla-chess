var gulp             = require('gulp');
var gutil            = require('gulp-util');
var webpack          = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig    = require('./webpack.config.js');
var plugins          = require('gulp-load-plugins')();
var del              = require('del');



function devServer() {

  // modify some webpack config options
  var config = Object.create(webpackConfig);

  // Start a webpack-dev-server
  new WebpackDevServer(webpack(config), {
  	path: config.path,
    contentBase: 'src/',
    publicPath: '/' + config.output.publicPath,
    stats: {colors: true},
    inline: true,
    hot: false
  }).listen(8080, '0.0.0.0', function(err) {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err);
    }
    gutil.log('[webpack-dev-server]', 'http://localhost:3000/webpack-dev-server/index.html');
  });
}

function copy() {
  gulp.src('src/index.html').pipe(gulp.dest('dist'));
  gulp.src('node_modules/chessboardjs/www/img/**/*').pipe(gulp.dest('dist/img'));
  // gulp.src('src/views/**/*.html').pipe(gulp.dest('dist/views'));
  // gulp.src('src/images/**/*').pipe(gulp.dest('dist/images'));
}

function clean() {
  return del(['dist/**/*']);
}


// Clean old dist files
gulp.task('clean', clean);


// Clean old dist files
gulp.task('copy', copy);

// Clean old dist files
gulp.task('clean', clean);

// Start development server
gulp.task('serve', devServer);

// The development server (the recommended option for development)
gulp.task('default', ['serve']);