/// <reference path="chess.d.ts" />
/// <reference path="chessboardjs.d.ts" />
/// <reference path="jquery.d.ts" />
"use strict";
//import * as ChessBoard from "chessboardjs"
var ChessBoard = require("chessboardjs");
require("chessboardjs/www/css/chessboard.css");
var App = (function () {
    function App() {
        console.log("Constructing app");
        // let cfg: ChessBoard.Config = {
        // 	position: "start"
        // };
        // this.board = new ChessBoard("board", {position: "start"});
        var pieceReq = function (p) {
            var pm = require("chessboardjs/www/css/chessboard.css");
            return pm;
            //return import("./../node_modules/chessboardjs/www/img/chesspieces/alpha/" + p + ".png");
        };
        this.board = new ChessBoard("board");
    }
    return App;
})();
function create() {
    return new App();
}
exports.create = create;
exports.message = "App.ts";
function testttt() {
    console.log("tttt");
}
exports.testttt = testttt;
//# sourceMappingURL=app.js.map