/// <reference path="chess.js.d.ts" />
/// <reference path="chessboardjs.d.ts" />

// import {Chess} from "chess.js";
import * as ChessBoard from "chessboardjs";
//import {ChessBoard} from "chessboardjs";
import {Chess} from "chess.js";
import "chessboardjs/www/css/chessboard.css";
// import {ChessComClient} from "./ChessComClient";
import {Engine} from "./engine";

import {Evaluator} from "./Evaluator";


import {evaluator} from "../src/MaterialEvaluator";

import {EngineAlphaBeta} from "./EngineAlphaBeta";
import {EngineAlphaBetaHp} from "./EngineAlphaBetaHp";
import {EngineAlphaBetaHpParallel} from "./EngineAlphaBetaHpParallel";
import {EngineMinMaxParallel} from "./EngineMinMaxParallel";
import {EngineTransferrable} from "./EngineTransferrable";

//import {MaterialEngine} from "./materialengine";

// Testing
import {TaskWorkerPool} from "./TaskWorkerPool";
import {TaskDef} from "./WorkerTask";
import {WorkerTaskABHPP} from "./WorkerTaskABHPP";
 
import {TaskAB} from "./ABMasterWorker";
import { Node88 } from "./GameTree";

// Worker testing
// import "./taskworker";
//import "file?name=[name].[ext]!awesome-typescript-loader?instanceName=worker&noLib=false!./taskworker";
//import "worker?name=taskworker.js!awesome-typescript-loader?instanceName=worker&noLib=false!./taskworker";



// TODO I think this is a hack (you are correct, it depends on transpiling to es5/commonjs)
declare var require: any;

class App {

	board: ChessBoard;
	game: Chess;
	engine: Engine<Evaluator>;
	engine2: Engine<Evaluator>;
	engine3: Engine<Evaluator>;
	// chessComClient: ChessComClient;

	constructor() {
		console.log("Constructing app");

		// Chess.com client
		// this.chessComClient = new ChessComClient();
		// this.chessComClient.getMoves("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -")

		// Chess game
		this.game = new Chess();
		// this.engine = new MaterialEngine();

		// this.engine = new EngineMinMaxParallel<EvaluatorMaterialCounter>();
		this.engine3 = new EngineAlphaBetaHpParallel<Evaluator>();
		this.engine2 = new EngineAlphaBeta<Evaluator>();
		this.engine = new EngineAlphaBetaHp<Evaluator>();
		//this.engine = new EngineTransferrable<EvaluatorMaterialCounter>();

		// this.game.load_pgn("1. e4 Nh6 2. d4 Ng8 3. Bf4 f6 4. e5 f5 5. h4 b6 6. h5 Kf7 7. h6 gxh6 8. Qh5+ Kg7 9. Qf7+ Kxf7 10. Nh3 h5 11. Be2 Ke8 12. Bxh5#");
		//this.game.load_pgn("1. e4 Nh6 2. d4 Ng8 3. Bf4 f6 4. e5 f5 5. h4 b6 6. h5 Kf7 7. h6 gxh6 8. Qh5+ Kg7 9. Qf7+ Kxf7 10. Nh3 h5");
		//this.game.load_pgn("a3 Nh6 2. b3 e6 3. c3 Bd6");
		// this.game.load_pgn("1. e4 a6 2. d4 f6 3. f4 g5 4. Qh5#");
		// this.game.load_pgn("1. e4 a6 2. d4 f6 ");



		// let tt: WorkerTaskABHPP = new WorkerTaskABHPP({test: "abc"});
		// let pool: TaskWorkerPool = new TaskWorkerPool(1, true);
		// let out: Promise<any> = pool.enqueueTask(tt);
		// out.then((res) => {
		// 	console.log("Got response:");
		// 	console.log(res);
		// })


		// Test ts task worker
		// NOTE This only works because we happen to transpile to es5 with commonjs modules
		//let TWC = require("worker?name=taskworker-[hash].js!./taskworker");
		//let tw: Worker = new TWC();
		//tw.postMessage("Batman");


		// Test run
		/*
		let sim = new Chess();
		let fen = "r1bq1bnr/p1ppp2p/np4k1/3PPp1p/5B2/7N/PPP2PPR/RN2KB2 w Q - 1 13";
		sim.load(fen);
		let root = new Node88(fen, null, null);
		let task = new TaskAB(root);
		task.alphaBeta(sim, root, 2, -11.615384615384617, -10.830769230769228, true, []);
	*/



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

	loadPgn(pgn: string){
		this.game.load_pgn(pgn);
		this.board.position(this.game.fen());
	}

	load(fen: string){
		console.log("Fen valid: "+this.game.validate_fen(fen));
		this.game.load(fen);
		this.board.position(this.game.fen());
	}


    evaluate(){

        console.log("\"" + this.game.fen() + "\" (" + evaluator(this.game).numeric + ")");
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
			console.log(possibleMoves);

		  // game over
		  if (possibleMoves.length === 0) {
			  alert("Gmae over!");
			  return;
		  }




		  // let move = that.engine.findBestMove(that.game.fen(), 1);
		  // let movea = that.engine.findBestMoveAsync(that.game.fen(), 3000);
		  // let movea = that.engine.findBestMoveParallel(that.game.fen(), 100);
		  //let movea = that.engine.findBestMoveAlphaBeta(that.game.fen(), 500);

		  // let movet = that.engine2.getBestMove(that.game.fen());
		  let movea = that.engine.getBestMove(that.game.fen(), 8000);

		  movea.then((move: string) => {
			  console.log("The best move was: " + move);
			  that.game.move(move);
			  that.board.position(that.game.fen());
		  })


		  // let move = that.engine.findBestMoveRecursive(that.game.fen(), 3);


		  // var randomIndex = Math.floor(Math.random() * possibleMoves.length);
		  // let move = possibleMoves[randomIndex];

		  // that.game.move(move);
		  // that.board.position(that.game.fen());


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
