require("./style.css");
// var chess = require("chess")
var chessjs = require("chess.js")

//var chessjs = require("./chess.js/chess")
var chessboard = require("chessboardjs")
var jq = require("jquery")
window.$ = jq;
// console.log(chessjs);


var url1 = require("file?name=bbb.png!../node_modules/chessboardjs/www/img/chesspieces/alpha/wP.png");
var url2 = require("../node_modules/chessboardjs/www/img/chesspieces/alpha/bP.png");
// console.log(url1);
// console.log(url2);

// require.context(
//   "./../node_modules/chessboardjs/www/img", # context folder
//   true, # include subdirectories
//   /.*/ #RegExp
// )("./" + expr + "")
// req=require.context("./../node_modules/chessboardjs/www/img/chesspieces/alpha", true, /.*.png/); 
// console.log(req("file?name=aaa[name].[ext]?!./" + expr + ""));

// require("./../node_modules/chessboardjs/www/img/chesspieces/alpha" + /^.*$/);

window.chessjs = chessjs;
window.chessboard = chessboard;


document.write("batman");

var appmod = require("./app.ts");
var app = appmod.create();
// console.log(app);
window.app = app;
