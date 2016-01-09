/// <reference path="chess.js.d.ts" />
/// <reference path="chessboardjs.d.ts" />
/// <reference path="jquery.d.ts" />
"use strict";


import * as jquery from "jquery";
// import chessjs = require("./chess.js/chess")
// import * as MaterialEngine from "materialengine.ts";

import {MaterialEngine} from "./materialengine";
//import MaterialEngine = require("./materialengine");
import Chess = require("chess.js");
// import * as cj from "chess.js";
// import {Chess} from "chess.js";
import ChessBoard = require("chessboardjs");
import "chessboardjs/www/css/chessboard.css";


// TODO I think this is a hack
declare var require: any;

class App {

	board: ChessBoard;
	game: Chess;
	engine: MaterialEngine;

	constructor(){
		console.log("Constructing app");

		// Chess game
		this.game = new Chess();
		this.engine = new MaterialEngine();

		// this.game.load_pgn("1. e4 Nh6 2. d4 Ng8 3. Bf4 f6 4. e5 f5 5. h4 b6 6. h5 Kf7 7. h6 gxh6 8. Qh5+ Kg7 9. Qf7+ Kxf7 10. Nh3 h5 11. Be2 Ke8 12. Bxh5#");
		// this.game.load_pgn("1. e4 Nh6 2. d4 Ng8 3. Bf4 f6 4. e5 f5 5. h4 b6 6. h5 Kf7 7. h6 gxh6 8. Qh5+ Kg7 9. Qf7+ Kxf7 10. Nh3 h5");


		// ChessBoard
		let pieceReq = (p) => {	
			return require("chessboardjs/www/img/chesspieces/alpha/" + p + ".png");
		};

		this.board = new ChessBoard("board", {
			draggable: true,
			pieceTheme: pieceReq, 
			position: this.game.fen(),
			onDragStart: (...args: any[]) => this.onDragStart.apply(this, args),
			onDrop: (...args: any[]) => this.onDrop.apply(this, args),
			onSnapEnd: (...args: any[]) => this.onSnapEnd.apply(this, args)
		});
	}

	// do not pick up pieces if the game is over
	// only pick up pieces for White
	onDragStart(source, piece, position, orientation) {

		if (this.game.in_checkmate() === true || this.game.in_draw() === true ||
			piece.search(/^b/) !== -1) {
			return false;
		}
	};

	onDrop(source, target) {

		// see if the move is legal
		var move = this.game.move({
			from: source,
			to: target,
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		});

		// illegal move
		if (move === null) return 'snapback';





	//   // make random legal move for black
	  let that = this;
	  setTimeout(() => {

		  console.log("Making move");

		  var possibleMoves = that.game.moves();

		  // game over
		  if (possibleMoves.length === 0) return;

		  // let move = that.engine.findBestMove(that.game.fen(), 1);
		  let move = that.engine.findBestMoveRecursive(that.game.fen(), 3);

		  // var randomIndex = Math.floor(Math.random() * possibleMoves.length);
		  // let move = possibleMoves[randomIndex];

		  that.game.move(move);
		  that.board.position(that.game.fen());


	  }, 150); // Wait for animation
	};

	// update the board position after the piece snap
	// for castling, en passant, pawn promotion
	onSnapEnd() {
	  this.board.position(this.game.fen());
	};


}

export function create(): App {
	return new App();
}

export let message = "App.ts";
export function testttt(){
	console.log("tttt");
}
