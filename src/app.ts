/// <reference path="chess.js.d.ts" />

import {Chess} from "chess.js";

import {Engine} from "./engine";

import {Evaluator} from "./Evaluator";

import {Chessboard, COLOR, MOVE_INPUT_MODE, INPUT_EVENT_TYPE} from "cm-chessboard";
import "cm-chessboard/styles/cm-chessboard.css";

import {evaluator} from "../src/MaterialEvaluator";

import {EngineAlphaBeta} from "./EngineAlphaBeta";
import {EngineAlphaBetaHp} from "./EngineAlphaBetaHp";
//import {EngineAlphaBetaHpParallel} from "./EngineAlphaBetaHpParallel";
import {EngineMinMaxParallel} from "./EngineMinMaxParallel";
import {EngineTransferrable} from "./EngineTransferrable";

//import {MaterialEngine} from "./materialengine";

// Testing
import {TaskDef} from "./WorkerTask";
import {WorkerTaskABHPP} from "./WorkerTaskABHPP";
 
import {TaskAB} from "./TaskAB";
import { Node88 } from "./GameTree";
import { geoAzimuthalEquidistant } from "d3";

// Worker testing
// import "./taskworker";
//import "file?name=[name].[ext]!awesome-typescript-loader?instanceName=worker&noLib=false!./taskworker";
//import "worker?name=taskworker.js!awesome-typescript-loader?instanceName=worker&noLib=false!./taskworker";



// TODO I think this is a hack (you are correct, it depends on transpiling to es5/commonjs)
declare var require: any;
declare var __VERSION__: any;

class App {

	board: Chessboard;
	game: Chess;
	engine: Engine<Evaluator>;
	timeToThink: number;
	// chessComClient: ChessComClient;

	constructor() {
		console.log("Constructing app");

		// Chess.com client
		// this.chessComClient = new ChessComClient();
		// this.chessComClient.getMoves("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -")

		// Chess game
		this.game = new Chess();
		// this.engine = new MaterialEngine();
		this.timeToThink = 8000;

		this.engine = new EngineAlphaBetaHp<Evaluator>();

		// Print version number
		document.getElementById("version").innerText = __VERSION__;

		// this.game.load_pgn("1. e4 Nh6 2. d4 Ng8 3. Bf4 f6 4. e5 f5 5. h4 b6 6. h5 Kf7 7. h6 gxh6 8. Qh5+ Kg7 9. Qf7+ Kxf7 10. Nh3 h5 11. Be2 Ke8 12. Bxh5#");
		//this.game.load_pgn("1. e4 Nh6 2. d4 Ng8 3. Bf4 f6 4. e5 f5 5. h4 b6 6. h5 Kf7 7. h6 gxh6 8. Qh5+ Kg7 9. Qf7+ Kxf7 10. Nh3 h5");
		//this.game.load_pgn("a3 Nh6 2. b3 e6 3. c3 Bd6");
		// this.game.load_pgn("1. e4 a6 2. d4 f6 3. f4 g5 4. Qh5#");
		// this.game.load_pgn("1. e4 a6 2. d4 f6 ");
		
		//this.game.load("8/p5KQ/1p6/8/1nk5/6P1/8/8 w - - 1 54");


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

		let spriteUrl = require("cm-chessboard/assets/images/chessboard-sprite.svg");
		console.log(spriteUrl);

		this.board = new Chessboard(
			document.getElementById("board"),
			{ 
				orientation: COLOR.white,
				moveInputMode: MOVE_INPUT_MODE.dragPiece,
				position: this.game.fen(),
				responsive: true,
				sprite:  {
					url: spriteUrl
				}

			});

		let inputHandler = (event) => {
			if (event.type === INPUT_EVENT_TYPE.moveDone) {
					const move = {from: event.squareFrom, to: event.squareTo}
					const result = this.game.move(move)
					if (result) {
							event.chessboard.disableMoveInput()
							this.board.setPosition(this.game.fen());

							// Wait for animation
							setTimeout(() => {

								var possibleMoves = this.game.moves();

								// game over
								if (possibleMoves.length === 0) {
									alert("Gmae over!");
									return;
								}

								let movea = this.engine.getBestMove(this.game.fen(), this.timeToThink);

								movea.then((move: string) => {
									console.log("The best move was: " + move);
									this.game.move(move);
									this.board.setPosition(this.game.fen());
									this.board.enableMoveInput(inputHandler, COLOR.white)
								})

							}, 150);

					} else {
							console.warn("invalid move", move)
					}
					return result
			} else {
					return true
			}
	}

		this.board.enableMoveInput(inputHandler, COLOR.white)

	}

	loadPgn(pgn: string){
		this.game.load_pgn(pgn);
		this.board.setPosition(this.game.fen());
	}

	load(fen: string){
		console.log("Fen valid: "+this.game.validate_fen(fen));
		this.game.load(fen);
		this.board.setPosition(this.game.fen());
	}


    evaluate(){

        console.log("\"" + this.game.fen() + "\" (" + evaluator(this.game).numeric + ")");
    }

}

export function create(): App {
	return new App();
}

export let message = "App.ts";
export function testttt(){
	console.log("tttt");
}
