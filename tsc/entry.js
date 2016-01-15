require("./style.css");
// var chess = require("chess")
// var chessjs = require("chess.js")

//var chessjs = require("./chess.js/chess")
// var chessboard = require("chessboardjs")
var jq = require("jquery")
window.$ = jq;
// console.log(chessjs);


// var d3 = require("./d3");
// window.d3 = d3;

require("file?name=index.html!./index.html");

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

// window.chessjs = chessjs;
// window.chessboard = chessboard;

import * as appmod from "./app";
// var appmod = require("./app");
var app = appmod.create();
// console.log(app);
window.app = app;


// var api = require("./WorkerTask");
// var MyWorker = require("worker!./jsworker.js");
// var worker = new MyWorker();
// worker.addEventListener("message", function(event) {
// 	console.log(event.data);
// });

// setTimeout(function() {
// 	console.log("D");
// 	worker.postMessage(new api.WorkerTask("rnbq1bnr/p1pppk1p/1p6/4Pp1p/3P1B2/7N/PPP2PP1/RN2KB1R w KQ - 0 11"));
// }, 200);


// require("awesome-typescript-loader?tsconfig='../tsconfig-worker.json'!./tsworker.ts");

// var slave = require("file!./thread-slave.js");
// var threads = require('threads');
// threads.config.set({
//   fallback: {
//     slaveScriptUrl: slave}});
// var Pool = threads.Pool;
// var pool = new Pool(4);

// const jobC = pool.run(
//   function(input, done) {
//     const hash = "BATMAN";
//     done(hash, input);
//   }
// ).send('Hash this string!');

// jobC
//   .on('done', function(hash, input) {
//     console.log(`Job C hashed: md5("${input}") = "${hash}"`);
//   });






